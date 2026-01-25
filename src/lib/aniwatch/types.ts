/**
 * AniWatch API Type Definitions
 * Types for the HiAnime streaming API responses
 * Based on https://github.com/ghoshRitesh12/aniwatch-api
 */

// ============ Search Types ============

export interface AniwatchAnime {
  id: string;
  name: string;
  jname?: string;
  poster: string;
  duration?: string;
  type?: string;
  rating?: string;
  episodes?: {
    sub: number | null;
    dub: number | null;
  };
}

export interface AniwatchSearchResult {
  animes: AniwatchAnime[];
  mostPopularAnimes: AniwatchAnime[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  searchQuery: string;
  searchFilters: Record<string, string>;
}

// ============ Episode Types ============

export interface AniwatchEpisode {
  title: string;
  episodeId: string;
  number: number;
  isFiller: boolean;
}

export interface AniwatchEpisodesResponse {
  totalEpisodes: number;
  episodes: AniwatchEpisode[];
}

// ============ Server Types ============

export interface AniwatchServer {
  serverName: string;
  serverId: number;
}

export interface AniwatchServersResponse {
  sub: AniwatchServer[];
  dub: AniwatchServer[];
  raw: AniwatchServer[];
  episodeId: string;
  episodeNo: number;
}

// ============ Streaming Types ============

export interface AniwatchSubtitle {
  url: string;
  lang: string;
  label?: string;
}

export interface AniwatchStreamingSource {
  url: string;
  type: string; // "hls" typically
  isM3U8?: boolean;
}

export interface AniwatchStreamingResponse {
  headers?: {
    Referer?: string;
    [key: string]: string | undefined;
  };
  tracks: AniwatchSubtitle[];
  intro: {
    start: number;
    end: number;
  };
  outro: {
    start: number;
    end: number;
  };
  sources: AniwatchStreamingSource[];
  anilistID: number | null;
  malID: number | null;
}

// ============ Anime Info Types ============

export interface AniwatchAnimeInfo {
  anime: {
    info: {
      id: string;
      anilistId: number | null;
      malId: number | null;
      name: string;
      poster: string;
      description: string;
      stats: {
        rating: string;
        quality: string;
        episodes: {
          sub: number | null;
          dub: number | null;
        };
        type: string;
        duration: string;
      };
      promotionalVideos: Array<{
        title: string;
        source: string;
        thumbnail: string;
      }>;
      characterVoiceActor: Array<{
        character: {
          id: string;
          poster: string;
          name: string;
          cast: string;
        };
        voiceActor: {
          id: string;
          poster: string;
          name: string;
          cast: string;
        };
      }>;
    };
    moreInfo: {
      japanese: string;
      synonyms: string;
      aired: string;
      premiered: string;
      duration: string;
      status: string;
      malscore: string;
      genres: string[];
      studios: string;
      producers: string[];
    };
  };
  seasons: Array<{
    id: string;
    name: string;
    title: string;
    poster: string;
    isCurrent: boolean;
  }>;
  mostPopularAnimes: AniwatchAnime[];
  relatedAnimes: AniwatchAnime[];
  recommendedAnimes: AniwatchAnime[];
}

// ============ Server Category ============

export type ServerCategory = "sub" | "dub" | "raw";

// ============ Normalized Types for our app ============
// These match our existing interface for easier migration

export interface NormalizedEpisode {
  id: string;
  title: string | null;
  number: number;
  description?: string | null;
  image?: string | null;
  isFiller?: boolean;
}

export interface NormalizedStreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface NormalizedSubtitle {
  url: string;
  lang: string;
  label?: string;
}

export interface NormalizedStreamingLinks {
  headers?: {
    Referer?: string;
    [key: string]: string | undefined;
  };
  sources: NormalizedStreamingSource[];
  subtitles?: NormalizedSubtitle[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
  download?: string;
}

export interface NormalizedAnimeInfo {
  id: string;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  malId?: number;
  anilistId?: number;
  image?: string;
  cover?: string;
  description?: string;
  status?: string;
  releaseDate?: number;
  rating?: number;
  genres?: string[];
  totalEpisodes?: number;
  duration?: number;
  type?: string;
  episodes: NormalizedEpisode[];
}

// ============ Error Types ============

export interface AniwatchError {
  message: string;
  status?: number;
}
