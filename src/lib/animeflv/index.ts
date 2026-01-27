/**
 * AnimeFLV API Module Exports
 * Provides Spanish anime streaming functionality via AnimeFLV scraper
 */

// Client functions (server-side only)
export {
  searchAnime,
  findAnimeByTitle,
  getAnimeInfo,
  getEpisodes,
  getAnimeEpisodesByTitles,
  getEpisodeServers,
  getStreamingLinks,
  getLatestEpisodes,
  getOnAirAnime,
  searchAnimeWithFilters,
  extractSlugFromUrl,
  extractEpisodeSlugFromUrl,
  buildAnimeUrl,
  buildEpisodeUrl,
} from "./client";

// Types
export type {
  // Raw API types
  AnimeFLVSearchMedia,
  AnimeFLVSearchResult,
  AnimeFLVEpisode,
  AnimeFLVAnimeInfo,
  AnimeFLVServer,
  AnimeFLVEpisodeInfo,
  AnimeFLVLatestEpisode,
  AnimeFLVOnAirAnime,
  // Normalized types (for app compatibility)
  NormalizedAnimeFLVEpisode,
  NormalizedAnimeFLVServer,
  NormalizedAnimeFLVStreamingLinks,
  AnimeFLVCacheEntry,
} from "./types";
