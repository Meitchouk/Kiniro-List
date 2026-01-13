/**
 * Client Errors API Route
 * Endpoint for frontend to report errors to backend logging
 *
 * POST /api/system-logs/client-errors - Report a client-side error
 *
 * This allows the frontend to send errors that occur in the browser
 * (JavaScript errors, React errors, etc.) to be stored in the server logs.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { clientErrorSchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit check (more restrictive to prevent abuse)
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse request body
    const body = await request.json();

    // Validate payload
    const parseResult = clientErrorSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid error payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { message, stack, context, url, metadata } = parseResult.data;

    // Extract client info from headers
    const userAgent = request.headers.get("user-agent") || undefined;

    // Log the client error
    logger.clientError(message, {
      stack,
      context,
      url,
      userAgent,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Error logged successfully",
    });
  } catch (error) {
    console.error("[system-logs/client-errors] POST error:", error);
    return NextResponse.json({ error: "Failed to log client error" }, { status: 500 });
  }
}
