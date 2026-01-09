import { NextRequest, NextResponse } from "next/server";
import { getSeasonAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache } from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { seasonQuerySchema } from "@/lib/schemas";
import type { AnimeCache } from "@/lib/types";

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

    // Fetch from AniList
    const { media, pageInfo } = await getSeasonAnime(season, year, page);

    // Cache anime metadata
    if (media.length > 0) {
      await upsertManyAnimeCache(media);
    }

    // Transform to response format
    const anime: AnimeCache[] = media.map((m) => ({
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

    return NextResponse.json({
      anime,
      pagination: pageInfo,
      season,
      year,
    });
  } catch (error) {
    console.error("Calendar season error:", error);
    return NextResponse.json(
      { error: "Failed to fetch season" },
      { status: 500 }
    );
  }
}
