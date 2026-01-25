/**
 * AniWatch API Module Exports
 * Provides anime streaming functionality via HiAnime API
 */

// Client functions (server-side only)
export {
  searchAnime,
  getAnimeInfo,
  getEpisodes,
  getEpisodeServers,
  getStreamingSources,
  findAnimeByTitle,
  getAnimeEpisodesByAnilistId,
  getStreamingLinks,
} from "./client";

// Types
export type {
  // Raw API types
  AniwatchAnime,
  AniwatchSearchResult,
  AniwatchEpisode,
  AniwatchEpisodesResponse,
  AniwatchServer,
  AniwatchServersResponse,
  AniwatchSubtitle,
  AniwatchStreamingSource,
  AniwatchStreamingResponse,
  AniwatchAnimeInfo,
  ServerCategory,
  AniwatchError,
  // Normalized types (for app compatibility)
  NormalizedEpisode,
  NormalizedStreamingSource,
  NormalizedSubtitle,
  NormalizedStreamingLinks,
  NormalizedAnimeInfo,
} from "./types";
