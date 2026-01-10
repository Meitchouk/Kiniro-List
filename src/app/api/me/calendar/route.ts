import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { getBatchAiringInfo } from "@/lib/anilist/client";
import { 
  getManyAnimeFromCache, 
  getManyAiringFromCache,
  upsertManyAiringCache 
} from "@/lib/firestore/cache";
import { getAiringStatusLabel, getSecondsToAir } from "@/lib/utils/date";
import type { 
  UserDocument, 
  LibraryEntry, 
  CalendarAnimeItem,
  AnimeAiringCache 
} from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
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

    // Get library entries
    let libraryQuery = db.collection("users").doc(uid).collection("library");
    
    // Filter by watching if enabled
    if (userData.filters.onlyWatching) {
      libraryQuery = libraryQuery.where("status", "==", "watching") as typeof libraryQuery;
    }

    const librarySnapshot = await libraryQuery.get();

    if (librarySnapshot.empty) {
      return NextResponse.json({ items: [] });
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

    // Get anime metadata from cache
    const animeCache = await getManyAnimeFromCache(animeIds);

    // Get airing info from cache
    const airingCache = await getManyAiringFromCache(animeIds);

    // Find IDs that need fresh airing info
    const staleAiringIds = animeIds.filter((id) => {
      const anime = animeCache.get(id);
      // Only fetch for releasing anime
      return anime?.status === "RELEASING" && !airingCache.has(id);
    });

    // Batch fetch fresh airing info for stale entries
    if (staleAiringIds.length > 0) {
      const freshAiring = await getBatchAiringInfo(staleAiringIds);
      await upsertManyAiringCache(freshAiring);
      
      // Update local cache
      for (const [id, data] of freshAiring) {
        if (data) {
          const airingEntry: AnimeAiringCache = {
            animeId: id,
            nextAiringAt: new Date(data.airingAt * 1000),
            nextEpisodeNumber: data.episode,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          };
          airingCache.set(id, airingEntry);
        }
      }
    }

    // Build calendar items
    const items: CalendarAnimeItem[] = [];

    for (const entry of libraryEntries) {
      const anime = animeCache.get(entry.animeId);
      if (!anime) continue;

      // Filter adult content if enabled
      if (userData.filters.hideAdult && anime.isAdult) continue;

      const airing = airingCache.get(entry.animeId);
      const airingTimestamp = airing?.nextAiringAt
        ? Math.floor(airing.nextAiringAt.getTime() / 1000)
        : null;

      items.push({
        anime,
        libraryStatus: entry.status,
        nextAiringAt: airing?.nextAiringAt?.toISOString() || null,
        nextEpisodeNumber: airing?.nextEpisodeNumber || null,
        statusLabel: getAiringStatusLabel(airingTimestamp),
        secondsToAir: airingTimestamp ? getSecondsToAir(airingTimestamp) : undefined,
        pinned: entry.pinned,
      });
    }

    // Sort: pinned first, then by next airing time (ascending)
    items.sort((a, b) => {
      // Pinned items first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Then by airing time
      if (a.nextAiringAt && b.nextAiringAt) {
        return new Date(a.nextAiringAt).getTime() - new Date(b.nextAiringAt).getTime();
      }
      if (a.nextAiringAt) return -1;
      if (b.nextAiringAt) return 1;
      return 0;
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get calendar error:", error);
    return NextResponse.json({ error: "Failed to get calendar" }, { status: 500 });
  }
}
