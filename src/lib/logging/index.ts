/**
 * Logging module exports
 */

// Server-side logger (do not import in client components)
export { logger, queryLogs, getLogStats, clearLogs } from "./logger";

// Client-side logger (safe for client components)
export { clientLogger, reportError, setupGlobalErrorHandler, reportReactError } from "./client";

// Types
export type {
  LogEntry,
  LogLevel,
  LogSource,
  LogQueryParams,
  PaginatedLogResponse,
  ClientErrorPayload,
} from "./types";
