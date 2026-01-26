"use client";

import { toast } from "sonner";
import { fetchWithLoading } from "./fetchInterceptor";
import type {
  AnimeListResponse,
  AnimeDetailResponse,
  WeeklyScheduleResponse,
  UserResponse,
  LibraryEntryWithAnime,
  MyCalendarResponse,
  LibraryUpsertRequest,
  SettingsUpdateRequest,
  MediaSeason,
  AnimeCache,
  EmailSendRequest,
} from "@/lib/types";

type AuthHeadersGetter = (options?: { forceRefresh?: boolean }) => Promise<Record<string, string>>;
type TranslationGetter = (key: string, params?: Record<string, string | number>) => string;

let getAuthHeaders: AuthHeadersGetter = async () => ({});
let getTranslation: TranslationGetter = (key: string) => key; // Fallback returns the key itself

export function setAuthHeadersGetter(getter: AuthHeadersGetter) {
  getAuthHeaders = getter;
}

export function setTranslationGetter(getter: TranslationGetter) {
  getTranslation = getter;
}

async function fetchWithAuth(
  url: string,
  init?: RequestInit,
  { retryOn401 = true }: { retryOn401?: boolean } = {}
): Promise<Response> {
  const initialHeaders = await getAuthHeaders();

  const buildRequest = (headers: Record<string, string>) => ({
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...headers,
    },
  });

  let response = await fetchWithLoading(url, buildRequest(initialHeaders));

  // Retry once with a freshly refreshed token to avoid intermittent 401s
  if (retryOn401 && response.status === 401) {
    const refreshedHeaders = await getAuthHeaders({ forceRefresh: true });

    if (refreshedHeaders.Authorization) {
      response = await fetchWithLoading(url, buildRequest(refreshedHeaders));
    }
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    toast.error(getTranslation("errors.unauthorized"));
    throw new Error("Unauthorized");
  }

  if (response.status === 429) {
    const data = await response.json();
    toast.error(getTranslation("errors.rateLimit", { seconds: String(data.retryAfter) }));
    throw new Error("Rate limited");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}

// ============ Public API ============

export async function searchAnime(query: string, page: number = 1): Promise<AnimeListResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const response = await fetchWithLoading(`/api/anime/search?${params}`);
  return handleResponse(response);
}

export async function getAnimeDetail(id: number): Promise<AnimeDetailResponse> {
  const response = await fetchWithLoading(`/api/anime/${id}`);
  return handleResponse(response);
}

export async function getAnimeIdBySlug(slug: string): Promise<number | null> {
  const response = await fetchWithLoading(`/api/anime/slug/${slug}`);
  if (response.status === 404) {
    return null;
  }
  const data = await handleResponse<{ animeId: number }>(response);
  return data.animeId;
}

export async function getCurrentSeason(
  page: number = 1
): Promise<AnimeListResponse & { season: MediaSeason; year: number }> {
  const params = new URLSearchParams({ page: String(page) });
  const response = await fetchWithLoading(`/api/calendar/now?${params}`);
  return handleResponse(response);
}

export async function getUpcomingSeason(
  page: number = 1
): Promise<AnimeListResponse & { season: MediaSeason; year: number }> {
  const params = new URLSearchParams({ page: String(page) });
  const response = await fetchWithLoading(`/api/calendar/upcoming?${params}`);
  return handleResponse(response);
}

export async function getSeason(
  year: number,
  season: MediaSeason,
  page: number = 1
): Promise<AnimeListResponse & { season: MediaSeason; year: number }> {
  const params = new URLSearchParams({
    year: String(year),
    season,
    page: String(page),
  });
  const response = await fetchWithLoading(`/api/calendar/season?${params}`);
  return handleResponse(response);
}

export async function getWeeklySchedule(): Promise<WeeklyScheduleResponse> {
  const response = await fetchWithLoading("/api/schedule/weekly");
  return handleResponse(response);
}

export async function getTrendingAnimeList(
  limit: number = 20,
  scope: "day" | "all" = "day"
): Promise<{
  anime: AnimeCache[];
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    lastPage: number;
    perPage: number;
    total: number;
  };
}> {
  const params = new URLSearchParams({ limit: String(limit), scope });
  const response = await fetchWithLoading(`/api/anime/trending?${params}`);
  return handleResponse(response);
}

export async function getTopSearchQueries(limit: number = 10): Promise<{ queries: string[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetchWithLoading(`/api/search/top?${params}`);
  return handleResponse(response);
}

export async function getPopularAnimeList(limit: number = 50): Promise<AnimeListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetchWithLoading(`/api/anime/popular?${params}`);
  return handleResponse(response);
}

