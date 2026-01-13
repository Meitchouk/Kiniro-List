/**
 * Logging types and interfaces
 */

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type LogSource = "server" | "client";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  // Client-specific fields
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface LogQueryParams {
  level?: LogLevel;
  source?: LogSource;
  context?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface PaginatedLogResponse {
  entries: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    level?: LogLevel;
    source?: LogSource;
    context?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
}

// Client error payload (sent from frontend)
export interface ClientErrorPayload {
  message: string;
  stack?: string;
  context?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}
