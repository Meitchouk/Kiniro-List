import { NextRequest, NextResponse } from "next/server";
import { getGlobalTrendingAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache, saveTrendingCache } from "@/lib/firestore/cache";
import { cron } from "@/lib/config";
import { logEvent } from "@/lib/logging";

/**
 * Cron endpoint for refreshing the trending anime cache from AniList.
 * This fetches the globally trending anime and caches them in Firestore.
 *
 * Runs twice daily (every 12 hours) to keep trending data fresh.
 *
 * Security: Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = cron.secret;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[cron/refresh-trending] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logEvent.cron("refresh-trending", "started");
    console.log("[cron/refresh-trending] Starting trending cache refresh...");

    // Fetch trending anime from AniList (top 50)
    const trendingMedia = await getGlobalTrendingAnime(50);

    if (!trendingMedia.length) {
      console.warn("[cron/refresh-trending] No trending anime returned from AniList");
      logEvent.cron("refresh-trending", "failed", Date.now() - startTime, {
        error: "No data from AniList",
      });
      return NextResponse.json({
        success: false,
        error: "No trending data from AniList",
      });
    }

    console.log(
      `[cron/refresh-trending] Fetched ${trendingMedia.length} trending anime from AniList`
    );

    // Cache the anime details in Firestore
    await upsertManyAnimeCache(trendingMedia);

    // Save the trending IDs list
    const trendingIds = trendingMedia.map((m) => m.id);
    await saveTrendingCache(trendingIds);

    const duration = Date.now() - startTime;
    logEvent.cron("refresh-trending", "completed", duration, { cached: trendingMedia.length });
    console.log("[cron/refresh-trending] Successfully updated trending cache");

    return NextResponse.json({
      success: true,
      cached: trendingMedia.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/refresh-trending] Error:", error);
    logEvent.cron("refresh-trending", "failed", Date.now() - startTime, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
