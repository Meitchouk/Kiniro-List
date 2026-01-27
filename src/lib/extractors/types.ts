/**
 * Video Extractor Types
 * Types for direct video URL extraction from streaming servers
 */

export interface ExtractedVideo {
  url: string;
  quality?: string;
  isM3U8?: boolean;
  headers?: Record<string, string>;
}

export interface ExtractionResult {
  success: boolean;
  videos?: ExtractedVideo[];
  error?: string;
  /** Server name that was extracted */
  server: string;
}

export interface VideoExtractor {
  /** Name of the server this extractor handles */
  name: string;
  /** Patterns to match embed URLs this extractor can handle */
  patterns: RegExp[];
  /** Extract direct video URL from embed URL */
  extract(embedUrl: string): Promise<ExtractionResult>;
}
