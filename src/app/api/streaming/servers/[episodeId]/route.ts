import { getEpisodeServers, type AniwatchServer } from "@/lib/aniwatch";
import { checkRateLimit, rateLimitResponse, getOrSetJSON } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const episodeIdSchema = z.object({
  episodeId: z.string().min(1).max(200),
});

// Normalized server format for API response
interface NormalizedServer {
  name: string;
  url: string;
}

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

    // Use Redis cache for servers
    const cacheKey = `aniwatch:servers:${id}:${dub ? "dub" : "sub"}`;
    const serversData = await getOrSetJSON(
      cacheKey,
      300, // Cache for 5 minutes
      () => getEpisodeServers(id)
    );

    if (!serversData) {
      return NextResponse.json({ error: "No servers found for this episode" }, { status: 404 });
    }

    // Get the appropriate server list based on dub preference
    const serverList = dub ? serversData.dub : serversData.sub;

    // Normalize server format
    const servers: NormalizedServer[] = serverList.map((server: AniwatchServer) => ({
      name: server.serverName,
      url: `server-${server.serverId}`, // URL is not directly used, serverId is what matters
    }));

    if (servers.length === 0) {
      return NextResponse.json({ error: "No servers found for this episode" }, { status: 404 });
    }

    return NextResponse.json({
      servers,
      raw: serversData, // Include raw data for debugging
    });
  } catch (error) {
    console.error("Servers fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch episode servers" }, { status: 500 });
  }
}
