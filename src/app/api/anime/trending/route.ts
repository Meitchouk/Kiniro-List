import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getTrendingAnime } from "@/lib/redis/metrics";
import { getManyAnimeFromCache, upsertManyAnimeCache } from "@/lib/firestore/cache";
import { getGlobalTrendingAnime } from "@/lib/anilist/client";
import { getOrSetJSON } from "@/lib/redis/cache";
import { trendingQuerySchema } from "@/lib/validation/schemas";
import type { AniListMedia, AnimeListResponse } from "@/lib/types";

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

    // First try to get from user metrics (internal trending)
    const metricsIds = await getTrendingAnime(limit, scope);

    // If we have internal metrics, use them
    if (metricsIds.length >= 5) {
      const cached = await getManyAnimeFromCache(metricsIds);
      const anime = metricsIds.map((id) => cached.get(id)).filter((a) => a !== undefined);

      if (anime.length > 0) {
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
      }
    }

    // Fallback: Get trending from AniList directly
    const cacheKey = `cache:anilist:trending:${limit}`;
    const media = await getOrSetJSON<AniListMedia[]>(cacheKey, 1800, () =>
      getGlobalTrendingAnime(limit)
    );

    // Cache the anime data in Firestore
    if (media.length > 0) {
      await upsertManyAnimeCache(media);
    }

    // Get from cache to ensure consistent format
    const ids = media.map((m) => m.id);
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
