import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { AnimeCache, AnimeAiringCache, AniListMedia } from "@/lib/types";
import { sanitizeHtml } from "@/lib/utils/text";

const ANIME_CACHE_TTL_DAYS = 7;
const AIRING_CACHE_TTL_MINUTES = 60;

// ============ Anime Cache ============

export async function getAnimeFromCache(animeId: number): Promise<AnimeCache | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("anime").doc(String(animeId)).get();
  
  if (!doc.exists) {
    return null;
  }
  
  const data = doc.data() as AnimeCache & { updatedAt: Timestamp };
  
  // Check if stale
  const updatedAt = data.updatedAt.toDate();
  const now = new Date();
  const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDays > ANIME_CACHE_TTL_DAYS) {
    return null; // Stale, need to refresh
  }
  
  return {
    ...data,
    updatedAt: updatedAt,
  };
}

export async function upsertAnimeCache(media: AniListMedia): Promise<AnimeCache> {
  const db = getAdminFirestore();
  
  const animeData: Omit<AnimeCache, "updatedAt"> & { updatedAt: FieldValue } = {
    id: media.id,
    title: media.title,
    coverImage: media.coverImage,
    bannerImage: media.bannerImage,
    description: sanitizeHtml(media.description),
    genres: media.genres || [],
    season: media.season,
    seasonYear: media.seasonYear,
    status: media.status,
    episodes: media.episodes,
    format: media.format,
    isAdult: media.isAdult || false,
    siteUrl: media.siteUrl,
    source: "anilist",
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  await db.collection("anime").doc(String(media.id)).set(animeData, { merge: true });
  
  return {
    ...animeData,
    updatedAt: new Date(),
  } as AnimeCache;
}

export async function upsertManyAnimeCache(mediaList: AniListMedia[]): Promise<void> {
  const db = getAdminFirestore();
  const batch = db.batch();
  
  for (const media of mediaList) {
    const ref = db.collection("anime").doc(String(media.id));
    batch.set(ref, {
      id: media.id,
      title: media.title,
      coverImage: media.coverImage,
      bannerImage: media.bannerImage,
      description: sanitizeHtml(media.description),
      genres: media.genres || [],
      season: media.season,
      seasonYear: media.seasonYear,
      status: media.status,
      episodes: media.episodes,
      format: media.format,
      isAdult: media.isAdult || false,
      siteUrl: media.siteUrl,
      source: "anilist",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  
  await batch.commit();
}

// ============ Airing Cache ============

export async function getAiringFromCache(animeId: number): Promise<AnimeAiringCache | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("animeAiring").doc(String(animeId)).get();
  
  if (!doc.exists) {
    return null;
  }
  
  const data = doc.data() as AnimeAiringCache & { 
    lastFetchedAt: Timestamp;
    updatedAt: Timestamp;
    nextAiringAt?: Timestamp | null;
  };
  
  // Check if stale
  const lastFetchedAt = data.lastFetchedAt.toDate();
  const now = new Date();
  const diffMinutes = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60);
  
  if (diffMinutes > AIRING_CACHE_TTL_MINUTES) {
    return null; // Stale, need to refresh
  }
  
  return {
    animeId: data.animeId,
    nextAiringAt: data.nextAiringAt?.toDate() || null,
    nextEpisodeNumber: data.nextEpisodeNumber,
    lastFetchedAt: lastFetchedAt,
    updatedAt: data.updatedAt.toDate(),
  };
}

export async function upsertAiringCache(
  animeId: number,
  nextAiringAt: number | null,
  nextEpisodeNumber: number | null
): Promise<void> {
  const db = getAdminFirestore();
  
  await db.collection("animeAiring").doc(String(animeId)).set({
    animeId,
    nextAiringAt: nextAiringAt ? Timestamp.fromMillis(nextAiringAt * 1000) : null,
    nextEpisodeNumber,
    lastFetchedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function upsertManyAiringCache(
  airingData: Map<number, { airingAt: number; episode: number } | null>
): Promise<void> {
  const db = getAdminFirestore();
  const batch = db.batch();
  
  for (const [animeId, data] of airingData) {
    const ref = db.collection("animeAiring").doc(String(animeId));
    batch.set(ref, {
      animeId,
      nextAiringAt: data ? Timestamp.fromMillis(data.airingAt * 1000) : null,
      nextEpisodeNumber: data?.episode || null,
      lastFetchedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  
  await batch.commit();
}

// ============ Get many anime from cache ============

export async function getManyAnimeFromCache(animeIds: number[]): Promise<Map<number, AnimeCache>> {
  if (animeIds.length === 0) {
    return new Map();
  }
  
  const db = getAdminFirestore();
  const results = new Map<number, AnimeCache>();
  
  // Firestore has a limit of 30 for whereIn, so we batch
  const batches: number[][] = [];
  for (let i = 0; i < animeIds.length; i += 30) {
    batches.push(animeIds.slice(i, i + 30));
  }
  
  for (const batch of batches) {
    const refs = batch.map(id => db.collection("anime").doc(String(id)));
    const docs = await db.getAll(...refs);
    
    for (const doc of docs) {
      if (doc.exists) {
        const data = doc.data() as AnimeCache & { updatedAt: Timestamp };
        results.set(data.id, {
          ...data,
          updatedAt: data.updatedAt.toDate(),
        });
      }
    }
  }
  
  return results;
}

export async function getManyAiringFromCache(animeIds: number[]): Promise<Map<number, AnimeAiringCache>> {
  if (animeIds.length === 0) {
    return new Map();
  }
  
  const db = getAdminFirestore();
  const results = new Map<number, AnimeAiringCache>();
  const now = new Date();
  
  const refs = animeIds.map(id => db.collection("animeAiring").doc(String(id)));
  const docs = await db.getAll(...refs);
  
  for (const doc of docs) {
    if (doc.exists) {
      const data = doc.data() as AnimeAiringCache & { 
        lastFetchedAt: Timestamp;
        updatedAt: Timestamp;
        nextAiringAt?: Timestamp | null;
      };
      
      const lastFetchedAt = data.lastFetchedAt.toDate();
      const diffMinutes = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60);
      
      // Only return non-stale entries
      if (diffMinutes <= AIRING_CACHE_TTL_MINUTES) {
        results.set(data.animeId, {
          animeId: data.animeId,
          nextAiringAt: data.nextAiringAt?.toDate() || null,
          nextEpisodeNumber: data.nextEpisodeNumber,
          lastFetchedAt: lastFetchedAt,
          updatedAt: data.updatedAt.toDate(),
        });
      }
    }
  }
  
  return results;
}