export interface BrowseAnimeParams {
  page?: number;
  perPage?: number;
  sort?: string;
  search?: string;
  season?: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  seasonYear?: number;
  format?: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";
  status?: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  genres?: string[];
}

/**
 * Browse all anime from AniList with optional filters and pagination.
 * This is the main function for general anime search/browsing.
 */
export async function browseAnimeList(params: BrowseAnimeParams = {}): Promise<AnimeListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("perPage", String(params.perPage));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.search) searchParams.set("search", params.search);
  if (params.season) searchParams.set("season", params.season);
  if (params.seasonYear) searchParams.set("seasonYear", String(params.seasonYear));
  if (params.format) searchParams.set("format", params.format);
  if (params.status) searchParams.set("status", params.status);
  if (params.genres && params.genres.length > 0)
    searchParams.set("genres", params.genres.join(","));

  const response = await fetchWithLoading(`/api/anime/browse?${searchParams}`);
  return handleResponse(response);
}

// ============ Protected API ============

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetchWithAuth("/api/me");
  return handleResponse(response);
}

export async function updateSettings(
  settings: SettingsUpdateRequest
): Promise<{ success: boolean }> {
  const response = await fetchWithAuth("/api/me/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
  return handleResponse(response);
}

export async function getLibrary(): Promise<{
  entries: LibraryEntryWithAnime[];
  items?: LibraryEntryWithAnime[];
}> {
  const response = await fetchWithAuth("/api/me/library");
  return handleResponse(response);
}

export async function upsertLibraryEntry(
  entry: LibraryUpsertRequest
): Promise<{ success: boolean }> {
  const response = await fetchWithAuth("/api/me/library", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });
  return handleResponse(response);
}

export async function deleteLibraryEntry(animeId: number): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/me/library/${animeId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function getMyCalendar(weekOffset?: number): Promise<MyCalendarResponse> {
  const params = new URLSearchParams();
  if (weekOffset !== undefined && weekOffset !== 0) {
    params.set("weekOffset", String(weekOffset));
  }
  const query = params.toString();
  const url = query ? `/api/me/calendar?${query}` : "/api/me/calendar";
  const response = await fetchWithAuth(url);
  return handleResponse(response);
}

// Generic API wrapper for simple use cases
export const api = {
  async get<T = unknown>(url: string): Promise<T> {
    const response = await fetchWithAuth(url);
    return handleResponse<T>(response);
  },
  async post<T = unknown>(url: string, body?: unknown): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
  async patch<T = unknown>(url: string, body?: unknown): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
  async delete<T = unknown>(url: string): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: "DELETE",
    });
    return handleResponse<T>(response);
  },
};

