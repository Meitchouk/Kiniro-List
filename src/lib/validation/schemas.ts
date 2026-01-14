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

// ============ Analytics Query Schemas ============

export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  scope: z.enum(["day", "all"]).default("day"),
});

export const topSearchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const popularQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

// ============ Settings Schema ============

export const settingsUpdateSchema = z.object({
  timezone: z.string().max(100).optional(),
  calendarView: z.enum(["weekly", "season"]).optional(),
  filters: z
    .object({
      hideAdult: z.boolean(),
      onlyWatching: z.boolean(),
    })
    .optional(),
  locale: z.enum(["en", "es"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

// Settings form schema (client-side validation)
export const settingsSchema = z.object({
  timezone: z.string(),
  locale: z.enum(["en", "es"]),
  theme: z.enum(["light", "dark", "system"]),
  calendarView: z.enum(["weekly", "season"]),
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

// ============ System Logs Schema ============

export const systemLogsQuerySchema = z.object({
  level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional(),
  source: z.enum(["server", "client"]).optional(),
  context: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const clientErrorSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().max(5000).optional(),
  context: z.string().max(100).optional(),
  url: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const clientLogSchema = z.object({
  level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  message: z.string().min(1).max(1000),
  context: z.string().max(100).optional(),
  url: z.string().max(500).optional(),
  stack: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const clientLogBatchSchema = z.object({
  logs: z.array(clientLogSchema).min(1).max(100),
});

// ============ Email Schema ============

export const emailSendSchema = z
  .object({
    to: z.union([z.string().email(), z.array(z.string().email()).min(1).max(50)]),
    subject: z.string().min(1).max(200),
    text: z.string().max(5000).optional(),
    html: z.string().max(20000).optional(),
    cc: z.union([z.string().email(), z.array(z.string().email()).min(1).max(20)]).optional(),
    bcc: z.union([z.string().email(), z.array(z.string().email()).min(1).max(20)]).optional(),
    replyTo: z.string().email().optional(),
  })
  .refine((data) => Boolean(data.text || data.html), {
    message: "Either text or html content must be provided",
    path: ["text"],
  });

// ============ Type exports ============

export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
export type SeasonQueryParams = z.infer<typeof seasonQuerySchema>;
export type SettingsUpdateParams = z.infer<typeof settingsUpdateSchema>;
export type LibraryUpsertParams = z.infer<typeof libraryUpsertSchema>;
export type TrendingQueryParams = z.infer<typeof trendingQuerySchema>;
export type TopSearchQueryParams = z.infer<typeof topSearchQuerySchema>;
export type PopularQueryParams = z.infer<typeof popularQuerySchema>;
export type SystemLogsQueryParams = z.infer<typeof systemLogsQuerySchema>;
export type ClientErrorParams = z.infer<typeof clientErrorSchema>;
export type EmailSendParams = z.infer<typeof emailSendSchema>;
