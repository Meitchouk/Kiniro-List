/**
 * Client-side logger
 * Sends logs from the frontend to the backend logging system
 *
 * Usage:
 * - clientLogger.info("User clicked button", "ButtonComponent")
 * - clientLogger.error("Failed to load", "DataFetcher", error)
 * - setupGlobalErrorHandler() - Capture uncaught errors automatically
 */

import type { LogLevel } from "./types";

interface LogOptions {
  context?: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

interface ClientLogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  url?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

// Buffer for batching logs (optional optimization)
let logBuffer: ClientLogPayload[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Send a single log to the backend
 */
async function sendLog(payload: ClientLogPayload): Promise<void> {
  try {
    fetch("/api/system-logs/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail - don't cause more errors
      console.warn("[ClientLogger] Failed to send log");
    });
  } catch {
    // Fallback to console
    console.warn("[ClientLogger] Error sending log");
  }
}

/**
 * Send buffered logs to the backend
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const logsToSend = [...logBuffer];
  logBuffer = [];

  try {
    fetch("/api/system-logs/report/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: logsToSend }),
    }).catch(() => {
      console.warn("[ClientLogger] Failed to flush logs");
    });
  } catch {
    console.warn("[ClientLogger] Error flushing logs");
  }
}

/**
 * Add log to buffer or send immediately based on level
 */
function bufferOrSend(payload: ClientLogPayload): void {
  // Send errors and fatals immediately
  if (payload.level === "error" || payload.level === "fatal") {
    sendLog(payload);
    return;
  }

  // Buffer other logs
  logBuffer.push(payload);

  // Flush if buffer is full
  if (logBuffer.length >= BUFFER_SIZE) {
    flushLogs();
    return;
  }

  // Set up flush timeout
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushLogs();
      flushTimeout = null;
    }, FLUSH_INTERVAL);
  }
}

/**
 * Create a log entry with common fields
 */
function createLogPayload(
  level: LogLevel,
  message: string,
  options: LogOptions = {}
): ClientLogPayload {
  return {
    level,
    message,
    context: options.context,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    stack: options.error?.stack,
    metadata: options.metadata,
  };
}

/**
 * Client-side logger with same API as server logger
 */
export const clientLogger = {
  trace(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const payload = createLogPayload("trace", message, { context, metadata });
    bufferOrSend(payload);
    if (process.env.NODE_ENV === "development") {
      console.trace(`[TRACE] ${context ? `[${context}]` : ""} ${message}`, metadata || "");
    }
  },

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const payload = createLogPayload("debug", message, { context, metadata });
    bufferOrSend(payload);
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${context ? `[${context}]` : ""} ${message}`, metadata || "");
    }
  },

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const payload = createLogPayload("info", message, { context, metadata });
    bufferOrSend(payload);
    console.info(`[INFO] ${context ? `[${context}]` : ""} ${message}`);
  },

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const payload = createLogPayload("warn", message, { context, metadata });
    bufferOrSend(payload);
    console.warn(`[WARN] ${context ? `[${context}]` : ""} ${message}`, metadata || "");
  },

  error(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    const payload = createLogPayload("error", message, { context, metadata, error });
    bufferOrSend(payload);
    console.error(`[ERROR] ${context ? `[${context}]` : ""} ${message}`, error || metadata || "");
  },

  fatal(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    const payload = createLogPayload("fatal", message, { context, metadata, error });
    bufferOrSend(payload);
    console.error(`[FATAL] ${context ? `[${context}]` : ""} ${message}`, error || metadata || "");
  },

  /**
   * Create a child logger with preset context
   */
  child(context: string) {
    return {
      trace: (msg: string, meta?: Record<string, unknown>) =>
        clientLogger.trace(msg, context, meta),
      debug: (msg: string, meta?: Record<string, unknown>) =>
        clientLogger.debug(msg, context, meta),
      info: (msg: string, meta?: Record<string, unknown>) => clientLogger.info(msg, context, meta),
      warn: (msg: string, meta?: Record<string, unknown>) => clientLogger.warn(msg, context, meta),
      error: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        clientLogger.error(msg, context, meta, err),
      fatal: (msg: string, meta?: Record<string, unknown>, err?: Error) =>
        clientLogger.fatal(msg, context, meta, err),
    };
  },

  /**
   * Manually flush all buffered logs
   */
  flush: flushLogs,
};

/**
 * Report an error to the backend logging system (convenience function)
 */
export async function reportError(
  error: Error | string,
  options: { context?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  const message = error instanceof Error ? error.message : error;
  const err = error instanceof Error ? error : undefined;
  clientLogger.error(message, options.context, options.metadata, err);
}

/**
 * Setup global error handlers to automatically capture uncaught errors
 * Call this once in your app's entry point (e.g., layout or _app)
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === "undefined") return;

  // Capture uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    clientLogger.error(
      error?.message || String(message),
      "window.onerror",
      { source, lineno, colno },
      error || undefined
    );
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = (event) => {
    const error = event.reason;
    if (error instanceof Error) {
      clientLogger.error(error.message, "unhandledrejection", undefined, error);
    } else {
      clientLogger.error(String(error), "unhandledrejection");
    }
  };

  // Flush logs before page unload
  window.addEventListener("beforeunload", () => {
    flushLogs();
  });

  // Flush logs when page becomes hidden (mobile)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushLogs();
    }
  });
}

/**
 * React Error Boundary helper - call this in componentDidCatch
 */
export function reportReactError(error: Error, errorInfo: { componentStack?: string }): void {
  clientLogger.error(
    error.message,
    "ReactErrorBoundary",
    { componentStack: errorInfo.componentStack },
    error
  );
}
