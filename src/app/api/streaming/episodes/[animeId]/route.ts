import { getEpisodes, findAnimeByTitle, type NormalizedEpisode } from "@/lib/aniwatch";
import { checkRateLimit, rateLimitResponse, getOrSetJSON } from "@/lib/redis";
import { animeIdSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// Define the provider result format for compatibility
interface ProviderEpisodesResult {
  provider: string;
  displayName: string;
  episodes: NormalizedEpisode[];
  totalEpisodes: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ animeId: string }> }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "streaming");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse params
    const { animeId } = await params;
    const parseResult = animeIdSchema.safeParse({ id: animeId });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
    }

    const id = parseResult.data.id;

    // Get dub preference and titles from query params
    const { searchParams } = new URL(request.url);
    const dub = searchParams.get("dub") === "true";
    const titleRomaji = searchParams.get("titleRomaji") || undefined;
    const titleEnglish = searchParams.get("titleEnglish") || undefined;
    const titleNative = searchParams.get("titleNative") || undefined;

    // Use Redis cache to avoid repeated API calls
    // Cache key includes title hash to differentiate requests with different titles
    // v3: improved season matching algorithm
    const titleHash = titleEnglish || titleRomaji || titleNative || "unknown";
    const cacheKey = `aniwatch:v3:episodes:${id}:${titleHash}:${dub ? "dub" : "sub"}`;

    const result = await getOrSetJSON<{
      availableProviders: ProviderEpisodesResult[];
      failedProviders: Array<{ provider: string; error: string }>;
    }>(
      cacheKey,
      600, // Cache for 10 minutes
      async () => {
        try {
          // Find the anime on HiAnime using titles (with improved season matching)
          const hiAnimeId = await findAnimeByTitle(titleRomaji, titleEnglish, titleNative);

          if (!hiAnimeId) {
            console.warn(`[Episodes API] Could not find HiAnime ID for AniList ${id}`);
            return {
              availableProviders: [],
              failedProviders: [{ provider: "hianime", error: "Anime not found on HiAnime" }],
            };
          }

          // Fetch episodes from HiAnime
          const episodesData = await getEpisodes(hiAnimeId);

          // Map to normalized format
          const episodes: NormalizedEpisode[] = episodesData.episodes.map((ep) => ({
            id: ep.episodeId,
            title: ep.title || null,
            number: ep.number,
            isFiller: ep.isFiller,
          }));

          return {
            availableProviders: [
              {
                provider: "hianime",
                displayName: "HiAnime",
                episodes,
                totalEpisodes: episodesData.totalEpisodes,
              },
            ],
            failedProviders: [],
          };
        } catch (error) {
          console.error(`[Episodes API] Error fetching from HiAnime:`, error);
          return {
            availableProviders: [],
            failedProviders: [
              {
                provider: "hianime",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            ],
          };
        }
      }
    );

    if (!result || result.availableProviders.length === 0) {
      return NextResponse.json(
        {
          error: "No episodes found from any provider",
          failedProviders: result?.failedProviders || [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      anilistId: id,
      availableProviders: result.availableProviders,
      failedProviders: result.failedProviders,
      dub,
    });
  } catch (error) {
    console.error("Episodes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
