/**
 * Firestore-based logger for serverless environments (Vercel)
 * Stores logs in Firestore instead of the filesystem
 */

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { LogEntry, LogLevel, LogQueryParams, LogSource, PaginatedLogResponse } from "./types";

const LOGS_COLLECTION = "system_logs";
const MAX_LOGS_DAYS = 7; // Keep 7 days of logs
const BATCH_SIZE = 500; // Firestore batch limit

/**
 * Get Firestore instance
 */
function getDb(): Firestore {
  return getAdminFirestore();
}

/**
 * Write a log entry to Firestore
 */
async function writeToFirestore(entry: LogEntry): Promise<void> {
  try {
    const db = getDb();
    const docRef = db.collection(LOGS_COLLECTION).doc();
    await docRef.set({
      ...entry,
      createdAt: new Date(entry.timestamp),
    });
  } catch (error) {
    // Use original console to avoid infinite loop
    const originalConsoleError = console.error;
    originalConsoleError("[FirestoreLogger] Failed to write log:", error);
  }
}

/**
 * Write a log entry (fire-and-forget for performance)
 */
function writeLog(entry: LogEntry): void {
  // Fire and forget - don't await to avoid blocking
  writeToFirestore(entry).catch(() => {
    // Silently fail
  });
}

/**
 * Logger with explicit logging API for Firestore
 */
export const firestoreLogger = {
  trace(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "trace",
      source: "server",
      message,
      context,
      metadata,
    });
  },

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "debug",
      source: "server",
      message,
      context,
      metadata,
    });
  },

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "info",
      source: "server",
      message,
      context,
      metadata,
    });
  },

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      source: "server",
      message,
      context,
      metadata,
    });
  },

  error(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      source: "server",
      message,
      context,
      metadata,
      stack: error?.stack,
    });
  },

  fatal(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "fatal",
      source: "server",
      message,
      context,
      metadata,
      stack: error?.stack,
    });
  },

  /**
   * Log API requests
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): void {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    writeLog({
      timestamp: new Date().toISOString(),
      level,
      source: "server",
      message: `${method} ${path} ${statusCode} ${durationMs}ms`,
      context: "api:request",
      metadata: {
        method,
        path,
        statusCode,
        durationMs,
        ...metadata,
      },
    });
  },

  /**
   * Log client-side errors
   */
  clientLog(
    level: LogLevel,
    message: string,
    options: {
      stack?: string;
      context?: string;
      url?: string;
      userAgent?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level,
      source: "client",
      message,
      context: options.context,
      metadata: options.metadata,
      stack: options.stack,
      url: options.url,
      userAgent: options.userAgent,
      userId: options.userId,
    });
  },

  /**
   * Log a client-side error (alias for clientLog with level=error)
   */
  clientError(
    message: string,
    options: {
      stack?: string;
      context?: string;
      url?: string;
      userAgent?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    this.clientLog("error", message, options);
  },

  /**
   * Create a child logger with preset context
   */
  child(context: string) {
    return {
      trace: (msg: string, meta?: Record<string, unknown>) =>
        firestoreLogger.trace(msg, context, meta),
      debug: (msg: string, meta?: Record<string, unknown>) =>
        firestoreLogger.debug(msg, context, meta),
      info: (msg: string, meta?: Record<string, unknown>) =>
        firestoreLogger.info(msg, context, meta),
      warn: (msg: string, meta?: Record<string, unknown>) =>
        firestoreLogger.warn(msg, context, meta),
      error: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        firestoreLogger.error(msg, context, meta, err),
      fatal: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        firestoreLogger.fatal(msg, context, meta, err),
    };
  },
};

/**
 * Query logs from Firestore with filters and pagination
 */
