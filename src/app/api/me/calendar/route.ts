import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  getBatchAiringInfo,
  getBatchAnimeInfo,
  getBatchAiringSchedule,
} from "@/lib/anilist/client";
import {
  getManyAnimeFromCache,
  getManyAiringFromCache,
  upsertManyAiringCache,
  upsertManyAnimeCache,
} from "@/lib/firestore/cache";
import {
  getAiringHistoryForAnime,
  addManyAiringHistoryEntries,
} from "@/lib/firestore/airingHistory";
import { DateTime } from "luxon";
import { withLogging } from "@/lib/logging";
import type {
  UserDocument,
  LibraryEntry,
  MyCalendarScheduleItem,
  MyCalendarResponse,
} from "@/lib/types";

export const GET = withLogging(
  async function GET(request: NextRequest) {
    try {
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const weekOffsetParam = searchParams.get("weekOffset");
      const weekOffset = weekOffsetParam ? parseInt(weekOffsetParam, 10) : 0;

      // Validate weekOffset (limit to reasonable range, e.g., -4 to 0 for past month)
      const clampedWeekOffset = Math.max(-4, Math.min(0, isNaN(weekOffset) ? 0 : weekOffset));

      // Authenticate
      let authResult;
      try {
        authResult = await requireAuth(request);
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        throw error;
      }

      const { uid } = authResult;

      // Rate limit check
      const rateLimitResult = await checkRateLimit(request, "user", uid);
      if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult);
      }

      const db = getAdminFirestore();

      // Get user preferences
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userData = userDoc.data() as UserDocument & {
        createdAt: Timestamp;
        updatedAt: Timestamp;
      };

      const timezone = userData.timezone || "UTC";
      const filters = userData.filters || { hideAdult: true, onlyWatching: true };

      // Get library entries
      let libraryQuery = db.collection("users").doc(uid).collection("library");

      // Filter by watching if enabled
      if (userData.filters.onlyWatching) {
        libraryQuery = libraryQuery.where("status", "==", "watching") as typeof libraryQuery;
      }

      const librarySnapshot = await libraryQuery.get();

      if (librarySnapshot.empty) {
        return NextResponse.json({ schedule: {}, timezone, filters } as MyCalendarResponse);
      }

      // Get library entries
      const libraryEntries = librarySnapshot.docs.map((doc) => {
        const data = doc.data() as LibraryEntry & {
          addedAt: Timestamp;
          updatedAt: Timestamp;
        };
        return {
          animeId: data.animeId,
          status: data.status,
          pinned: data.pinned,
          notes: data.notes,
          addedAt: data.addedAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });

      const animeIds = libraryEntries.map((e) => e.animeId);
      const libraryMap = new Map(libraryEntries.map((e) => [e.animeId, e]));

      // Get anime metadata from cache
      const animeCache = await getManyAnimeFromCache(animeIds);

      // Find anime that are missing from cache, don't have status info, or don't have streamingLinks
      const missingOrStaleIds = animeIds.filter((id) => {
        const anime = animeCache.get(id);
        return (
          !anime ||
          anime.status === undefined ||
          anime.status === null ||
          anime.streamingLinks === undefined
        );
      });

      // Fetch missing anime from AniList and update cache
      if (missingOrStaleIds.length > 0) {
        const freshAnime = await getBatchAnimeInfo(missingOrStaleIds);
        if (freshAnime.length > 0) {
          await upsertManyAnimeCache(freshAnime);

          // Re-fetch from cache to get complete data with slugs
          const refreshedCache = await getManyAnimeFromCache(missingOrStaleIds);
          for (const [id, anime] of refreshedCache) {
            animeCache.set(id, anime);
          }
        }
      }

      // Filter to only anime that are RELEASING (currently airing)
      const releasingAnimeIds = animeIds.filter((id) => {
        const anime = animeCache.get(id);
        return anime?.status === "RELEASING";
      });

      // If no releasing anime, return empty calendar
      if (releasingAnimeIds.length === 0) {
        return NextResponse.json({ schedule: {}, timezone, filters } as MyCalendarResponse);
      }

      // Get current airing info from cache
      const airingCache = await getManyAiringFromCache(releasingAnimeIds);

      // Store previous airing info before fetching fresh data (for change detection)
      const previousAiringMap = new Map<
        number,
        { nextAiringAt: number | null; episode: number | null }
      >();
      for (const [id, airing] of airingCache) {
        previousAiringMap.set(id, {
          nextAiringAt: airing.nextAiringAt
            ? Math.floor(airing.nextAiringAt.getTime() / 1000)
            : null,
          episode: airing.nextEpisodeNumber || null,
        });
      }

      // Find IDs that need fresh airing info (not in cache or stale)
      const staleAiringIds = releasingAnimeIds.filter((id) => !airingCache.has(id));

      // Batch fetch fresh airing info for stale entries
      if (staleAiringIds.length > 0) {
        const freshAiring = await getBatchAiringInfo(staleAiringIds);
        await upsertManyAiringCache(freshAiring);

        // Re-fetch updated airing data for stale IDs
        const refreshedAiring = await getManyAiringFromCache(staleAiringIds);
        for (const [id, entry] of refreshedAiring) {
          airingCache.set(id, entry);
        }
      }

      // Detect aired episodes by comparing previous vs current nextAiringAt
      const airedEpisodesToRecord: Array<{ animeId: number; episode: number; airingAt: Date }> = [];

      for (const [animeId, currentAiring] of airingCache) {
        const prev = previousAiringMap.get(animeId);
        if (!prev || !prev.nextAiringAt || !prev.episode) continue;

        const currentNextAiringAt = currentAiring.nextAiringAt
          ? Math.floor(currentAiring.nextAiringAt.getTime() / 1000)
          : null;

        // If nextAiringAt changed (moved forward), the previous episode aired
        if (currentNextAiringAt && currentNextAiringAt > prev.nextAiringAt) {
          airedEpisodesToRecord.push({
            animeId,
            episode: prev.episode,
            airingAt: new Date(prev.nextAiringAt * 1000),
          });
        }
      }

      // Record newly detected aired episodes
      if (airedEpisodesToRecord.length > 0) {
        await addManyAiringHistoryEntries(uid, airedEpisodesToRecord);
      }

      // Build weekly schedule with offset support
      const now = DateTime.now().setZone(timezone);
      // Calculate week start (Sunday-based) with offset
      // If today is Sunday, week starts today; otherwise, go back to previous Sunday
      const currentWeekStart =
        now.weekday === 7
          ? now.startOf("day") // Today is Sunday, start here
          : now.startOf("week").minus({ days: 1 }); // Go to previous Sunday
      const startOfWeek = currentWeekStart.plus({ weeks: clampedWeekOffset });
      const endOfWeek = startOfWeek.plus({ days: 7 });

      // Fetch past aired episodes from AniList for the selected week
      // This ensures we show episodes even if they weren't detected through the change detection
      const weekStartTimestamp = Math.floor(startOfWeek.toSeconds());
      const weekEndTimestamp = Math.floor(endOfWeek.toSeconds());
      const nowTimestamp = Math.floor(now.toSeconds());

      // Only fetch from AniList if we're looking at past episodes
      let anilistAiringSchedule = new Map<
        number,
        Array<{ mediaId: number; episode: number; airingAt: number }>
      >();
      if (weekStartTimestamp < nowTimestamp) {
        anilistAiringSchedule = await getBatchAiringSchedule(
          releasingAnimeIds,
          weekStartTimestamp,
          Math.min(weekEndTimestamp, nowTimestamp) // Don't fetch future episodes from this query
        );
      }

      // Also get stored airing history as a fallback
      const airingHistory = await getAiringHistoryForAnime(uid, releasingAnimeIds);

      const schedule: Record<number, MyCalendarScheduleItem[]> = {
        0: [], // Sunday
        1: [], // Monday
        2: [], // Tuesday
        3: [], // Wednesday
        4: [], // Thursday
        5: [], // Friday
        6: [], // Saturday
      };

      // Process each releasing anime
      for (const animeId of releasingAnimeIds) {
        const anime = animeCache.get(animeId);
        if (!anime) continue;

        // Filter adult content if enabled
        if (userData.filters.hideAdult && anime.isAdult) continue;

        const library = libraryMap.get(animeId);
        if (!library) continue;

        const airing = airingCache.get(animeId);
        const history = airingHistory.get(animeId) || [];
        const anilistSchedule = anilistAiringSchedule.get(animeId) || [];

        // Track added episodes to avoid duplicates
        const addedEpisodes = new Set<string>();

        // Add future episode (from nextAiringAt)
        if (airing?.nextAiringAt) {
          const airingTimestamp = Math.floor(airing.nextAiringAt.getTime() / 1000);
          const airingDt = DateTime.fromSeconds(airingTimestamp).setZone(timezone);

          // Include if within this week
          if (airingDt >= startOfWeek && airingDt < endOfWeek) {
            const weekday = airingDt.weekday % 7; // Convert to 0-6 (Sunday-Saturday)

            // Check if the airing time has already passed
            const hasAired = airingDt < now;
            const episodeKey = `${animeId}-${airing.nextEpisodeNumber || 1}`;

            if (!addedEpisodes.has(episodeKey)) {
              addedEpisodes.add(episodeKey);
              schedule[weekday].push({
                anime,
                airingAt: airingTimestamp,
                episode: airing.nextEpisodeNumber || 1,
                weekday,
                libraryStatus: library.status,
                isAired: hasAired,
                pinned: library.pinned,
              });
            }
          }
        }

        // Add past episodes from AniList airing schedule (primary source for past episodes)
        for (const entry of anilistSchedule) {
          const airingDt = DateTime.fromSeconds(entry.airingAt).setZone(timezone);

          if (airingDt >= startOfWeek && airingDt < endOfWeek) {
            const weekday = airingDt.weekday % 7;
            const episodeKey = `${animeId}-${entry.episode}`;

            if (!addedEpisodes.has(episodeKey)) {
              addedEpisodes.add(episodeKey);
              schedule[weekday].push({
                anime,
                airingAt: entry.airingAt,
                episode: entry.episode,
                weekday,
                libraryStatus: library.status,
                isAired: true,
                pinned: library.pinned,
              });
            }
          }
        }

        // Add past episodes from stored history (fallback for any missing data)
        for (const entry of history) {
          const airingTimestamp = Math.floor(entry.airingAt.getTime() / 1000);
          const airingDt = DateTime.fromSeconds(airingTimestamp).setZone(timezone);

          if (airingDt >= startOfWeek && airingDt < endOfWeek) {
            const weekday = airingDt.weekday % 7;
            const episodeKey = `${animeId}-${entry.episode}`;

            if (!addedEpisodes.has(episodeKey)) {
              addedEpisodes.add(episodeKey);
              schedule[weekday].push({
                anime,
                airingAt: airingTimestamp,
                episode: entry.episode,
                weekday,
                libraryStatus: library.status,
                isAired: true,
                pinned: library.pinned,
              });
            }
          }
        }
      }

      // Sort each day: pinned first, then by air time
      for (const day of Object.keys(schedule)) {
        schedule[Number(day)].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.airingAt - b.airingAt;
        });
      }

      return NextResponse.json({ schedule, timezone, filters } as MyCalendarResponse);
    } catch (error) {
      console.error("Get calendar error:", error);
      return NextResponse.json({ error: "Failed to get calendar" }, { status: 500 });
    }
  },
  { context: "user:calendar" }
);
