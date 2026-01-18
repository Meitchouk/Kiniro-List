import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp, FieldValue, Firestore } from "firebase-admin/firestore";
import type { AnimeCache, AnimeAiringCache, AniListMedia, MediaTitle } from "@/lib/types";
import { sanitizeHtml, generateSlug, getLocalizedTitle } from "@/lib/utils/text";

const ANIME_CACHE_TTL_DAYS = 7;
const AIRING_CACHE_TTL_MINUTES = 60;

// ============ Slug Helpers ============

/**
 * Generate a unique slug for an anime.
 * If the slug already exists for a different anime, append a suffix.
 */
async function generateUniqueSlug(
  db: Firestore,
  animeId: number,
  title: MediaTitle
): Promise<string> {
  const displayTitle = getLocalizedTitle(title);
  let slug = generateSlug(displayTitle);

  if (!slug) {
    // Fallback to romaji if english produces empty slug
    slug = generateSlug(title.romaji);
  }

  if (!slug) {
    // Last resort: use ID
    return `anime-${animeId}`;
  }

  // Check if this anime already has a slug
  const existingDoc = await db.collection("anime").doc(String(animeId)).get();
  if (existingDoc.exists) {
    const existingSlug = existingDoc.data()?.slug;
    if (existingSlug) {
      return existingSlug; // Keep existing slug
    }
  }

  // Check if slug is already taken by another anime
  const slugQuery = await db.collection("anime").where("slug", "==", slug).limit(1).get();

  if (slugQuery.empty) {
    return slug; // Slug is available
  }

  // Slug is taken - try with romaji if we used english
  if (title.english && title.romaji !== title.english) {
    const romajiSlug = generateSlug(title.romaji);
    if (romajiSlug && romajiSlug !== slug) {
      const romajiQuery = await db
        .collection("anime")
        .where("slug", "==", romajiSlug)
        .limit(1)
        .get();
      if (romajiQuery.empty) {
        return romajiSlug;
      }
    }
  }

  // Add year suffix if available
  const animeDoc = await db.collection("anime").doc(String(animeId)).get();
  const year = animeDoc.data()?.seasonYear;
  if (year) {
    const yearSlug = `${slug}-${year}`;
    const yearQuery = await db.collection("anime").where("slug", "==", yearSlug).limit(1).get();
    if (yearQuery.empty) {
      return yearSlug;
    }
  }

  // Last resort: append anime ID
  return `${slug}-${animeId}`;
}

// ============ Anime Cache ============

/**
 * Get anime by slug
 */
