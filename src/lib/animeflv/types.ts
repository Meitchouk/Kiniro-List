/**
 * AnimeFLV Type Definitions
 * Types for the AnimeFLV scraper API responses
 * Based on https://www.npmjs.com/package/animeflv-scraper
 */

// ============ Search Types ============

export interface AnimeFLVSearchMedia {
  title: string;
  cover: string;
  synopsis: string;
  rating: string;
  slug: string;
  type: string;
  url: string;
}

export interface AnimeFLVSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  foundPages: number;
  media: AnimeFLVSearchMedia[];
}

// ============ Anime Info Types ============

export interface AnimeFLVEpisode {
  number: number;
  slug: string;
  url: string;
}

export interface AnimeFLVAnimeInfo {
  title: string;
  alternative_titles: string[];
  status: string;
  rating: string;
  type: string;
  cover: string;
  synopsis: string;
  genres: string[];
  next_airing_episode: string | null;
  episodes: AnimeFLVEpisode[];
  url: string;
}

// ============ Episode Server Types ============

export interface AnimeFLVServer {
  name: string;
  embed?: string;
  download?: string;
}

export interface AnimeFLVEpisodeInfo {
  title: string;
  number: number;
  servers: AnimeFLVServer[];
}

// ============ Latest/On Air Types ============

export interface AnimeFLVLatestEpisode {
  title: string;
  number: number;
  cover: string;
  slug: string;
  url: string;
}

export interface AnimeFLVOnAirAnime {
  title: string;
  type: string;
  slug: string;
  url: string;
}

// ============ Normalized Types for our app ============

export interface NormalizedAnimeFLVEpisode {
  id: string; // slug for AnimeFLV
  title: string | null;
  number: number;
  provider: "animeflv";
}

export interface NormalizedAnimeFLVServer {
  name: string;
  url: string;
  type: "embed" | "download";
  quality?: string;
}

export interface NormalizedAnimeFLVStreamingLinks {
  servers: NormalizedAnimeFLVServer[];
  episodeNumber: number;
  animeTitle: string;
}

// ============ Cache Types ============

export interface AnimeFLVCacheEntry {
  slug: string;
  title: string;
  totalEpisodes: number;
  lastUpdated: number;
}
