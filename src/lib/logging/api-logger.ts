/**
 * API Route Wrapper with automatic logging
 * Wraps Next.js route handlers to automatically log requests and errors
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreLogger as logger } from "./firestore-logger";

// Next.js 15 App Router route context type
type RouteContext = { params: Promise<Record<string, string>> };

type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

interface WrapOptions {
  /** Context name for the log (e.g., "anime", "calendar") */
  context: string;
  /** Skip logging for successful requests (only log errors) */
  errorsOnly?: boolean;
  /** Skip logging entirely for this route */
  skipLogging?: boolean;
}

/**
 * Extract useful info from request for logging
 */
function getRequestInfo(request: NextRequest) {
  const url = new URL(request.url);
  return {
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  };
}

/**
 * Wrap an API route handler with automatic logging
 *
 * @example
 * ```ts
 * export const GET = withLogging(
 *   async (request) => {
 *     // Your handler code
 *     return NextResponse.json({ data });
 *   },
 *   { context: "anime" }
 * );
 * ```
 */
export function withLogging(handler: RouteHandler, options: WrapOptions): RouteHandler {
  return async (request, context) => {
    if (options.skipLogging) {
      return handler(request, context);
    }

    const startTime = Date.now();
    const requestInfo = getRequestInfo(request);

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Log successful requests (unless errorsOnly is set)
      if (!options.errorsOnly) {
        const status = response.status;
        const level = status >= 400 ? (status >= 500 ? "error" : "warn") : "info";

        if (level === "info") {
          logger.info(
            `${requestInfo.method} ${requestInfo.path} ${status} ${duration}ms`,
            `api:${options.context}`,
            {
              ...requestInfo,
              statusCode: status,
              durationMs: duration,
            }
          );
        } else if (level === "warn") {
          logger.warn(
            `${requestInfo.method} ${requestInfo.path} ${status} ${duration}ms`,
            `api:${options.context}`,
            {
              ...requestInfo,
              statusCode: status,
              durationMs: duration,
            }
          );
        } else {
          logger.error(
            `${requestInfo.method} ${requestInfo.path} ${status} ${duration}ms`,
            `api:${options.context}`,
            {
              ...requestInfo,
              statusCode: status,
              durationMs: duration,
            }
          );
        }
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Always log errors
      logger.error(
        `${requestInfo.method} ${requestInfo.path} EXCEPTION ${duration}ms: ${error instanceof Error ? error.message : String(error)}`,
        `api:${options.context}`,
        {
          ...requestInfo,
          durationMs: duration,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
        error instanceof Error ? error : undefined
      );

      // Re-throw to let Next.js handle it
      throw error;
    }
  };
}

/**
 * Log a specific event (for use inside route handlers)
 */
export const logEvent = {
  /** Log user authentication events */
  auth: (
    action: "login" | "logout" | "signup" | "password_reset",
    userId?: string,
    metadata?: Record<string, unknown>
  ) => {
    logger.info(`Auth: ${action}${userId ? ` (${userId})` : ""}`, "auth", {
      action,
      userId,
      ...metadata,
    });
  },

  /** Log admin actions */
  admin: (
    action: string,
    adminId: string,
    targetId?: string,
    metadata?: Record<string, unknown>
  ) => {
    logger.info(
      `Admin action: ${action}${targetId ? ` on ${targetId}` : ""} by ${adminId}`,
      "admin",
      { action, adminId, targetId, ...metadata }
    );
  },

  /** Log database operations */
  database: (
    operation: "read" | "write" | "delete" | "create" | "update",
    collection: string,
    docId?: string,
    metadata?: Record<string, unknown>
  ) => {
    logger.debug(`DB ${operation}: ${collection}${docId ? `/${docId}` : ""}`, "database", {
      operation,
      collection,
      docId,
      ...metadata,
    });
  },

  /** Log external API calls */
  external: (
    service: string,
    operation: string,
    statusCode: number,
    durationMs?: number,
    metadata?: Record<string, unknown>
  ) => {
    const success = statusCode >= 200 && statusCode < 400;
    const level = success ? "info" : "error";
    const message = `External API: ${service} ${operation} ${statusCode}${durationMs ? ` ${durationMs}ms` : ""}`;

    if (level === "info") {
      logger.info(message, "external", { service, operation, statusCode, durationMs, ...metadata });
    } else {
      logger.error(message, "external", {
        service,
        operation,
        statusCode,
        durationMs,
        ...metadata,
      });
    }
  },

  /** Log rate limiting events */
  rateLimit: (ip: string, endpoint: string, metadata?: Record<string, unknown>) => {
    logger.warn(`Rate limit exceeded: ${ip} on ${endpoint}`, "ratelimit", {
      ip,
      endpoint,
      ...metadata,
    });
  },

  /** Log cron job execution */
  cron: (
    jobName: string,
    status: "started" | "completed" | "failed",
    durationMs?: number,
    metadata?: Record<string, unknown>
  ) => {
    const level = status === "failed" ? "error" : "info";
    const message = `Cron ${jobName}: ${status}${durationMs ? ` ${durationMs}ms` : ""}`;

    if (level === "info") {
      logger.info(message, "cron", { jobName, status, durationMs, ...metadata });
    } else {
      logger.error(message, "cron", { jobName, status, durationMs, ...metadata });
    }
  },

  /** Log security events */
  security: (
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    metadata?: Record<string, unknown>
  ) => {
    const level =
      severity === "critical" || severity === "high"
        ? "error"
        : severity === "medium"
          ? "warn"
          : "info";
    const message = `Security [${severity.toUpperCase()}]: ${event}`;

    if (level === "error") {
      logger.error(message, "security", { event, severity, ...metadata });
    } else if (level === "warn") {
      logger.warn(message, "security", { event, severity, ...metadata });
    } else {
      logger.info(message, "security", { event, severity, ...metadata });
    }
  },

  /** Log unauthorized access attempts */
  unauthorizedAccess: (
    endpoint: string,
    reason: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) => {
    logger.warn(
      `Unauthorized access: ${endpoint} - ${reason}${userId ? ` (${userId})` : ""}`,
      "security",
      { event: "unauthorized_access", endpoint, reason, userId, ...metadata }
    );
  },

  /** Generic custom event */
  custom: (
    message: string,
    context: string,
    level: "info" | "warn" | "error" = "info",
    metadata?: Record<string, unknown>
  ) => {
    if (level === "error") {
      logger.error(message, context, metadata);
    } else if (level === "warn") {
      logger.warn(message, context, metadata);
    } else {
      logger.info(message, context, metadata);
    }
  },
};
