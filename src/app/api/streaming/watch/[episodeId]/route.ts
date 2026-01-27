import { getStreamingLinks } from "@/lib/aniwatch";
import { getStreamingLinks as getAnimeFLVLinks } from "@/lib/animeflv";
import { extractVideo, canExtract } from "@/lib/extractors";
import { checkRateLimit, rateLimitResponse, getOrSetJSON } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const episodeIdSchema = z.object({
  episodeId: z.string().min(1).max(200),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "streaming");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse params
    const { episodeId } = await params;
    const parseResult = episodeIdSchema.safeParse({ episodeId });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });
    }

    const id = parseResult.data.episodeId;

    // Get provider and dub preference from query params
    const { searchParams } = new URL(request.url);
    const dub = searchParams.get("dub") === "true";

    // Auto-detect provider from episode ID format if not explicitly provided
    // HiAnime IDs contain "?ep=" (e.g., "spy-x-family-17977?ep=95653")
    // AnimeFLV IDs are simple slugs with episode number (e.g., "seihantai-na-kimi-to-boku-1")
    let provider = searchParams.get("provider");
    if (!provider) {
      // Auto-detect: HiAnime IDs contain "?ep=" in the format
      provider = id.includes("?ep=") ? "hianime" : "animeflv";
      console.log(`[Watch API] Auto-detected provider: ${provider} for episode ID: ${id}`);
    }

    // Handle AnimeFLV Ad-Free provider (extracts direct video URLs)
    if (provider === "animeflv-adfree") {
      const cacheKey = `animeflv:watch:${id}`;
      const animeFLVLinks = await getOrSetJSON(cacheKey, 300, () => getAnimeFLVLinks(id));

      if (!animeFLVLinks || !animeFLVLinks.servers || animeFLVLinks.servers.length === 0) {
        return NextResponse.json(
          { error: "No streaming servers found for this episode" },
          { status: 404 }
        );
      }

      // Try to extract direct video URLs from embed servers
      const embedServers = animeFLVLinks.servers.filter(
        (s: { type: string }) => s.type === "embed"
      );

      for (const server of embedServers) {
        if (canExtract(server.url)) {
          console.log(`[Watch API] Ad-free: extracting from ${server.name}: ${server.url}`);

          const extractionCacheKey = `extract:${Buffer.from(server.url).toString("base64").slice(0, 50)}`;
          const extraction = await getOrSetJSON(extractionCacheKey, 600, () =>
            extractVideo(server.url)
          );

          if (extraction?.success && extraction.videos && extraction.videos.length > 0) {
            console.log(`[Watch API] Successfully extracted direct URL from ${server.name}`);

            return NextResponse.json({
              provider: "animeflv-adfree",
              type: "direct",
              extractedFrom: server.name,
              sources: extraction.videos.map(
                (v: { url: string; quality?: string; isM3U8?: boolean }) => ({
                  url: v.url,
                  quality: v.quality || "auto",
                  isM3U8: v.isM3U8 || false,
                })
              ),
              headers: extraction.videos[0]?.headers,
              episodeNumber: animeFLVLinks.episodeNumber,
              animeTitle: animeFLVLinks.animeTitle,
            });
          } else {
            console.log(`[Watch API] Extraction failed for ${server.name}: ${extraction?.error}`);
          }
        }
      }

      // If extraction failed, return error (don't fallback to embed for ad-free provider)
      return NextResponse.json(
        { error: "Ad-free extraction failed. Try the regular AnimeFLV provider." },
        { status: 503 }
      );
    }

    // Handle regular AnimeFLV provider (embeds with ads)
    if (provider === "animeflv") {
      const cacheKey = `animeflv:watch:${id}`;
      const animeFLVLinks = await getOrSetJSON(
        cacheKey,
        300, // Cache for 5 minutes (embed URLs are more stable)
        () => getAnimeFLVLinks(id)
      );

      if (!animeFLVLinks || !animeFLVLinks.servers || animeFLVLinks.servers.length === 0) {
        return NextResponse.json(
          { error: "No streaming servers found for this episode on AnimeFLV" },
          { status: 404 }
        );
      }

      // Return embed links (with ads)
      return NextResponse.json({
        provider: "animeflv",
        type: "embed",
        servers: animeFLVLinks.servers,
        episodeNumber: animeFLVLinks.episodeNumber,
        animeTitle: animeFLVLinks.animeTitle,
      });
    }

    // Default: HiAnime provider (direct streaming)
    const cacheKey = `aniwatch:watch:${id}:${dub ? "dub" : "sub"}`;
    const streamingLinks = await getOrSetJSON(
      cacheKey,
      120, // Cache for 2 minutes only (streaming URLs may expire)
      () => getStreamingLinks(id, dub)
    );

    if (!streamingLinks || !streamingLinks.sources || streamingLinks.sources.length === 0) {
      return NextResponse.json(
        { error: "No streaming sources found for this episode" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      provider: "hianime",
      type: "direct", // Indicates these are direct M3U8 streams
      sources: streamingLinks.sources,
      subtitles: streamingLinks.subtitles || [],
      intro: streamingLinks.intro,
      outro: streamingLinks.outro,
      headers: streamingLinks.headers,
    });
  } catch (error) {
    console.error("Watch fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch streaming links" }, { status: 500 });
  }
}