export async function queryLogsFromFirestore(
  params: LogQueryParams
): Promise<PaginatedLogResponse> {
  try {
    const db = getDb();
    let query = db.collection(LOGS_COLLECTION).orderBy("createdAt", "desc");

    // Apply filters
    if (params.level) {
      query = query.where("level", "==", params.level);
    }

    if (params.source) {
      query = query.where("source", "==", params.source);
    }

    if (params.startDate) {
      query = query.where("createdAt", ">=", new Date(params.startDate));
    }

    if (params.endDate) {
      query = query.where("createdAt", "<=", new Date(params.endDate));
    }

    // Get total count (approximation - Firestore doesn't have native count before v9.6)
    const countSnapshot = await query.limit(10000).get();
    let entries = countSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp,
        level: data.level as LogLevel,
        source: data.source as LogSource,
        message: data.message || "",
        context: data.context,
        metadata: data.metadata,
        stack: data.stack,
        url: data.url,
        userAgent: data.userAgent,
        userId: data.userId,
      } as LogEntry & { id: string };
    });

    // Apply text filters (can't do in Firestore query)
    if (params.context) {
      const contextLower = params.context.toLowerCase();
      entries = entries.filter((e: LogEntry & { id: string }) =>
        e.context?.toLowerCase().includes(contextLower)
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      entries = entries.filter(
        (e: LogEntry & { id: string }) =>
          e.message.toLowerCase().includes(searchLower) ||
          e.stack?.toLowerCase().includes(searchLower) ||
          JSON.stringify(e.metadata || {})
            .toLowerCase()
            .includes(searchLower)
      );
    }

    // Calculate pagination
    const total = entries.length;
    const totalPages = Math.ceil(total / params.limit);
    const startIndex = (params.page - 1) * params.limit;
    const paginatedEntries = entries.slice(startIndex, startIndex + params.limit);

    return {
      entries: paginatedEntries,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasMore: params.page < totalPages,
      },
      filters: {
        level: params.level,
        source: params.source,
        context: params.context,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };
  } catch (error) {
    console.error("[FirestoreLogger] Query error:", error);
    return {
      entries: [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
      filters: {
        level: params.level,
        source: params.source,
        context: params.context,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };
  }
}

/**
 * Get log statistics from Firestore
 */
export async function getLogStatsFromFirestore(): Promise<{
  totalEntries: number;
  byLevel: Record<LogLevel, number>;
  bySource: Record<LogSource, number>;
  oldestEntry?: string;
  newestEntry?: string;
}> {
  try {
    const db = getDb();
    const snapshot = await db
      .collection(LOGS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(10000)
      .get();

    const byLevel: Record<LogLevel, number> = {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    const bySource: Record<LogSource, number> = {
      server: 0,
      client: 0,
    };

    let oldestEntry: string | undefined;
    let newestEntry: string | undefined;

    snapshot.docs.forEach((doc: QueryDocumentSnapshot, index: number) => {
      const data = doc.data();
      const level = data.level as LogLevel;
      const source = data.source as LogSource;

      if (byLevel[level] !== undefined) byLevel[level]++;
      if (bySource[source] !== undefined) bySource[source]++;

      if (index === 0) newestEntry = data.timestamp;
      oldestEntry = data.timestamp;
    });

    return {
      totalEntries: snapshot.size,
      byLevel,
      bySource,
      oldestEntry,
      newestEntry,
    };
  } catch (error) {
    console.error("[FirestoreLogger] Stats error:", error);
    return {
      totalEntries: 0,
      byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
      bySource: { server: 0, client: 0 },
    };
  }
}

/**
 * Clear old logs (older than MAX_LOGS_DAYS)
 */
export async function clearOldLogs(): Promise<{ deleted: number }> {
  try {
    const db = getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_LOGS_DAYS);

    const oldLogsSnapshot = await db
      .collection(LOGS_COLLECTION)
      .where("createdAt", "<", cutoffDate)
      .limit(BATCH_SIZE)
      .get();

    if (oldLogsSnapshot.empty) {
      return { deleted: 0 };
    }

    const batch = db.batch();
    oldLogsSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // If there might be more, recursively delete
    if (oldLogsSnapshot.size === BATCH_SIZE) {
      const moreDeleted = await clearOldLogs();
      return { deleted: oldLogsSnapshot.size + moreDeleted.deleted };
    }

    return { deleted: oldLogsSnapshot.size };
  } catch (error) {
    console.error("[FirestoreLogger] Clear old logs error:", error);
    return { deleted: 0 };
  }
}

/**
 * Clear all logs (use with caution)
 */
export async function clearAllLogs(): Promise<{ deleted: number }> {
  try {
    const db = getDb();
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const snapshot = await db.collection(LOGS_COLLECTION).limit(BATCH_SIZE).get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.size;

      if (snapshot.size < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return { deleted: totalDeleted };
  } catch (error) {
    console.error("[FirestoreLogger] Clear all logs error:", error);
    return { deleted: 0 };
  }
}
