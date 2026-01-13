/**
 * Client Log Report API Route
 * Webhook endpoint for frontend to send logs to backend
 *
 * POST /api/system-logs/report - Report a single log entry
 *
 * This allows the frontend to send any type of log (info, warn, error, etc.)
 * to be stored in the server logs with source="client"
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { clientLogSchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import type { LogLevel } from "@/lib/logging";

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse request body
    const body = await request.json();

    // Validate payload
    const parseResult = clientLogSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid log payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { level, message, context, url, stack, metadata } = parseResult.data;

    // Extract client info from headers
    const userAgent = request.headers.get("user-agent") || undefined;

    // Use the unified clientLog method
    logger.clientLog(level as LogLevel, message, {
      context,
      url,
      stack,
      userAgent,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Log recorded",
    });
  } catch (error) {
    console.error("[system-logs/report] POST error:", error);
    return NextResponse.json({ error: "Failed to record log" }, { status: 500 });
  }
}
