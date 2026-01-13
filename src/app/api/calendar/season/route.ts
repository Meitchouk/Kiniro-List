import { NextRequest, NextResponse } from "next/server";
import { getAllSeasonAnime, paginateLocally } from "@/lib/anilist/client";
import {
  upsertManyAnimeCache,
  getManyAnimeFromCache,
  getSeasonFromCache,
  upsertSeasonCache,
} from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { seasonQuerySchema } from "@/lib/validation/schemas";
import { getOrSetJSON } from "@/lib/redis/cache";
import type { AnimeCache, PaginationInfo, MediaSeason } from "@/lib/types";

const PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "calendar");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = seasonQuerySchema.safeParse({
      year: searchParams.get("year"),
      season: searchParams.get("season"),
      page: searchParams.get("page") || "1",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { year, season, page } = parseResult.data;

    const cacheKey = `cache:calendar:season:${year}:${season}:page=${page}`;
    const result = await getOrSetJSON<{
      anime: AnimeCache[];
      pagination: PaginationInfo;
      season: MediaSeason;
      year: number;
    }>(cacheKey, 300, async () => {
      let allAnimeIds = await getSeasonFromCache(season, year);
      if (!allAnimeIds) {
        const allMedia = await getAllSeasonAnime(season, year);
        allAnimeIds = allMedia.map((m) => m.id);
        if (allMedia.length > 0) {
          await Promise.all([
            upsertSeasonCache(season, year, allAnimeIds),
            upsertManyAnimeCache(allMedia),
          ]);
        }
      }

      const { items: paginatedIds, pageInfo } = paginateLocally(allAnimeIds, page, PER_PAGE);
      const cachedAnime = await getManyAnimeFromCache(paginatedIds);
      const anime = paginatedIds.map((id) => cachedAnime.get(id)).filter((a) => a !== undefined);

      return { anime, pagination: pageInfo, season, year };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calendar season error:", error);
    return NextResponse.json({ error: "Failed to fetch season" }, { status: 500 });
  }
}
