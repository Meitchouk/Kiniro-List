/**
 * Server-side logger that captures ALL console output
 * Intercepts console.log, console.error, process.stdout/stderr
 * to capture Next.js logs, HTTP requests, compilation messages, etc.
 */

import fs from "fs";
import path from "path";
import type { LogEntry, LogLevel, LogQueryParams, LogSource, PaginatedLogResponse } from "./types";

// Use "app-logs" folder name to avoid gitignore "logs" pattern
const LOG_DIR = path.join(process.cwd(), "app-logs");
const LOG_FILE_PREFIX = "kiniro";
const MAX_LOG_FILES = 7; // Keep 7 days of logs

// Track if we've already intercepted to avoid double-patching
let isIntercepted = false;

// Store original functions
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

/**
 * Ensure log directory exists
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Get current log file path based on date
 */
function getCurrentLogFilePath(): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `${LOG_FILE_PREFIX}-${date}.jsonl`);
}

/**
 * Get all log files sorted by date (newest first)
 */
function getLogFiles(): string[] {
  ensureLogDir();
  try {
    const files = fs.readdirSync(LOG_DIR);
    return files
      .filter((f) => f.startsWith(LOG_FILE_PREFIX) && f.endsWith(".jsonl"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Rotate log files if needed (delete old files)
 */
function rotateLogsIfNeeded(): void {
  const files = getLogFiles();
  if (files.length > MAX_LOG_FILES) {
    const filesToDelete = files.slice(MAX_LOG_FILES);
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(LOG_DIR, file));
      } catch {
        // Ignore deletion errors
      }
    }
  }
}

/**
 * Write a log entry to file
 */
function writeToFile(entry: LogEntry): void {
  try {
    ensureLogDir();
    rotateLogsIfNeeded();
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(getCurrentLogFilePath(), line);
  } catch {
    // Silently fail - don't break the app
  }
}

/**
 * Detect log level from message content
 */
function detectLevel(message: string, isError: boolean = false): LogLevel {
  if (isError) return "error";
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("failed") || lower.includes("exception"))
    return "error";
  if (lower.includes("warn")) return "warn";
  if (lower.includes("debug")) return "debug";
  return "info";
}

/**
 * Detect context from message (Next.js patterns)
 */
function detectContext(message: string): string | undefined {
  if (message.includes("Compiled")) return "next:compiler";
  if (message.includes("GET ") || message.includes("POST ") || message.includes("PUT "))
    return "next:request";
  if (message.includes("./src/") || message.includes("./app/")) return "next:hmr";
  if (message.includes("[webpack")) return "next:webpack";
  return undefined;
}

/**
 * Convert args to string message
 */
function argsToString(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

/**
 * Strip ANSI color codes from string
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Intercept all console output and save to file
 */
function interceptConsole(): void {
  if (isIntercepted) return;
  isIntercepted = true;

  // Intercept console.log
  console.log = (...args: unknown[]) => {
    originalConsoleLog(...args);
    const message = stripAnsi(argsToString(args));
    if (message.trim()) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: detectLevel(message),
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
  };

  // Intercept console.error
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    const message = stripAnsi(argsToString(args));
    if (message.trim()) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: "error",
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
  };

  // Intercept console.warn
  console.warn = (...args: unknown[]) => {
    originalConsoleWarn(...args);
    const message = stripAnsi(argsToString(args));
    if (message.trim()) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: "warn",
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
  };

  // Intercept console.info
  console.info = (...args: unknown[]) => {
    originalConsoleInfo(...args);
    const message = stripAnsi(argsToString(args));
    if (message.trim()) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: "info",
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
  };

  // Intercept console.debug
  console.debug = (...args: unknown[]) => {
    originalConsoleDebug(...args);
    const message = stripAnsi(argsToString(args));
    if (message.trim()) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: "debug",
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
  };

  // Intercept process.stdout.write (captures Next.js output)
  process.stdout.write = ((
    chunk: string | Uint8Array,
    encodingOrCallback?: BufferEncoding | ((err?: Error | null) => void),
    callback?: (err?: Error | null) => void
  ): boolean => {
    const message = stripAnsi(typeof chunk === "string" ? chunk : chunk.toString());
    if (message.trim() && !message.includes("[Logger]")) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: detectLevel(message),
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
    if (typeof encodingOrCallback === "function") {
      return originalStdoutWrite(chunk, encodingOrCallback);
    }
    return originalStdoutWrite(chunk, encodingOrCallback, callback);
  }) as typeof process.stdout.write;

  // Intercept process.stderr.write
  process.stderr.write = ((
    chunk: string | Uint8Array,
    encodingOrCallback?: BufferEncoding | ((err?: Error | null) => void),
    callback?: (err?: Error | null) => void
  ): boolean => {
    const message = stripAnsi(typeof chunk === "string" ? chunk : chunk.toString());
    if (message.trim() && !message.includes("[Logger]")) {
      writeToFile({
        timestamp: new Date().toISOString(),
        level: "error",
        source: "server",
        message: message.trim(),
        context: detectContext(message),
      });
    }
    if (typeof encodingOrCallback === "function") {
      return originalStderrWrite(chunk, encodingOrCallback);
    }
    return originalStderrWrite(chunk, encodingOrCallback, callback);
  }) as typeof process.stderr.write;
}

