/**
 * API module exports
 * Provides client-side API functions and fetch utilities
 */

// Client API functions
export {
  setAuthHeadersGetter,
  setTranslationGetter,
  searchAnime,
  getAnimeDetail,
  getAnimeIdBySlug,
  getCurrentSeason,
  getUpcomingSeason,
  getSeason,
  getWeeklySchedule,
  getTrendingAnimeList,
  getTopSearchQueries,
  getPopularAnimeList,
  browseAnimeList,
  getCurrentUser,
  updateSettings,
  getLibrary,
  upsertLibraryEntry,
  deleteLibraryEntry,
  getMyCalendar,
  api,
  sendEmail,
  // Streaming API
  getAnimeEpisodes,
  getStreamingLinks,
  getEpisodeServers,
  // External Subtitles API
  searchExternalSubtitles,
  getExternalSubtitleDownload,
} from "./client";

export type {
  BrowseAnimeParams,
  ExternalSubtitleResult,
  ExternalSubtitlesResponse,
} from "./client";

// Fetch interceptor for loading states
export { setLoadingCallbacks, clearLoadingCallbacks, fetchWithLoading } from "./fetchInterceptor";
