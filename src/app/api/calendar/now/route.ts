import { NextRequest, NextResponse } from "next/server";
import { getAllSeasonAnime, paginateLocally } from "@/lib/anilist/client";
import {
  upsertManyAnimeCache,
  getManyAnimeFromCache,
  getSeasonFromCache,
  upsertSeasonCache,
} from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { paginationSchema } from "@/lib/schemas";
import { getCurrentSeason } from "@/lib/utils/date";

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
    const parseResult = paginationSchema.safeParse({
      page: searchParams.get("page") || "1",
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { page } = parseResult.data;
    const { year, season } = getCurrentSeason();

    // Try to get from season cache first
    let allAnimeIds = await getSeasonFromCache(season, year);

    if (!allAnimeIds) {
      // Cache miss: fetch ALL anime from AniList for this season
      const allMedia = await getAllSeasonAnime(season, year);
      allAnimeIds = allMedia.map((m) => m.id);

      // Cache the season anime IDs and individual anime data (with slugs)
      if (allMedia.length > 0) {
        await Promise.all([
          upsertSeasonCache(season, year, allAnimeIds),
          upsertManyAnimeCache(allMedia),
        ]);
      }
    }

    // Paginate locally with reliable page info
    const { items: paginatedIds, pageInfo } = paginateLocally(allAnimeIds, page, PER_PAGE);

    // Always get from cache to ensure we have slugs
    const cachedAnime = await getManyAnimeFromCache(paginatedIds);
    const anime = paginatedIds.map((id) => cachedAnime.get(id)).filter((a) => a !== undefined);

    return NextResponse.json({
      anime,
      pagination: pageInfo,
      season,
      year,
    });
  } catch (error) {
    console.error("Calendar now error:", error);
    return NextResponse.json({ error: "Failed to fetch current season" }, { status: 500 });
  }
}
