/**
 * Validation module exports
 * Provides Zod schemas for request validation
 */

export {
  // Query param schemas
  paginationSchema,
  searchQuerySchema,
  seasonQuerySchema,
  animeIdSchema,
  // Analytics schemas
  trendingQuerySchema,
  topSearchQuerySchema,
  popularQuerySchema,
  // Settings schemas
  settingsUpdateSchema,
  settingsSchema,
  // Library schemas
  libraryUpsertSchema,
  libraryDeleteSchema,
} from "./schemas";

// Type exports
export type {
  PaginationParams,
  SearchQueryParams,
  SeasonQueryParams,
  SettingsUpdateParams,
  LibraryUpsertParams,
  TrendingQueryParams,
  TopSearchQueryParams,
  PopularQueryParams,
} from "./schemas";
