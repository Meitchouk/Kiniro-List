import { getEpisodes, findAnimeByTitle, type NormalizedEpisode } from "@/lib/aniwatch";
import {
  getAnimeEpisodesByTitles as getAnimeFLVEpisodes,
  type NormalizedAnimeFLVEpisode,
} from "@/lib/animeflv";
import { isHiAnimeAvailable } from "@/lib/streaming/hianime-health";
// import { getSupportedServers } from "@/lib/extractors";
import { checkRateLimit, rateLimitResponse, getOrSetJSON } from "@/lib/redis";
import { animeIdSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// Define the provider result format for compatibility
interface ProviderEpisodesResult {
  provider: string;
  displayName: string;
  episodes: NormalizedEpisode[];
  totalEpisodes: number;
  language?: string;
  hasDirectStream?: boolean;
}

// Define search hints from AniList metadata
interface SearchHints {
  format?: string;
  totalEpisodes?: number;
  year?: number;
}

// Fetch episodes from HiAnime provider
async function fetchHiAnimeEpisodes(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string,
  hints?: SearchHints
): Promise<ProviderEpisodesResult | null> {
  try {
    const hiAnimeId = await findAnimeByTitle(
      titleRomaji,
      titleEnglish,
      titleNative,
      undefined,
      hints
    );

    if (!hiAnimeId) {
      return null;
    }

    const episodesData = await getEpisodes(hiAnimeId);

    // Include provider in each episode so the client knows which API to use
    const episodes: NormalizedEpisode[] = episodesData.episodes.map((ep) => ({
      id: ep.episodeId,
      title: ep.title || null,
      number: ep.number,
      isFiller: ep.isFiller,
      provider: "hianime", // Tag each episode with its provider
    }));

    return {
      provider: "hianime",
      displayName: "HiAnime",
      episodes,
      totalEpisodes: episodesData.totalEpisodes,
      language: "en",
      hasDirectStream: true,
    };
  } catch (error) {
    console.error("[Episodes API] HiAnime fetch error:", error);
    return null;
  }
}

// Fetch episodes from AnimeFLV provider (Spanish)
async function fetchAnimeFLVEpisodes(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
): Promise<ProviderEpisodesResult | null> {
  try {
    const result = await getAnimeFLVEpisodes(titleRomaji, titleEnglish, titleNative);

    if (!result) {
      return null;
    }

    // Convert AnimeFLV episodes to normalized format
    // Include provider in each episode so the client knows which API to use
    const episodes: NormalizedEpisode[] = result.episodes.map((ep: NormalizedAnimeFLVEpisode) => ({
      id: ep.id,
      title: ep.title,
      number: ep.number,
      isFiller: false,
      provider: "animeflv", // Tag each episode with its provider
    }));

    return {
      provider: "animeflv",
      displayName: "AnimeFLV (ES)",
      episodes,
      totalEpisodes: episodes.length,
      language: "es",
      hasDirectStream: false, // AnimeFLV uses embed links
    };
  } catch (error) {
    console.error("[Episodes API] AnimeFLV fetch error:", error);
    return null;
  }
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

    // Additional search hints from AniList metadata
    const format = searchParams.get("format") || undefined;
    const totalEpisodes = searchParams.get("totalEpisodes")
      ? parseInt(searchParams.get("totalEpisodes")!, 10)
      : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const hints: SearchHints = { format, totalEpisodes, year };

    // Use Redis cache to avoid repeated API calls
    // Cache key includes title hash and hints to differentiate requests
    // v6: added CDN health check to filter unavailable providers
    const titleHash = titleEnglish || titleRomaji || titleNative || "unknown";
    const hintsHash = `${format || ""}-${totalEpisodes || ""}-${year || ""}`;
    
    // Check if HiAnime CDN is accessible from this server
    // This is cached for 10 minutes, so it's fast
    const hiAnimeAvailable = await isHiAnimeAvailable();
    
    // Include availability status in cache key so we re-fetch if status changes
    const availabilityKey = hiAnimeAvailable ? "hianime-ok" : "hianime-blocked";
    const cacheKey = `streaming:v6:episodes:${id}:${titleHash}:${hintsHash}:${availabilityKey}:${dub ? "dub" : "sub"}`;

    const result = await getOrSetJSON<{
      availableProviders: ProviderEpisodesResult[];
      failedProviders: Array<{ provider: string; error: string }>;
      hiAnimeBlocked?: boolean;
    }>(
      cacheKey,
      600, // Cache for 10 minutes
      async () => {
        const availableProviders: ProviderEpisodesResult[] = [];
        const failedProviders: Array<{ provider: string; error: string }> = [];

        // Only fetch HiAnime if CDN is accessible
        const fetchPromises: Promise<ProviderEpisodesResult | null>[] = [];
        
        if (hiAnimeAvailable) {
          fetchPromises.push(fetchHiAnimeEpisodes(titleRomaji, titleEnglish, titleNative, hints));
        } else {
          // Mark HiAnime as blocked without fetching
          failedProviders.push({ 
            provider: "hianime", 
            error: "CDN blocked from this server (403)" 
          });
        }
        
        // Always fetch AnimeFLV
        fetchPromises.push(fetchAnimeFLVEpisodes(titleRomaji, titleEnglish, titleNative));

        const results = await Promise.allSettled(fetchPromises);
        
        // Process results based on what we fetched
        let resultIndex = 0;
        
        // Process HiAnime result (if we fetched it)
        if (hiAnimeAvailable) {
          const hiAnimeResult = results[resultIndex++];
          if (hiAnimeResult.status === "fulfilled" && hiAnimeResult.value) {
            availableProviders.push(hiAnimeResult.value);
          } else {
            const errorMsg =
              hiAnimeResult.status === "rejected"
                ? hiAnimeResult.reason?.message || "Unknown error"
                : "Anime not found on HiAnime";
            failedProviders.push({ provider: "hianime", error: errorMsg });
          }
        }

        // Process AnimeFLV result
        const animeFLVResult = results[resultIndex];
        if (animeFLVResult.status === "fulfilled" && animeFLVResult.value) {
          availableProviders.push(animeFLVResult.value);

          // Also add AnimeFLV Ad-Free as a separate "experimental" provider
          // This uses video extraction to bypass embed ads
          const adFreeEpisodes: NormalizedEpisode[] = animeFLVResult.value.episodes.map((ep) => ({
            ...ep,
            provider: "animeflv-adfree", // Different provider tag for ad-free mode
          }));

          availableProviders.push({
            provider: "animeflv-adfree",
            displayName: "AnimeFLV Sin Anuncios ⚡",
            episodes: adFreeEpisodes,
            totalEpisodes: adFreeEpisodes.length,
            language: "es",
            hasDirectStream: true, // Ad-free extracts direct streams
          });
        } else {
          const errorMsg =
            animeFLVResult.status === "rejected"
              ? animeFLVResult.reason?.message || "Unknown error"
              : "Anime not found on AnimeFLV";
          failedProviders.push({ provider: "animeflv", error: errorMsg });
        }

        return { 
          availableProviders, 
          failedProviders,
          hiAnimeBlocked: !hiAnimeAvailable
        };
      }
    );

    if (!result || result.availableProviders.length === 0) {
      return NextResponse.json(
        {
          error: "No episodes found from any provider",
          failedProviders: result?.failedProviders || [],
          hiAnimeBlocked: result?.hiAnimeBlocked || false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      anilistId: id,
      availableProviders: result.availableProviders,
      failedProviders: result.failedProviders,
      hiAnimeBlocked: result.hiAnimeBlocked || false,
      dub,
    });
  } catch (error) {
    console.error("Episodes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
