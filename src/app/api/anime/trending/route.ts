import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getTrendingAnime } from "@/lib/redis/metrics";
import { getManyAnimeFromCache } from "@/lib/firestore/cache";
import { trendingQuerySchema } from "@/lib/validation/schemas";
import type { AnimeListResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const parseResult = trendingQuerySchema.safeParse({
      limit: searchParams.get("limit") || "20",
      scope: searchParams.get("scope") || "day",
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { limit, scope } = parseResult.data;
    const ids = await getTrendingAnime(limit, scope);

    if (ids.length === 0) {
      const empty: AnimeListResponse = {
        anime: [],
        pagination: { currentPage: 1, hasNextPage: false, lastPage: 1, perPage: limit, total: 0 },
      };
      return NextResponse.json(empty);
    }

    const cached = await getManyAnimeFromCache(ids);
    const anime = ids.map((id) => cached.get(id)).filter((a) => a !== undefined);

    const response: AnimeListResponse = {
      anime,
      pagination: {
        currentPage: 1,
        hasNextPage: false,
        lastPage: 1,
        perPage: limit,
        total: anime.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Trending anime error:", error);
    return NextResponse.json({ error: "Failed to fetch trending anime" }, { status: 500 });
  }
}
