import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getTopSearchQueries } from "@/lib/redis/metrics";
import { topSearchQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const parseResult = topSearchQuerySchema.safeParse({
      limit: searchParams.get("limit") || "10",
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { limit } = parseResult.data;
    const queries = await getTopSearchQueries(limit);

    return NextResponse.json({ queries });
  } catch (error) {
    console.error("Top search queries error:", error);
    return NextResponse.json({ error: "Failed to fetch top search queries" }, { status: 500 });
  }
}
