/**
 * Video Extractors
 * Centralized module for extracting direct video URLs from embed players
 *
 * This allows us to bypass embedded player ads by extracting the actual
 * video URL and playing it in our own player.
 */

import type { VideoExtractor, ExtractionResult, ExtractedVideo } from "./types";
import { streamtapeExtractor } from "./streamtape";
import { filemoonExtractor, streamwishExtractor } from "./filemoon";

// Export types
export type { VideoExtractor, ExtractionResult, ExtractedVideo };

// All available extractors
const extractors: VideoExtractor[] = [streamtapeExtractor, filemoonExtractor, streamwishExtractor];

/**
 * Find an extractor that can handle the given embed URL
 */
export function findExtractor(embedUrl: string): VideoExtractor | null {
  for (const extractor of extractors) {
    for (const pattern of extractor.patterns) {
      if (pattern.test(embedUrl)) {
        return extractor;
      }
    }
  }
  return null;
}

/**
 * Check if we can extract direct video from this embed URL
 */
export function canExtract(embedUrl: string): boolean {
  return findExtractor(embedUrl) !== null;
}

/**
 * Extract direct video URL from an embed URL
 */
export async function extractVideo(embedUrl: string): Promise<ExtractionResult> {
  const extractor = findExtractor(embedUrl);

  if (!extractor) {
    return {
      success: false,
      error: "No extractor available for this URL",
      server: "unknown",
    };
  }

  console.log(`[Extractors] Using ${extractor.name} for ${embedUrl}`);
  return extractor.extract(embedUrl);
}

/**
 * Get list of supported server names
 */
export function getSupportedServers(): string[] {
  return extractors.map((e) => e.name);
}

/**
 * Check if a server name is supported for direct extraction
 */
export function isServerSupported(serverName: string): boolean {
  const normalized = serverName.toLowerCase();
  return extractors.some(
    (e) =>
      e.name.toLowerCase() === normalized ||
      e.name.toLowerCase().includes(normalized) ||
      normalized.includes(e.name.toLowerCase())
  );
}
