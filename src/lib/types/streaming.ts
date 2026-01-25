/**
 * Streaming Types
 * Shared types for streaming functionality across the application
 * Compatible with AniWatch API responses
 */

// ============ Episode Types ============

export interface Episode {
  id: string;
  title: string | null;
  number: number;
  description?: string | null;
  image?: string | null;
  isFiller?: boolean;
}

// ============ Provider Types ============

export interface ProviderResult {
  provider: string;
  displayName: string;
  episodes: Episode[];
  totalEpisodes: number;
}

export interface EpisodesResponse {
  anilistId: number;
  availableProviders: ProviderResult[];
  failedProviders: Array<{ provider: string; error: string }>;
  dub: boolean;
}

// ============ Streaming Types ============

export interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface StreamingSubtitle {
  url: string;
  lang: string;
  label?: string;
}

export interface StreamingLinks {
  sources: StreamingSource[];
  subtitles: StreamingSubtitle[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: { Referer?: string; [key: string]: string | undefined };
}

// ============ Server Types ============

export interface Server {
  name: string;
  url: string;
}

export interface ServersResponse {
  servers: Server[];
}

// ============ Default Provider ============

// With AniWatch, we only have HiAnime as the provider
export const DEFAULT_PROVIDER = "hianime";
export type StreamingProvider = "hianime";

export const PROVIDER_DISPLAY_NAMES: Record<StreamingProvider, string> = {
  hianime: "HiAnime",
};