export async function sendEmail(
  payload: EmailSendRequest
): Promise<{ success: boolean; messageId: string }> {
  const response = await fetchWithAuth("/api/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// ============ Streaming API ============

// Types for streaming responses (matching API responses)
interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface StreamingSubtitle {
  url: string;
  lang: string;
  label?: string;
}

interface StreamingResponse {
  // Common fields
  provider?: string;
  type?: "direct" | "embed"; // "direct" for HLS streams, "embed" for iframe embeds

  // HiAnime (direct streaming) fields
  sources?: StreamingSource[];
  subtitles?: StreamingSubtitle[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: { Referer?: string; [key: string]: string | undefined };

  // AnimeFLV (embed) fields
  servers?: Array<{
    name: string;
    url: string;
    type: "embed" | "download";
  }>;
  episodeNumber?: number;
  animeTitle?: string;
}

interface NormalizedEpisode {
  id: string;
  title: string | null;
  number: number;
  description?: string | null;
  image?: string | null;
  isFiller?: boolean;
}

interface ProviderEpisodesResult {
  provider: string;
  displayName: string;
  episodes: NormalizedEpisode[];
  totalEpisodes: number;
}

interface MultiProviderEpisodesResponse {
  anilistId: number;
  availableProviders: ProviderEpisodesResult[];
  failedProviders: Array<{ provider: string; error: string }>;
  dub: boolean;
}

interface NormalizedServer {
  name: string;
  url: string;
}

interface ServersResponse {
  servers: NormalizedServer[];
}

/**
 * Get episodes for an anime from HiAnime
 * Returns episodes from HiAnime with failed providers listed separately
 */
export async function getAnimeEpisodes(
  animeId: number,
  options?: {
    titleRomaji?: string;
    titleEnglish?: string;
    titleNative?: string;
    format?: string;
    totalEpisodes?: number;
    year?: number;
    dub?: boolean;
  }
): Promise<MultiProviderEpisodesResponse> {
  const params = new URLSearchParams();
  if (options?.titleRomaji) params.set("titleRomaji", options.titleRomaji);
  if (options?.titleEnglish) params.set("titleEnglish", options.titleEnglish);
  if (options?.titleNative) params.set("titleNative", options.titleNative);
  if (options?.format) params.set("format", options.format);
  if (options?.totalEpisodes) params.set("totalEpisodes", String(options.totalEpisodes));
  if (options?.year) params.set("year", String(options.year));
  if (options?.dub) params.set("dub", "true");

  const query = params.toString();
  const url = query
    ? `/api/streaming/episodes/${animeId}?${query}`
    : `/api/streaming/episodes/${animeId}`;
  const response = await fetchWithLoading(url);
  return handleResponse(response);
}

/**
 * Get streaming links for a specific episode
 * @param episodeId - Episode ID (format depends on provider)
 * @param options - Optional settings including dub preference and provider
 */
export async function getStreamingLinks(
  episodeId: string,
  options: { dub?: boolean; provider?: "hianime" | "animeflv" | "animeflv-adfree" } = {}
): Promise<StreamingResponse> {
  const params = new URLSearchParams();
  if (options.dub) params.set("dub", "true");
  if (options.provider) params.set("provider", options.provider);
  const query = params.toString();
  const url = query
    ? `/api/streaming/watch/${encodeURIComponent(episodeId)}?${query}`
    : `/api/streaming/watch/${encodeURIComponent(episodeId)}`;
  const response = await fetchWithLoading(url);
  return handleResponse(response);
}

/**
 * Get available servers for an episode
 */
export async function getEpisodeServers(
  episodeId: string,
  dub: boolean = false
): Promise<ServersResponse> {
  const params = new URLSearchParams();
  if (dub) params.set("dub", "true");
  const query = params.toString();
  const url = query
    ? `/api/streaming/servers/${encodeURIComponent(episodeId)}?${query}`
    : `/api/streaming/servers/${encodeURIComponent(episodeId)}`;
  const response = await fetchWithLoading(url);
  return handleResponse(response);
}

// ============ External Subtitles API ============

export interface ExternalSubtitleResult {
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
  matchScore?: number; // 0-100 relevance score
}

export interface LanguageStats {
  code: string;
  name: string;
  count: number;
}

export interface ExternalSubtitlesResponse {
  query: {
    title: string;
    episode: number;
    season?: number;
    year?: number;
    filterLanguage?: string;
  };
  totalResults: number;
  filteredCount: number;
  results: ExternalSubtitleResult[];
  bestSpanish: ExternalSubtitleResult | null;
  availableLanguages: LanguageStats[];
  sourceStats: {
    opensubtitles: number;
    subdl: number;
  };
}

/**
 * Search for external subtitles from OpenSubtitles + Subdl (parallel search)
 */
export async function searchExternalSubtitles(
  title: string,
  episode: number,
  options?: {
    season?: number;
    year?: number;
    languages?: string[];
    filterLanguage?: string;
  }
): Promise<ExternalSubtitlesResponse> {
  const params = new URLSearchParams();
  params.set("title", title);
  params.set("episode", episode.toString());
  if (options?.season) params.set("season", options.season.toString());
  if (options?.year) params.set("year", options.year.toString());
  if (options?.languages) params.set("languages", options.languages.join(","));
  if (options?.filterLanguage) params.set("filterLanguage", options.filterLanguage);

  const url = `/api/streaming/subtitles/search?${params.toString()}`;
  const response = await fetchWithLoading(url);
  return handleResponse(response);
}

/**
 * Get download URL for an external subtitle
 */
export async function getExternalSubtitleDownload(
  subtitle: ExternalSubtitleResult
): Promise<{ fileId: number; source: string; downloadUrl: string }> {
  const params = new URLSearchParams();
  params.set("fileId", subtitle.fileId.toString());
  params.set("source", subtitle.source);
  // Pass direct URL for Subdl
  if (subtitle.downloadUrl) {
    params.set("downloadUrl", subtitle.downloadUrl);
  }

  const url = `/api/streaming/subtitles/download?${params.toString()}`;
  const response = await fetchWithLoading(url);
  return handleResponse(response);
}
