import { NextRequest, NextResponse } from "next/server";
import { getReleasingAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache, getManyAnimeFromCache } from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getWeekday } from "@/lib/utils/date";
import type { WeeklyScheduleItem, AniListMedia } from "@/lib/types";

interface AiringMediaItem {
  media: AniListMedia;
  airingAt: number;
  episode: number;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "calendar");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Fetch multiple pages to get more anime
    const airingItems: AiringMediaItem[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 3) {
      const { media, pageInfo } = await getReleasingAnime(page, 50);

      // Cache anime metadata (this generates slugs)
      if (media.length > 0) {
        await upsertManyAnimeCache(media);
      }

      // Collect anime with airing info
      for (const m of media) {
        if (m.nextAiringEpisode) {
          airingItems.push({
            media: m,
            airingAt: m.nextAiringEpisode.airingAt,
            episode: m.nextAiringEpisode.episode,
          });
        }
      }

      hasMore = pageInfo.hasNextPage;
      page++;
    }

    // Get all anime from cache to get slugs
    const animeIds = airingItems.map((item) => item.media.id);
    const animeCache = await getManyAnimeFromCache(animeIds);

    // Build schedule items with slugs from cache
    const allMedia: WeeklyScheduleItem[] = [];
    for (const item of airingItems) {
      const cachedAnime = animeCache.get(item.media.id);
      if (cachedAnime) {
        allMedia.push({
          anime: cachedAnime,
          airingAt: item.airingAt,
          episode: item.episode,
          weekday: getWeekday(item.airingAt),
        });
      }
    }

    // Group by weekday
    const schedule: Record<number, WeeklyScheduleItem[]> = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
    };

    for (const item of allMedia) {
      schedule[item.weekday].push(item);
    }

    // Sort each day by airing time
    for (const day of Object.keys(schedule)) {
      schedule[Number(day)].sort((a, b) => a.airingAt - b.airingAt);
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Weekly schedule error:", error);
    return NextResponse.json({ error: "Failed to fetch weekly schedule" }, { status: 500 });
  }
}
