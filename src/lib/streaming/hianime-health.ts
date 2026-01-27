/**
 * HiAnime Health Check Service
 * Checks if HiAnime CDN is accessible from this server
 */

import { getOrSetJSON } from "@/lib/redis";

export interface HiAnimeHealthStatus {
  available: boolean;
  lastChecked: number;
  testedUrls: Array<{
    url: string;
    status: number;
    responseTime: number;
    error?: string;
  }>;
  reason?: string;
}

// Cache key and TTL for health status
const HEALTH_CACHE_KEY = "streaming:hianime:health:v2";
const HEALTH_CACHE_TTL = 600; // 10 minutes - don't check too often

/**
 * Test if a CDN URL is accessible directly (not blocked with 403)
 */
async function testDirectCDN(
  cdnUrl: string
): Promise<{ status: number; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Test directly to the CDN with proper headers
    const response = await fetch(cdnUrl, {
      method: "HEAD", // HEAD request is lighter
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://hianime.to/",
        Origin: "https://hianime.to",
      },
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    return { status: response.status, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 0,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if HiAnime CDN is accessible from this server
 * Tests actual CDN domains to verify we're not blocked
 */
async function checkHiAnimeCDN(): Promise<HiAnimeHealthStatus> {
  // Known HiAnime/Megacloud CDN domains
  // We test the base domains - if we get 403 we're blocked
  const testUrls = [
    "https://megacloud.club/", // Main Megacloud
    "https://rapid-cloud.co/", // Rapid Cloud (alternative)
    "https://s3taku.com/", // Taku CDN
  ];

  const results: HiAnimeHealthStatus["testedUrls"] = [];
  let anySuccess = false;

  // Test up to 3 URLs
  for (const url of testUrls.slice(0, 3)) {
    const result = await testDirectCDN(url);
    results.push({ url, ...result });

    // Success = not 403 and not network error
    // Any response other than 403 means we're not blocked
    // (404, 400, 200, 301, etc. are all "not blocked")
    if (result.status !== 403 && result.status !== 0) {
      anySuccess = true;
      break; // One success is enough
    }
  }

  return {
    available: anySuccess,
    lastChecked: Date.now(),
    testedUrls: results,
    reason: anySuccess
      ? undefined
      : "All CDN tests returned 403 (blocked) or failed",
  };
}

/**
 * Get cached HiAnime health status or check fresh
 * Results are cached for 10 minutes to avoid excessive CDN checks
 */
export async function getHiAnimeHealthStatus(): Promise<HiAnimeHealthStatus> {
  const status = await getOrSetJSON<HiAnimeHealthStatus>(
    HEALTH_CACHE_KEY,
    HEALTH_CACHE_TTL,
    checkHiAnimeCDN
  );

  return (
    status || {
      available: false,
      lastChecked: Date.now(),
      testedUrls: [],
      reason: "Health check failed",
    }
  );
}

/**
 * Check if HiAnime is available (quick cached check)
 * Use this for fast availability checks in other APIs
 */
export async function isHiAnimeAvailable(): Promise<boolean> {
  try {
    const status = await getHiAnimeHealthStatus();
    return status.available;
  } catch {
    return false;
  }
}
