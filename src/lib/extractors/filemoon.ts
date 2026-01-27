/* eslint-disable prefer-const */
/**
 * Filemoon / Streamwish Video Extractor
 * Extracts direct video URLs from Filemoon/Streamwish embeds
 * These servers use similar patterns with packed JavaScript
 */

import type { VideoExtractor, ExtractionResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Unpack eval(function(p,a,c,k,e,d) JavaScript packer
 * Common obfuscation used by video hosting sites
 */
function unpackJS(packed: string): string | null {
  try {
    // Extract the packed parameters
    const match = packed.match(
      /eval\(function\(p,a,c,k,e,[dr]\)\{.*?\}\('([^']+)',(\d+),(\d+),'([^']+)'\.split\('\|'\)/
    );

    if (!match) return null;

    let [, p, a, c, k] = match;
    const aNum = parseInt(a);
    const cNum = parseInt(c);
    const kArray = k.split("|");

    // Build the dictionary
    const dict: Record<string, string> = {};
    for (let i = 0; i < cNum; i++) {
      const key = i.toString(aNum);
      dict[key] = kArray[i] || key;
    }

    // Replace all encoded values
    const unpacked = p.replace(/\b(\w+)\b/g, (match) => {
      return dict[match] || match;
    });

    return unpacked;
  } catch (e) {
    console.error("[Unpacker] Failed to unpack:", e);
    return null;
  }
}

export const filemoonExtractor: VideoExtractor = {
  name: "Filemoon",
  patterns: [/filemoon\.(sx|to|wf)\/e\//i, /filemoon\.(sx|to|wf)\/d\//i, /kerapoxy\.cc\/e\//i],

  async extract(embedUrl: string): Promise<ExtractionResult> {
    try {
      console.log(`[Filemoon] Extracting from: ${embedUrl}`);

      const response = await fetch(embedUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Referer: embedUrl,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          server: "Filemoon",
        };
      }

      const html = await response.text();

      // Look for the packed JavaScript
      const packedMatch = html.match(
        /eval\(function\(p,a,c,k,e,[dr]\)\{.*?\}\('[^']+',\d+,\d+,'[^']+'\.split\('\|'\)[^)]*\)\)/
      );

      if (!packedMatch) {
        // Try direct m3u8 search as fallback
        const m3u8Match = html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)/i);
        if (m3u8Match) {
          return {
            success: true,
            videos: [
              {
                url: m3u8Match[1],
                quality: "auto",
                isM3U8: true,
                headers: { Referer: embedUrl },
              },
            ],
            server: "Filemoon",
          };
        }

        return {
          success: false,
          error: "Could not find packed JS or m3u8",
          server: "Filemoon",
        };
      }

      const unpacked = unpackJS(packedMatch[0]);

      if (!unpacked) {
        return {
          success: false,
          error: "Failed to unpack JavaScript",
          server: "Filemoon",
        };
      }

      // Extract m3u8 URL from unpacked JS
      // Usually in format: file:"https://...m3u8"
      const m3u8Match = unpacked.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)/i);

      if (!m3u8Match) {
        // Try sources array format
        const sourcesMatch = unpacked.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)/i);
        if (sourcesMatch) {
          return {
            success: true,
            videos: [
              {
                url: sourcesMatch[1],
                quality: "auto",
                isM3U8: true,
                headers: { Referer: embedUrl },
              },
            ],
            server: "Filemoon",
          };
        }

        return {
          success: false,
          error: "Could not find m3u8 URL in unpacked JS",
          server: "Filemoon",
        };
      }

      console.log(`[Filemoon] Extracted m3u8: ${m3u8Match[1]}`);

      return {
        success: true,
        videos: [
          {
            url: m3u8Match[1],
            quality: "auto",
            isM3U8: true,
            headers: {
              Referer: embedUrl,
            },
          },
        ],
        server: "Filemoon",
      };
    } catch (error) {
      console.error("[Filemoon] Extraction error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        server: "Filemoon",
      };
    }
  },
};

export const streamwishExtractor: VideoExtractor = {
  name: "Streamwish",
  patterns: [
    /streamwish\.(to|com)\/e\//i,
    /swdyu\.com\/e\//i,
    /wishembed\.pro\/e\//i,
    /flaswish\.com\/e\//i,
    /sfastwish\.com\/e\//i,
    /obeywish\.com\/e\//i,
  ],

  async extract(embedUrl: string): Promise<ExtractionResult> {
    // Streamwish uses same pattern as Filemoon
    const result = await filemoonExtractor.extract(embedUrl);
    return {
      ...result,
      server: "Streamwish",
    };
  },
};
