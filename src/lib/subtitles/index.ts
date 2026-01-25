/**
 * Subtitles Module
 * Unified subtitle fetching with fallback support:
 * 1. OpenSubtitles (primary) - 20 downloads/day free
 * 2. Subdl (fallback) - when OpenSubtitles fails or runs out
 *
 * OpenSubtitles API key: https://www.opensubtitles.com/en/consumers
 * Subdl API key: https://subdl.com/
 */

import {
  searchAnimeSubtitles as searchOpenSubtitles,
  getSubtitleDownloadLink,
  isOpenSubtitlesConfigured,
} from "./opensubtitles";

import { searchAnimeSubtitlesSubdl, isSubdlConfigured } from "./subdl";

// Unified SubtitleResult type
export interface SubtitleResult {
  id: string;
  language: string;
  languageCode: string;
  downloadCount: number;
  rating: number;
  release: string;
  isHD: boolean;
  isTrusted: boolean;
  isAiTranslated: boolean;
  fileId: number;
  downloadUrl?: string;
  source: "opensubtitles" | "subdl";
  matchScore?: number; // 0-100 score for relevance
}

/**
 * Calculate match score for a subtitle based on various factors
 */
function calculateMatchScore(sub: SubtitleResult, query: string, episode: number): number {
  let score = 50; // Base score

  // Trusted source bonus
  if (sub.isTrusted) score += 20;

  // High download count bonus (popularity = quality)
  if (sub.downloadCount > 10000) score += 15;
  else if (sub.downloadCount > 5000) score += 10;
  else if (sub.downloadCount > 1000) score += 5;

  // Rating bonus
  if (sub.rating > 8) score += 10;
  else if (sub.rating > 5) score += 5;

  // HD bonus
  if (sub.isHD) score += 5;

  // AI translated penalty
  if (sub.isAiTranslated) score -= 15;

  // Release name contains episode number bonus
  if (sub.release) {
    const epPatterns = [
      `E${episode.toString().padStart(2, "0")}`,
      `EP${episode}`,
      `Episode ${episode}`,
      ` ${episode} `,
    ];
    if (epPatterns.some((p) => sub.release.toUpperCase().includes(p.toUpperCase()))) {
      score += 10;
    }
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Search for anime subtitles
 * Searches BOTH OpenSubtitles and Subdl in parallel for more results
 */
export async function searchAnimeSubtitles(
  animeTitle: string,
  episodeNumber: number,
  options: {
    languages?: string[];
    seasonNumber?: number;
    year?: number;
  } = {}
): Promise<SubtitleResult[]> {
  const allResults: SubtitleResult[] = [];
  const errors: { source: string; error: Error }[] = [];

  // Search both APIs in parallel
  const promises: Promise<void>[] = [];

  // OpenSubtitles
  if (isOpenSubtitlesConfigured()) {
    promises.push(
      (async () => {
        try {
          console.log("[Subtitles] Searching OpenSubtitles...");
          const results = await searchOpenSubtitles(animeTitle, episodeNumber, options);
          const tagged = results.map((r) => ({
            ...r,
            source: "opensubtitles" as const,
            matchScore: calculateMatchScore(
              { ...r, source: "opensubtitles" },
              animeTitle,
              episodeNumber
            ),
          }));
          allResults.push(...tagged);
          console.log(`[Subtitles] OpenSubtitles found ${tagged.length} results`);
        } catch (error) {
          console.error("[Subtitles] OpenSubtitles error:", error);
          errors.push({
            source: "opensubtitles",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      })()
    );
  }

  // Subdl (search in parallel, not just fallback)
  if (isSubdlConfigured()) {
    promises.push(
      (async () => {
        try {
          console.log("[Subtitles] Searching Subdl...");
          const subdlResults = await searchAnimeSubtitlesSubdl(animeTitle, episodeNumber, {
            languages: options.languages,
            seasonNumber: options.seasonNumber,
          });
          const tagged: SubtitleResult[] = subdlResults.map((r) => ({
            id: r.id,
            language: r.language,
            languageCode: r.languageCode,
            downloadCount: r.downloadCount,
            rating: r.rating,
            release: r.release,
            isHD: r.isHD,
            isTrusted: r.isTrusted,
            isAiTranslated: r.isAiTranslated,
            fileId: r.fileId,
            downloadUrl: r.downloadUrl,
            source: "subdl" as const,
            matchScore: calculateMatchScore(
              { ...r, source: "subdl" } as SubtitleResult,
              animeTitle,
              episodeNumber
            ),
          }));
          allResults.push(...tagged);
          console.log(`[Subtitles] Subdl found ${tagged.length} results`);
        } catch (error) {
          console.error("[Subtitles] Subdl error:", error);
          errors.push({
            source: "subdl",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      })()
    );
  }

  // Wait for all searches to complete
  await Promise.all(promises);

  // If nothing is configured
  if (!isOpenSubtitlesConfigured() && !isSubdlConfigured()) {
    console.log("[Subtitles] No subtitle providers configured");
    return [];
  }

  // Sort by match score (highest first)
  allResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return allResults;
}

/**
 * Get download URL for a subtitle
 * OpenSubtitles requires an API call, Subdl provides direct URLs
 */
export async function getSubtitleDownload(subtitle: SubtitleResult): Promise<string> {
  if (subtitle.source === "subdl" && subtitle.downloadUrl) {
    // Subdl provides direct download URLs
    return subtitle.downloadUrl;
  }

  // OpenSubtitles requires API call for download link
  return getSubtitleDownloadLink(subtitle.fileId);
}

/**
 * Get best Spanish subtitle from results
 * Now uses matchScore for ranking
 */
export function getBestSpanishSubtitle(results: SubtitleResult[]): SubtitleResult | null {
  // Filter Spanish subtitles
  const spanishSubs = results.filter(
    (r) =>
      r.languageCode === "es" ||
      r.language.toLowerCase().includes("spanish") ||
      r.language.toLowerCase().includes("español")
  );

  if (spanishSubs.length === 0) {
    return null;
  }

  // Already sorted by matchScore, return the best one
  return spanishSubs[0];
}

/**
 * Filter results by language
 */
export function filterByLanguage(
  results: SubtitleResult[],
  languageCode: string
): SubtitleResult[] {
  if (languageCode === "all") {
    return results;
  }

  return results.filter(
    (r) =>
      r.languageCode === languageCode ||
      (languageCode === "es" &&
        (r.language.toLowerCase().includes("spanish") ||
          r.language.toLowerCase().includes("español"))) ||
      (languageCode === "en" && r.language.toLowerCase().includes("english"))
  );
}

/**
 * Get unique languages from results
 */
export function getAvailableLanguages(
  results: SubtitleResult[]
): { code: string; name: string; count: number }[] {
  const languageMap = new Map<string, { name: string; count: number }>();

  for (const r of results) {
    const code = r.languageCode;
    const existing = languageMap.get(code);
    if (existing) {
      existing.count++;
    } else {
      languageMap.set(code, { name: r.language, count: 1 });
    }
  }

  return Array.from(languageMap.entries())
    .map(([code, { name, count }]) => ({ code, name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Check if subtitle search is available
 */
export function isSubtitleSearchAvailable(): boolean {
  return isOpenSubtitlesConfigured() || isSubdlConfigured();
}

// Re-export
export { isOpenSubtitlesConfigured } from "./opensubtitles";
export { isSubdlConfigured } from "./subdl";
