import { getStreamingLinks } from "@/lib/aniwatch";
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

    // Get dub preference from query params
    const { searchParams } = new URL(request.url);
    const dub = searchParams.get("dub") === "true";

    // Use Redis cache for streaming links (shorter cache due to potential URL expiry)
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
