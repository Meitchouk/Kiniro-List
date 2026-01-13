/**
 * System Logs API Route
 * Backend-only endpoint for querying application logs
 *
 * GET /api/system-logs - Query logs with filters and pagination
 * DELETE /api/system-logs - Clear all logs (requires confirmation)
 *
 * Query Parameters:
 * - level: Filter by log level (trace, debug, info, warn, error, fatal)
 * - source: Filter by source (server, client)
 * - context: Filter by context string (partial match)
 * - search: Search in message, stack, and metadata
 * - startDate: Filter logs after this ISO date
 * - endDate: Filter logs before this ISO date
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { queryLogs, clearLogs } from "@/lib/logging";
import { systemLogsQuerySchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit check (use a restrictive limit for admin endpoints)
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      level: searchParams.get("level") || undefined,
      source: searchParams.get("source") || undefined,
      context: searchParams.get("context") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    };

    const parseResult = systemLogsQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const params = parseResult.data;

    // Query logs with filters
    const result = queryLogs({
      level: params.level,
      source: params.source,
      context: params.context,
      search: params.search,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      limit: params.limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[system-logs] GET error:", error);
    return NextResponse.json({ error: "Failed to query logs" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Require confirmation query param to prevent accidental deletion
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");

    if (confirm !== "true") {
      return NextResponse.json(
        {
          error: "Confirmation required",
          message: "Add ?confirm=true to confirm log deletion",
        },
        { status: 400 }
      );
    }

    const result = clearLogs();

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deleted} log file(s)`,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("[system-logs] DELETE error:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}
