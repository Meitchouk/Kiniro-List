// Types for Kiniro List application

// ============ AniList Types ============

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export type MediaStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
export type MediaFormat = "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC" | "MANGA" | "NOVEL" | "ONE_SHOT";

export interface MediaTitle {
  romaji: string;
  english?: string | null;
  native?: string | null;
}

export interface MediaCoverImage {
  large?: string | null;
  extraLarge?: string | null;
}

export interface NextAiringEpisode {
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
}

export interface AniListMedia {
  id: number;
  title: MediaTitle;
  coverImage: MediaCoverImage;
  bannerImage?: string | null;
  description?: string | null;
  genres?: string[] | null;
  season?: MediaSeason | null;
  seasonYear?: number | null;
  status?: MediaStatus | null;
  episodes?: number | null;
  format?: MediaFormat | null;
  isAdult?: boolean | null;
  siteUrl?: string | null;
  nextAiringEpisode?: NextAiringEpisode | null;
  airingSchedule?: {
    nodes: Array<{
      airingAt: number;
      episode: number;
    }>;
  };
}

// ============ Firestore Types ============

export interface AnimeCache {
  id: number;
  title: MediaTitle;
  coverImage: MediaCoverImage;
  bannerImage?: string | null;
  description?: string | null;
  genres?: string[];
  season?: MediaSeason | null;
  seasonYear?: number | null;
  status?: MediaStatus | null;
  episodes?: number | null;
  format?: MediaFormat | null;
  isAdult?: boolean;
  siteUrl?: string | null;
  updatedAt: Date;
  source: "anilist";
}

export interface AnimeAiringCache {
  animeId: number;
  nextAiringAt?: Date | null;
  nextEpisodeNumber?: number | null;
  lastFetchedAt: Date;
  updatedAt: Date;
}

export type LibraryStatus = "watching" | "planned" | "completed" | "paused" | "dropped";
export type CalendarView = "weekly" | "season";
export type ThemePreference = "light" | "dark" | "system";
export type Locale = "en" | "es";

export interface UserFilters {
  hideAdult: boolean;
  onlyWatching: boolean;
}

export interface UserDocument {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  createdAt: Date;
  timezone: string;
  calendarView: CalendarView;
  filters: UserFilters;
  locale: Locale;
  theme: ThemePreference;
  updatedAt: Date;
}

export interface LibraryEntry {
  animeId: number;
  status: LibraryStatus;
  addedAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  notes?: string;
}

// ============ API Response Types ============

export interface PaginationInfo {
  currentPage: number;
  hasNextPage: boolean;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface AnimeListResponse {
  anime: AnimeCache[];
  pagination: PaginationInfo;
}

export interface AnimeDetailResponse extends AnimeCache {
  nextAiringAt?: string | null;
  nextEpisodeNumber?: number | null;
}

export type AiringStatusLabel = "airs_in" | "airs_today" | "aired" | "unknown";

export interface CalendarAnimeItem {
  anime: AnimeCache;
  libraryStatus: LibraryStatus;
  nextAiringAt?: string | null;
  nextEpisodeNumber?: number | null;
  statusLabel: AiringStatusLabel;
  secondsToAir?: number;
  pinned?: boolean;
}

export interface WeeklyScheduleItem {
  anime: AnimeCache;
  airingAt: number;
  episode: number;
  weekday: number; // 0-6 (Sunday-Saturday)
}

export interface WeeklyScheduleResponse {
  schedule: Record<number, WeeklyScheduleItem[]>;
}

export interface LibraryEntryWithAnime extends LibraryEntry {
  anime: AnimeCache;
}

export interface UserResponse extends Omit<UserDocument, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

// ============ Request Types ============

export interface LibraryUpsertRequest {
  animeId: number;
  status: LibraryStatus;
  pinned?: boolean;
  notes?: string;
}

export interface SettingsUpdateRequest {
  timezone?: string;
  calendarView?: CalendarView;
  filters?: UserFilters;
  locale?: Locale;
  theme?: ThemePreference;
}
