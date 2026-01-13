import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getGlobalPopularAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache, getManyAnimeFromCache } from "@/lib/firestore/cache";
import { getOrSetJSON } from "@/lib/redisCache";
import { popularQuerySchema } from "@/lib/schemas";
import type { AniListMedia, AnimeListResponse, PaginationInfo } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const parseResult = popularQuerySchema.safeParse({
      limit: searchParams.get("limit") || "20",
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { limit } = parseResult.data;

    // Ephemeral cache: popular list is relatively stable; cache for 30 minutes
    const cacheKey = `cache:popular:limit=${limit}`;
    const media = await getOrSetJSON<AniListMedia[]>(cacheKey, 1800, () =>
      getGlobalPopularAnime(limit)
    );

    if (media.length > 0) {
      await upsertManyAnimeCache(media);
    }

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
      } as PaginationInfo,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Popular anime error:", error);
    return NextResponse.json({ error: "Failed to fetch popular anime" }, { status: 500 });
  }
}
