/**
 * Logging module exports
 */

// Firestore-based logger for production (serverless environments like Vercel)
export {
  firestoreLogger as logger,
  queryLogsFromFirestore as queryLogs,
  getLogStatsFromFirestore as getLogStats,
  clearAllLogs as clearLogs,
  clearOldLogs,
} from "./firestore-logger";

// API route wrapper and event logging
export { withLogging, logEvent } from "./api-logger";

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
