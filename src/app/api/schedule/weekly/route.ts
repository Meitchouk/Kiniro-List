import { NextRequest, NextResponse } from "next/server";
import { getReleasingAnime } from "@/lib/anilist/client";
import { upsertManyAnimeCache } from "@/lib/firestore/cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getWeekday } from "@/lib/utils/date";
import type { AnimeCache, WeeklyScheduleItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "calendar");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Fetch multiple pages to get more anime
    const allMedia: WeeklyScheduleItem[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 3) {
      const { media, pageInfo } = await getReleasingAnime(page, 50);

      // Cache anime metadata
      if (media.length > 0) {
        await upsertManyAnimeCache(media);
      }

      // Add anime with airing info
      for (const m of media) {
        if (m.nextAiringEpisode) {
          const animeCache: AnimeCache = {
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
          };

          allMedia.push({
            anime: animeCache,
            airingAt: m.nextAiringEpisode.airingAt,
            episode: m.nextAiringEpisode.episode,
            weekday: getWeekday(m.nextAiringEpisode.airingAt),
          });
        }
      }

      hasMore = pageInfo.hasNextPage;
      page++;
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