export async function getAnimeBySlug(slug: string): Promise<AnimeCache | null> {
  const db = getAdminFirestore();
  const query = await db.collection("anime").where("slug", "==", slug).limit(1).get();

  if (query.empty) {
    return null;
  }

  const doc = query.docs[0];
  const data = doc.data() as AnimeCache & { updatedAt: Timestamp };

  return {
    ...data,
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

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

  // Extract streaming links from external links
  const streamingLinks =
    media.externalLinks
      ?.filter((link) => link.type === "STREAMING")
      .map((link) => ({ site: link.site, url: link.url, icon: link.icon })) || [];

  // Generate unique slug
  const slug = await generateUniqueSlug(db, media.id, media.title);

  const animeData: Omit<AnimeCache, "updatedAt"> & { updatedAt: FieldValue; slug: string } = {
    id: media.id,
    slug,
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
    streamingLinks,
    externalLinks: media.externalLinks || null,
    source: "anilist",
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("anime").doc(String(media.id)).set(animeData, { merge: true });

  return {
    ...animeData,
    slug,
    updatedAt: new Date(),
  } as AnimeCache;
}

export async function upsertManyAnimeCache(mediaList: AniListMedia[]): Promise<void> {
  const db = getAdminFirestore();

  // Generate slugs for all media first (need to do this before batch)
  const slugs = await Promise.all(
    mediaList.map((media) => generateUniqueSlug(db, media.id, media.title))
  );

  const batch = db.batch();

  for (let i = 0; i < mediaList.length; i++) {
    const media = mediaList[i];
    const slug = slugs[i];

    // Extract streaming links from external links
    const streamingLinks =
      media.externalLinks
        ?.filter((link) => link.type === "STREAMING")
        .map((link) => ({ site: link.site, url: link.url, icon: link.icon })) || [];

    const ref = db.collection("anime").doc(String(media.id));
    batch.set(
      ref,
      {
        id: media.id,
        slug,
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
        streamingLinks,
        externalLinks: media.externalLinks || null,
        source: "anilist",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
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
    lastAiringAt?: Timestamp | null;
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
    lastAiringAt: data.lastAiringAt?.toDate() || null,
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

  const existingDoc = await db.collection("animeAiring").doc(String(animeId)).get();
  const existingData = existingDoc.data() as
    | (AnimeAiringCache & { nextAiringAt?: Timestamp | null; lastAiringAt?: Timestamp | null })
    | undefined;

  const previousNextAiringMs = existingData?.nextAiringAt
    ? existingData.nextAiringAt.toMillis()
    : null;
  const previousLastAiringMs = existingData?.lastAiringAt
    ? existingData.lastAiringAt.toMillis()
    : null;

  let lastAiringAtTimestamp: Timestamp | null = previousLastAiringMs
    ? Timestamp.fromMillis(previousLastAiringMs)
    : null;

  if (previousNextAiringMs) {
    if (nextAiringAt && nextAiringAt * 1000 > previousNextAiringMs) {
      lastAiringAtTimestamp = Timestamp.fromMillis(previousNextAiringMs);
    } else if (!nextAiringAt) {
      lastAiringAtTimestamp = Timestamp.fromMillis(previousNextAiringMs);
    }
  }

  await db
    .collection("animeAiring")
    .doc(String(animeId))
    .set(
      {
        animeId,
        nextAiringAt: nextAiringAt ? Timestamp.fromMillis(nextAiringAt * 1000) : null,
        nextEpisodeNumber,
        lastAiringAt: lastAiringAtTimestamp,
        lastFetchedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function upsertManyAiringCache(
  airingData: Map<number, { airingAt: number; episode: number } | null>
): Promise<void> {
  const db = getAdminFirestore();
  const batch = db.batch();

  const animeIds = Array.from(airingData.keys());
  const refs = animeIds.map((id) => db.collection("animeAiring").doc(String(id)));
  const existingDocs = refs.length > 0 ? await db.getAll(...refs) : [];

  const existingMap = new Map<
    number,
    { nextAiringAtMs: number | null; lastAiringAtMs: number | null }
  >();

  existingDocs.forEach((doc) => {
    if (!doc.exists) return;
    const data = doc.data() as {
      nextAiringAt?: Timestamp | null;
      lastAiringAt?: Timestamp | null;
    };
    const nextAiringAtMs = data.nextAiringAt ? data.nextAiringAt.toMillis() : null;
    const lastAiringAtMs = data.lastAiringAt ? data.lastAiringAt.toMillis() : null;
    existingMap.set(Number(doc.id), { nextAiringAtMs, lastAiringAtMs });
  });

  for (const [animeId, data] of airingData) {
    const prev = existingMap.get(animeId);
    const previousNextAiringMs = prev?.nextAiringAtMs || null;
    const previousLastAiringMs = prev?.lastAiringAtMs || null;

    let lastAiringAtMs: number | null = previousLastAiringMs || null;

    if (previousNextAiringMs) {
      if (data?.airingAt && data.airingAt * 1000 > previousNextAiringMs) {
        lastAiringAtMs = previousNextAiringMs;
      } else if (!data?.airingAt) {
        lastAiringAtMs = previousNextAiringMs;
      }
    }

    const ref = db.collection("animeAiring").doc(String(animeId));
    batch.set(
      ref,
      {
        animeId,
        nextAiringAt: data ? Timestamp.fromMillis(data.airingAt * 1000) : null,
        nextEpisodeNumber: data?.episode || null,
        lastAiringAt: lastAiringAtMs ? Timestamp.fromMillis(lastAiringAtMs) : null,
        lastFetchedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
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
    const refs = batch.map((id) => db.collection("anime").doc(String(id)));
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

export async function getManyAiringFromCache(
  animeIds: number[]
): Promise<Map<number, AnimeAiringCache>> {
  if (animeIds.length === 0) {
    return new Map();
  }

  const db = getAdminFirestore();
  const results = new Map<number, AnimeAiringCache>();
  const now = new Date();

  const refs = animeIds.map((id) => db.collection("animeAiring").doc(String(id)));
  const docs = await db.getAll(...refs);

  for (const doc of docs) {
    if (doc.exists) {
      const data = doc.data() as AnimeAiringCache & {
        lastFetchedAt: Timestamp;
        updatedAt: Timestamp;
        nextAiringAt?: Timestamp | null;
        lastAiringAt?: Timestamp | null;
      };

      const lastFetchedAt = data.lastFetchedAt.toDate();
      const diffMinutes = (now.getTime() - lastFetchedAt.getTime()) / (1000 * 60);

      // Only return non-stale entries
      if (diffMinutes <= AIRING_CACHE_TTL_MINUTES) {
        results.set(data.animeId, {
          animeId: data.animeId,
          nextAiringAt: data.nextAiringAt?.toDate() || null,
          nextEpisodeNumber: data.nextEpisodeNumber,
          lastAiringAt: data.lastAiringAt?.toDate() || null,
          lastFetchedAt: lastFetchedAt,
          updatedAt: data.updatedAt.toDate(),
        });
      }
    }
  }

  return results;
}

// ============ Season Cache ============

const SEASON_CACHE_TTL_MINUTES = 30; // Cache season lists for 30 minutes

interface SeasonCacheData {
  season: string;
  year: number;
  animeIds: number[];
  updatedAt: Date;
}

/**
 * Get cached anime IDs for a season
 */
export async function getSeasonFromCache(season: string, year: number): Promise<number[] | null> {
  const db = getAdminFirestore();
  const docId = `${year}-${season}`;
  const doc = await db.collection("seasonCache").doc(docId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as SeasonCacheData & { updatedAt: Timestamp };
  const updatedAt = data.updatedAt.toDate();
  const now = new Date();
  const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

  if (diffMinutes > SEASON_CACHE_TTL_MINUTES) {
    return null; // Stale
  }

  return data.animeIds;
}

/**
 * Cache anime IDs for a season
 */
export async function upsertSeasonCache(
  season: string,
  year: number,
  animeIds: number[]
): Promise<void> {
  const db = getAdminFirestore();
  const docId = `${year}-${season}`;

  await db.collection("seasonCache").doc(docId).set({
    season,
    year,
    animeIds,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ============ Daily Airing Schedule Cache ============

const DAILY_AIRING_CACHE_TTL_MINUTES = 30; // Cache for 30 minutes

export interface DailyAiringCacheEntry {
  animeId: number;
  episode: number;
  airingAt: number;
}

interface DailyAiringCacheData {
  date: string; // YYYY-MM-DD
  animeId: number;
  episodes: DailyAiringCacheEntry[];
  updatedAt: Timestamp;
}

/**
 * Get cached airing schedule for a specific anime on a specific date.
 * Returns null if not cached or stale.
 */
export async function getDailyAiringFromCache(
  animeId: number,
  date: string // YYYY-MM-DD format
): Promise<DailyAiringCacheEntry[] | null> {
  const db = getAdminFirestore();
  const docId = `${animeId}-${date}`;
  const doc = await db.collection("dailyAiringCache").doc(docId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as DailyAiringCacheData;
  const updatedAt = data.updatedAt.toDate();
  const now = new Date();
  const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

  if (diffMinutes > DAILY_AIRING_CACHE_TTL_MINUTES) {
    return null; // Stale
  }

  return data.episodes;
}

/**
 * Get cached airing schedules for multiple anime on a specific date.
 * Returns a map of animeId -> episodes (or null if not cached/stale).
 */
export async function getManyDailyAiringFromCache(
  animeIds: number[],
  date: string // YYYY-MM-DD format
): Promise<Map<number, DailyAiringCacheEntry[] | null>> {
  if (animeIds.length === 0) {
    return new Map();
  }

  const db = getAdminFirestore();
  const results = new Map<number, DailyAiringCacheEntry[] | null>();

  // Initialize all as null
  for (const id of animeIds) {
    results.set(id, null);
  }

  // Firestore 'in' queries are limited to 30 items
  const batches: number[][] = [];
  for (let i = 0; i < animeIds.length; i += 30) {
    batches.push(animeIds.slice(i, i + 30));
  }

  const now = new Date();

  for (const batch of batches) {
    const docIds = batch.map((id) => `${id}-${date}`);

    // Get all docs in this batch
    const docs = await Promise.all(
      docIds.map((docId) => db.collection("dailyAiringCache").doc(docId).get())
    );

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const animeId = batch[i];

      if (!doc.exists) {
        continue;
      }

      const data = doc.data() as DailyAiringCacheData;
      const updatedAt = data.updatedAt.toDate();
      const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

      if (diffMinutes <= DAILY_AIRING_CACHE_TTL_MINUTES) {
        results.set(animeId, data.episodes);
      }
    }
  }

  return results;
}

/**
 * Cache airing schedule for an anime on a specific date.
 */
export async function upsertDailyAiringCache(
  animeId: number,
  date: string, // YYYY-MM-DD format
  episodes: DailyAiringCacheEntry[]
): Promise<void> {
  const db = getAdminFirestore();
  const docId = `${animeId}-${date}`;

  await db.collection("dailyAiringCache").doc(docId).set({
    date,
    animeId,
    episodes,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Batch cache airing schedules for multiple anime on a specific date.
 */
export async function upsertManyDailyAiringCache(
  entries: Map<number, DailyAiringCacheEntry[]>,
  date: string // YYYY-MM-DD format
): Promise<void> {
  if (entries.size === 0) {
    return;
  }

  const db = getAdminFirestore();
  const batch = db.batch();

  for (const [animeId, episodes] of entries) {
    const docId = `${animeId}-${date}`;
    const ref = db.collection("dailyAiringCache").doc(docId);
    batch.set(ref, {
      date,
      animeId,
      episodes,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}
