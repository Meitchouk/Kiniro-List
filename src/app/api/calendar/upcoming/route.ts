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
import { getNextSeason } from "@/lib/utils/date";
import type { AnimeCache, AniListMedia } from "@/lib/types";

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
    const { year, season } = getNextSeason();

    // Try to get from season cache first
    let allAnimeIds = await getSeasonFromCache(season, year);
    let allMedia: AniListMedia[] = [];

    if (!allAnimeIds) {
      // Cache miss: fetch ALL anime from AniList for this season
      allMedia = await getAllSeasonAnime(season, year);
      allAnimeIds = allMedia.map((m) => m.id);

      // Cache the season anime IDs and individual anime data
      if (allMedia.length > 0) {
        await Promise.all([
          upsertSeasonCache(season, year, allAnimeIds),
          upsertManyAnimeCache(allMedia),
        ]);
      }
    }

    // Paginate locally with reliable page info
    const { items: paginatedIds, pageInfo } = paginateLocally(allAnimeIds, page, PER_PAGE);

    // Get anime data from cache
    let anime: AnimeCache[];
    if (allMedia.length > 0) {
      // We just fetched from AniList, use that data
      const paginatedMedia = allMedia.filter((m) => paginatedIds.includes(m.id));
      anime = paginatedMedia.map((m) => ({
        id: m.id,
        title: m.title,
        coverImage: m.coverImage,
        bannerImage: m.bannerImage,
        description: m.description || null,
        genres: m.genres || [],
        season: m.season,
        seasonYear: m.seasonYear,
        status: m.status,
        episodes: m.episodes,
        format: m.format,
        isAdult: m.isAdult || false,
        siteUrl: m.siteUrl,
        updatedAt: new Date(),
        source: "anilist" as const,
      }));
    } else {
      // Get from cache
      const cachedAnime = await getManyAnimeFromCache(paginatedIds);
      anime = paginatedIds
        .map((id) => cachedAnime.get(id))
        .filter((a): a is AnimeCache => a !== undefined);
    }

    return NextResponse.json({
      anime,
      pagination: pageInfo,
      season,
      year,
    });
  } catch (error) {
    console.error("Calendar upcoming error:", error);
    return NextResponse.json({ error: "Failed to fetch upcoming season" }, { status: 500 });
  }
}