// Start intercepting on module load
ensureLogDir();
interceptConsole();

/**
 * Logger wrapper with explicit logging API
 */
export const logger = {
  trace(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "trace",
      source: "server",
      message,
      context,
      metadata,
    });
    originalConsoleLog(`[TRACE]${context ? ` [${context}]` : ""} ${message}`);
  },

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "debug",
      source: "server",
      message,
      context,
      metadata,
    });
    originalConsoleLog(`[DEBUG]${context ? ` [${context}]` : ""} ${message}`);
  },

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "info",
      source: "server",
      message,
      context,
      metadata,
    });
    originalConsoleLog(`[INFO]${context ? ` [${context}]` : ""} ${message}`);
  },

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "warn",
      source: "server",
      message,
      context,
      metadata,
    });
    originalConsoleWarn(`[WARN]${context ? ` [${context}]` : ""} ${message}`);
  },

  error(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "error",
      source: "server",
      message,
      context,
      metadata,
      stack: error?.stack,
    });
    originalConsoleError(`[ERROR]${context ? ` [${context}]` : ""} ${message}`);
    if (error) {
      originalConsoleError(error);
    }
  },

  fatal(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    writeToFile({
      timestamp: new Date().toISOString(),
      level: "fatal",
      source: "server",
      message,
      context,
      metadata,
      stack: error?.stack,
    });
    originalConsoleError(`[FATAL]${context ? ` [${context}]` : ""} ${message}`);
    if (error) {
      originalConsoleError(error);
    }
  },

  /**
   * Log a client-side log (received from frontend)
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
    writeToFile({
      timestamp: new Date().toISOString(),
      level,
      source: "client",
      message: `[CLIENT] ${message}`,
      context: options.context,
      stack: options.stack,
      url: options.url,
      userAgent: options.userAgent,
      userId: options.userId,
      metadata: options.metadata,
    });
    const logFn =
      level === "error" || level === "fatal" ? originalConsoleError : originalConsoleLog;
    logFn(
      `[CLIENT:${level.toUpperCase()}]${options.context ? ` [${options.context}]` : ""} ${message}`
    );
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
      trace: (msg: string, meta?: Record<string, unknown>) => logger.trace(msg, context, meta),
      debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, context, meta),
      info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, context, meta),
      warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, context, meta),
      error: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        logger.error(msg, context, meta, err),
      fatal: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        logger.fatal(msg, context, meta, err),
    };
  },
};

/**
 * Read and parse log entries from files
 */
function readLogEntries(): LogEntry[] {
  const files = getLogFiles();
  const entries: LogEntry[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(LOG_DIR, file), "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const raw = JSON.parse(line) as LogEntry;

          // Already in our format
          const entry: LogEntry = {
            timestamp: raw.timestamp,
            level: raw.level,
            source: raw.source || "server",
            message: raw.message || "",
            context: raw.context,
            metadata: raw.metadata,
            stack: raw.stack,
            url: raw.url,
            userAgent: raw.userAgent,
            userId: raw.userId,
          };

          entries.push(entry);
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  // Sort by timestamp descending (newest first)
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Query logs with filters and pagination
 */
export function queryLogs(params: LogQueryParams): PaginatedLogResponse {
  let entries = readLogEntries();

  // Apply filters
  if (params.level) {
    entries = entries.filter((e) => e.level === params.level);
  }

  if (params.source) {
    entries = entries.filter((e) => e.source === params.source);
  }

  if (params.context) {
    entries = entries.filter((e) =>
      e.context?.toLowerCase().includes(params.context!.toLowerCase())
    );
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.message.toLowerCase().includes(searchLower) ||
        e.stack?.toLowerCase().includes(searchLower) ||
        JSON.stringify(e.metadata || {})
          .toLowerCase()
          .includes(searchLower)
    );
  }

  if (params.startDate) {
    const startTime = new Date(params.startDate).getTime();
    entries = entries.filter((e) => new Date(e.timestamp).getTime() >= startTime);
  }

  if (params.endDate) {
    const endTime = new Date(params.endDate).getTime();
    entries = entries.filter((e) => new Date(e.timestamp).getTime() <= endTime);
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
}

/**
 * Get log statistics
 */
export function getLogStats(): {
  totalEntries: number;
  byLevel: Record<LogLevel, number>;
  bySource: Record<LogSource, number>;
  logFiles: string[];
  oldestEntry?: string;
  newestEntry?: string;
} {
  const entries = readLogEntries();
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

  for (const entry of entries) {
    byLevel[entry.level]++;
    bySource[entry.source]++;
  }

  return {
    totalEntries: entries.length,
    byLevel,
    bySource,
    logFiles: getLogFiles(),
    oldestEntry: entries[entries.length - 1]?.timestamp,
    newestEntry: entries[0]?.timestamp,
  };
}

/**
 * Clear all logs (use with caution)
 */
export function clearLogs(): { deleted: number } {
  const files = getLogFiles();
  let deleted = 0;

  for (const file of files) {
    try {
      fs.unlinkSync(path.join(LOG_DIR, file));
      deleted++;
    } catch {
      // Ignore deletion errors
    }
  }

  return { deleted };
}
