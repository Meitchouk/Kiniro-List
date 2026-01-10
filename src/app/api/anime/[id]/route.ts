import { NextRequest, NextResponse } from "next/server";
import { getAnimeById } from "@/lib/anilist/client";
import { 
  getAnimeFromCache, 
  upsertAnimeCache,
  getAiringFromCache,
  upsertAiringCache
} from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { animeIdSchema } from "@/lib/schemas";
import type { AnimeDetailResponse } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "animeDetail");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse params
    const { id } = await params;
    const parseResult = animeIdSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid anime ID" },
        { status: 400 }
      );
    }

    const animeId = parseResult.data.id;

    // Try cache first for basic info
    let anime = await getAnimeFromCache(animeId);

    // Fetch from AniList (always for detail view to get all fields)
    const media = await getAnimeById(animeId);
    
    if (!anime) {
      // Cache basic info for future list views (also generates slug)
      anime = await upsertAnimeCache(media);
    }

    // Update airing cache if available
    if (media.nextAiringEpisode) {
      await upsertAiringCache(
        animeId,
        media.nextAiringEpisode.airingAt,
        media.nextAiringEpisode.episode
      );
    }

    if (!anime) {
      return NextResponse.json(
        { error: "Anime not found" },
        { status: 404 }
      );
    }

    // Get airing info
    const airingInfo = await getAiringFromCache(animeId);

    // Build detailed response with all AniList fields
    const response: AnimeDetailResponse = {
      ...anime,
      // Additional detail fields from AniList
      startDate: media.startDate,
      endDate: media.endDate,
      duration: media.duration,
      averageScore: media.averageScore,
      meanScore: media.meanScore,
      popularity: media.popularity,
      favourites: media.favourites,
      sourceType: media.source,
      hashtag: media.hashtag,
      studios: media.studios,
      externalLinks: media.externalLinks,
      streamingEpisodes: media.streamingEpisodes,
      trailer: media.trailer,
      tags: media.tags,
      relations: media.relations,
      recommendations: media.recommendations,
      // Airing info
      nextAiringAt: airingInfo?.nextAiringAt?.toISOString() || null,
      nextEpisodeNumber: airingInfo?.nextEpisodeNumber || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Anime detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch anime details" },
      { status: 500 }
    );
  }
}
