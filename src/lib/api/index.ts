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
  getCurrentUser,
  updateSettings,
  getLibrary,
  upsertLibraryEntry,
  deleteLibraryEntry,
  getMyCalendar,
  api,
  sendEmail,
} from "./client";

// Fetch interceptor for loading states
export { setLoadingCallbacks, clearLoadingCallbacks, fetchWithLoading } from "./fetchInterceptor";
