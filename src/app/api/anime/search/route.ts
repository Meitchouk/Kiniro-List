import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache, getManyAnimeFromCache } from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { searchQuerySchema } from "@/lib/schemas";
import { getOrSetJSON } from "@/lib/redisCache";
import { trackSearchQuery } from "@/lib/metrics";
import type { AniListMedia, PaginationInfo } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = searchQuerySchema.safeParse({
      q: searchParams.get("q"),
      page: searchParams.get("page") || "1",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { q, page } = parseResult.data;

    // Ephemeral cache for AniList search results to reduce API churn
    const cacheKey = `cache:search:q=${encodeURIComponent(q)}:page=${page}`;
    const { media, pageInfo } = await getOrSetJSON<{
      media: AniListMedia[];
      pageInfo: PaginationInfo;
    }>(cacheKey, 300, () => searchAnime(q, page));

    // Track search query popularity (fire-and-forget semantics)
    trackSearchQuery(q).catch(() => {});

    // Cache anime metadata (with slugs)
    if (media.length > 0) {
      await upsertManyAnimeCache(media);
    }

    // Always get from cache to ensure we have slugs
    const animeIds = media.map((m) => m.id);
    const cachedAnime = await getManyAnimeFromCache(animeIds);
    const anime = animeIds.map((id) => cachedAnime.get(id)).filter((a) => a !== undefined);

    return NextResponse.json({
      anime,
      pagination: pageInfo,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search anime" }, { status: 500 });
  }
}
