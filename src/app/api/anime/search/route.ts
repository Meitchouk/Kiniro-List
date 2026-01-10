import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache } from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { searchQuerySchema } from "@/lib/schemas";
import type { AnimeCache } from "@/lib/types";

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

    // Search AniList
    const { media, pageInfo } = await searchAnime(q, page);

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
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search anime" },
      { status: 500 }
    );
  }
}
