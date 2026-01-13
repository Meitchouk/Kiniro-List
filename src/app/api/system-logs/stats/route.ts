/**
 * System Logs Stats API Route
 * Backend-only endpoint for getting log statistics
 *
 * GET /api/system-logs/stats - Get log statistics and summary
 */

import { NextRequest, NextResponse } from "next/server";
import { getLogStats } from "@/lib/logging";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const stats = getLogStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[system-logs/stats] GET error:", error);
    return NextResponse.json({ error: "Failed to get log stats" }, { status: 500 });
  }
}
