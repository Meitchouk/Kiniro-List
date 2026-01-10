import { z } from "zod";

// ============ Query Param Schemas ============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().positive().default(1),
});

export const seasonQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]),
  page: z.coerce.number().int().positive().default(1),
});

export const animeIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============ Settings Schema ============

export const settingsUpdateSchema = z.object({
  timezone: z.string().max(100).optional(),
  calendarView: z.enum(["weekly", "season"]).optional(),
  filters: z.object({
    hideAdult: z.boolean(),
    onlyWatching: z.boolean(),
  }).optional(),
  locale: z.enum(["en", "es"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

// Settings form schema (client-side validation)
export const settingsSchema = z.object({
  timezone: z.string(),
  locale: z.enum(['en', 'es']),
  theme: z.enum(['light', 'dark', 'system']),
  calendarView: z.enum(['weekly', 'season']),
  filters: z.object({
    hideAdult: z.boolean(),
    onlyWatching: z.boolean(),
  }),
});

// ============ Library Schema ============

export const libraryUpsertSchema = z.object({
  animeId: z.number().int().positive(),
  status: z.enum(["watching", "planned", "completed", "paused", "dropped"]),
  pinned: z.boolean().optional(),
  notes: z.string().max(200).optional(),
});

export const libraryDeleteSchema = z.object({
  animeId: z.coerce.number().int().positive(),
});

// ============ Type exports ============

export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
export type SeasonQueryParams = z.infer<typeof seasonQuerySchema>;
export type SettingsUpdateParams = z.infer<typeof settingsUpdateSchema>;
export type LibraryUpsertParams = z.infer<typeof libraryUpsertSchema>;
