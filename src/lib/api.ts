"use client";

import { toast } from "sonner";
import type {
  AnimeListResponse,
  AnimeDetailResponse,
  WeeklyScheduleResponse,
  UserResponse,
  LibraryEntryWithAnime,
  CalendarAnimeItem,
  LibraryUpsertRequest,
  SettingsUpdateRequest,
  MediaSeason,
} from "@/lib/types";

type AuthHeadersGetter = () => Promise<Record<string, string>>;

let getAuthHeaders: AuthHeadersGetter = async () => ({});

export function setAuthHeadersGetter(getter: AuthHeadersGetter) {
  getAuthHeaders = getter;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    toast.error("Please login to continue");
    throw new Error("Unauthorized");
  }

  if (response.status === 429) {
    const data = await response.json();
    toast.error(`Too many requests. Please wait ${data.retryAfter} seconds.`);
    throw new Error("Rate limited");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}

// ============ Public API ============

export async function searchAnime(
  query: string,
  page: number = 1
): Promise<AnimeListResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const response = await fetch(`/api/anime/search?${params}`);
  return handleResponse(response);
}

export async function getAnimeDetail(id: number): Promise<AnimeDetailResponse> {
  const response = await fetch(`/api/anime/${id}`);
  return handleResponse(response);
}

export async function getCurrentSeason(
  page: number = 1
): Promise<AnimeListResponse & { season: MediaSeason; year: number }> {
  const params = new URLSearchParams({ page: String(page) });
  const response = await fetch(`/api/calendar/now?${params}`);
  return handleResponse(response);
}

export async function getUpcomingSeason(
  page: number = 1
): Promise<AnimeListResponse & { season: MediaSeason; year: number }> {
  const params = new URLSearchParams({ page: String(page) });
  const response = await fetch(`/api/calendar/upcoming?${params}`);
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
  const response = await fetch(`/api/calendar/season?${params}`);
  return handleResponse(response);
}

export async function getWeeklySchedule(): Promise<WeeklyScheduleResponse> {
  const response = await fetch("/api/schedule/weekly");
  return handleResponse(response);
}

// ============ Protected API ============

export async function getCurrentUser(): Promise<UserResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/me", { headers });
  return handleResponse(response);
}

export async function updateSettings(
  settings: SettingsUpdateRequest
): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/me/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(settings),
  });
  return handleResponse(response);
}

export async function getLibrary(): Promise<{ entries: LibraryEntryWithAnime[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/me/library", { headers });
  return handleResponse(response);
}

export async function upsertLibraryEntry(
  entry: LibraryUpsertRequest
): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/me/library", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(entry),
  });
  return handleResponse(response);
}

export async function deleteLibraryEntry(
  animeId: number
): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/me/library/${animeId}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse(response);
}

export async function getMyCalendar(): Promise<{ items: CalendarAnimeItem[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/me/calendar", { headers });
  return handleResponse(response);
}
