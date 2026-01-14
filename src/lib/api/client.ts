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

export async function getMyCalendar(): Promise<MyCalendarResponse> {
  const response = await fetchWithAuth("/api/me/calendar");
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
