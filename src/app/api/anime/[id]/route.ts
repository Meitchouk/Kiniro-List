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

    // Try cache first
    let anime = await getAnimeFromCache(animeId);
    let needsFetch = !anime;

    if (needsFetch) {
      // Fetch from AniList
      const media = await getAnimeById(animeId);
      anime = await upsertAnimeCache(media);

      // Update airing cache if available
      if (media.nextAiringEpisode) {
        await upsertAiringCache(
          animeId,
          media.nextAiringEpisode.airingAt,
          media.nextAiringEpisode.episode
        );
      }
    }

    if (!anime) {
      return NextResponse.json(
        { error: "Anime not found" },
        { status: 404 }
      );
    }

    // Get airing info
    let airingInfo = await getAiringFromCache(animeId);
    
    // If airing cache is stale or missing for releasing anime, fetch it
    if (!airingInfo && anime.status === "RELEASING") {
      const media = await getAnimeById(animeId);
      if (media.nextAiringEpisode) {
        await upsertAiringCache(
          animeId,
          media.nextAiringEpisode.airingAt,
          media.nextAiringEpisode.episode
        );
        airingInfo = {
          animeId,
          nextAiringAt: new Date(media.nextAiringEpisode.airingAt * 1000),
          nextEpisodeNumber: media.nextAiringEpisode.episode,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }

    const response: AnimeDetailResponse = {
      ...anime,
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
