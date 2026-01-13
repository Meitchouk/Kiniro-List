/**
 * Client Log Batch Report API Route
 * Webhook endpoint for frontend to send multiple logs at once
 *
 * POST /api/system-logs/report/batch - Report multiple log entries
 *
 * This is optimized for the client logger's buffering system
 * to reduce network requests
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { clientLogBatchSchema } from "@/lib/validation/schemas";
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
    const parseResult = clientLogBatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid batch payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { logs } = parseResult.data;

    // Extract client info from headers
    const userAgent = request.headers.get("user-agent") || undefined;

    // Process each log
    let processed = 0;
    for (const log of logs) {
      const { level, message, context, url, stack, metadata } = log;

      logger.clientLog(level as LogLevel, message, {
        context,
        url,
        stack,
        userAgent,
        metadata,
      });
      processed++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} log(s)`,
      processed,
    });
  } catch (error) {
    console.error("[system-logs/report/batch] POST error:", error);
    return NextResponse.json({ error: "Failed to process batch" }, { status: 500 });
  }
}
