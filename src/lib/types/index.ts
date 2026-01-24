/**
 * Type definitions for Kiniro List application
 * Central export point for all application types
 */

// Re-export component types
export * from "./components";

// ============ AniList Types ============

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export type MediaStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";

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
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  status?: MediaStatus | null;
  episodes?: number | null;
  duration?: number | null;
  format?: MediaFormat | null;
  isAdult?: boolean | null;
  siteUrl?: string | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  source?: string | null;
  hashtag?: string | null;
  studios?: {
    nodes: {
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }[];
  } | null;
  externalLinks?: ExternalLink[] | null;
  streamingEpisodes?: StreamingEpisode[] | null;
  trailer?: {
    id?: string | null;
    site?: string | null;
    thumbnail?: string | null;
  } | null;
  tags?: MediaTag[] | null;
  relations?: {
    edges: RelationEdge[];
  } | null;
  recommendations?: {
    nodes: RecommendationNode[];
  } | null;
  nextAiringEpisode?: NextAiringEpisode | null;
  airingSchedule?: {
    nodes: Array<{
      airingAt: number;
      episode: number;
    }>;
  };
}

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  type?: string | null;
  language?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface StreamingEpisode {
  title?: string | null;
  thumbnail?: string | null;
  url?: string | null;
  site?: string | null;
}

export interface MediaTag {
  id: number;
  name: string;
  rank?: number | null;
  isMediaSpoiler?: boolean | null;
}

export interface RelationEdge {
  node: {
    id: number;
    title: MediaTitle;
    coverImage: MediaCoverImage;
    format?: string | null;
    type?: string | null;
  };
  relationType?: string | null;
}

export interface RecommendationNode {
  mediaRecommendation: {
    id: number;
    title: MediaTitle;
    coverImage: MediaCoverImage;
    format?: string | null;
    averageScore?: number | null;
  };
}

// ============ Firestore Types ============

export interface StreamingLink {
  site: string;
  url: string;
  icon?: string | null;
}

export interface AnimeCache {
  id: number;
  slug?: string;
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
  streamingLinks?: StreamingLink[];
  externalLinks?: ExternalLink[] | null;
  updatedAt: Date;
  source: "anilist";
}

export interface AnimeAiringCache {
  animeId: number;
  nextAiringAt?: Date | null;
  nextEpisodeNumber?: number | null;
  lastAiringAt?: Date | null;
  lastFetchedAt: Date;
  updatedAt: Date;
}

/**
 * Airing history entry for tracking aired episodes per user
 * Stored in: users/{uid}/airingHistory/{animeId}_{episode}
 */
export interface AiringHistoryEntry {
  animeId: number;
  episode: number;
  airingAt: Date;
  detectedAt: Date;
  expiresAt: Date;
}

/**
 * My calendar schedule item - extends WeeklyScheduleItem with library status
 */
export interface MyCalendarScheduleItem {
  anime: AnimeCache;
  airingAt: number;
  episode: number;
  weekday: number;
  libraryStatus: LibraryStatus;
  isAired: boolean;
  pinned?: boolean;
}

/**
 * Response for /api/me/calendar with weekly schedule format
 */
export interface MyCalendarResponse {
  schedule: Record<number, MyCalendarScheduleItem[]>;
  timezone: string;
  filters: UserFilters;
}

export type LibraryStatus = "watching" | "planned" | "completed" | "paused" | "dropped";
export type CalendarView = "weekly" | "season";
export type ThemePreference = "light" | "dark" | "system";
export type Locale = "en" | "es";

export interface UserFilters {
  hideAdult: boolean;
  onlyWatching: boolean;
}

export interface NotificationSettings {
  dailyDigest: boolean;
  digestHour: number; // 0-23, hour in user's timezone
}

export interface UserDocument {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  createdAt: Date;
  timezone: string;
  calendarView: CalendarView;
  filters: UserFilters;
  locale: Locale;
  theme: ThemePreference;
  notifications: NotificationSettings;
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

// ============ Email Types ============

export interface DigestAnimeItem {
  title: string;
  episode: number;
  airingTime: string;
  coverUrl: string;
  slug: string;
  format?: MediaFormat | string | null;
  crunchyrollUrl?: string | null;
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
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  duration?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  sourceType?: string | null;
  hashtag?: string | null;
  studios?: {
    nodes: {
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }[];
  } | null;
  externalLinks?: ExternalLink[] | null;
  streamingEpisodes?: StreamingEpisode[] | null;
  trailer?: {
    id?: string | null;
    site?: string | null;
    thumbnail?: string | null;
  } | null;
  tags?: MediaTag[] | null;
  relations?: {
    edges: RelationEdge[];
  } | null;
  recommendations?: {
    nodes: RecommendationNode[];
  } | null;
  nextAiringAt?: string | null;
  nextEpisodeNumber?: number | null;
}

export type AiringStatusLabel = "airs_in" | "airs_today" | "aired" | "unknown";

export interface CalendarAnimeItem {
  anime: AnimeCache;
  libraryStatus: LibraryStatus;
  nextAiringAt?: string | null;
  nextEpisodeNumber?: number | null;
  displayAiringAt?: string | null;
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
  isAdmin?: boolean;
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

export interface EmailSendRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

// ============ Feedback Types ============

export type FeedbackType = "suggestion" | "bug" | "comment";
export type FeedbackStatus = "new" | "in-review" | "reviewed" | "resolved";

export interface FeedbackMessage {
  id: string;
  message: string;
  isAdmin: boolean;
  authorId: string;
  authorEmail: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface FeedbackAdminResponse {
  message: string;
  respondedBy: string;
  respondedByEmail: string;
  respondedAt: string;
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  adminResponse?: FeedbackAdminResponse | null;
  /** Thread of messages for conversation */
  thread?: FeedbackMessage[];
  /** Whether user has unread admin responses */
  hasUnreadResponse?: boolean;
  createdAt: string | null;
  updatedAt?: string | null;
}

// ============ Notification Types ============

export type NotificationType = "anime_airing" | "feedback_response" | "system";

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Additional data based on type (e.g., animeId, feedbackId) */
  data?: {
    animeId?: number;
    animeSlug?: string;
    animeCover?: string;
    episode?: number;
    feedbackId?: string;
    [key: string]: unknown;
  };
  read: boolean;
  createdAt: string;
}

// ============ Settings Form Types ============

export interface SettingsFormData {
  timezone: string;
  locale: Locale;
  theme: ThemePreference;
  calendarView: CalendarView;
  filters: UserFilters;
}
