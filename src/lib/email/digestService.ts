/**
 * Daily Digest Service
 * Centralized logic for building and sending daily digest emails.
 */

import { getAdminFirestore } from "@/lib/firebase/admin";
import { getBatchAiringSchedule, type AiredEpisodeInfo } from "@/lib/anilist/client";
import {
  getManyAnimeFromCache,
  getManyDailyAiringFromCache,
  upsertManyDailyAiringCache,
  type DailyAiringCacheEntry,
} from "@/lib/firestore/cache";
import { sendDailyDigestEmail } from "@/lib/email/sender";
import {
  generateDailyDigestHtml,
  generateDailyDigestText,
  generateDailyDigestSubject,
} from "@/lib/email/templates/dailyDigest";
import { DateTime } from "luxon";
import type { UserDocument, LibraryEntry, DigestAnimeItem } from "@/lib/types";
import type { DailyDigestEmailData } from "@/lib/email/templates/dailyDigest";

/**
 * Get airing schedule with Firebase caching layer.
 * First checks cache, only calls AniList for missing/expired entries.
 */
async function getAiringScheduleWithCache(
  animeIds: number[],
  dateKey: string, // YYYY-MM-DD format
  startTimestamp: number,
  endTimestamp: number
): Promise<Map<number, AiredEpisodeInfo[]>> {
  // Step 1: Check Firebase cache first
  const cachedData = await getManyDailyAiringFromCache(animeIds, dateKey);

  // Step 2: Identify which IDs need fresh data from AniList
  const missingIds: number[] = [];
  const result = new Map<number, AiredEpisodeInfo[]>();

  for (const animeId of animeIds) {
    const cached = cachedData.get(animeId);
    if (cached) {
      // Convert cache entries to AiredEpisodeInfo format
      const episodes: AiredEpisodeInfo[] = cached.map((entry) => ({
        mediaId: entry.animeId,
        episode: entry.episode,
        airingAt: entry.airingAt,
      }));
      result.set(animeId, episodes);
    } else {
      // Need to fetch from AniList
      missingIds.push(animeId);
    }
  }

  console.log(
    `[DigestService] Cache hit: ${animeIds.length - missingIds.length}/${animeIds.length}, fetching ${missingIds.length} from AniList`
  );

  // Step 3: If all IDs were in cache, return early
  if (missingIds.length === 0) {
    return result;
  }

  // Step 4: Fetch missing IDs from AniList
  const freshData = await getBatchAiringSchedule(missingIds, startTimestamp, endTimestamp);

  // Step 5: Prepare cache entries for upsert
  const cacheEntries = new Map<number, DailyAiringCacheEntry[]>();

  for (const animeId of missingIds) {
    const episodes = freshData.get(animeId) || [];
    result.set(animeId, episodes);

    // Convert to cache entry format
    const cacheEpisodes: DailyAiringCacheEntry[] = episodes.map((ep) => ({
      animeId,
      episode: ep.episode,
      airingAt: ep.airingAt,
    }));
    cacheEntries.set(animeId, cacheEpisodes);
  }

  // Step 6: Save to cache (fire-and-forget, don't block response)
  upsertManyDailyAiringCache(cacheEntries, dateKey).catch((err) => {
    console.error("[DigestService] Failed to update daily airing cache:", err);
  });

  return result;
}

export interface DigestResult {
  success: boolean;
  email: string;
  episodeCount: number;
  episodes: DigestAnimeItem[];
  subject: string;
  messageId?: string;
  error?: string;
  skippedReason?: string;
}

export interface BuildDigestOptions {
  email: string;
  targetDate?: DateTime; // Defaults to today in user's timezone
}

/**
 * Build digest data for a user by email.
 * Returns the digest data without sending.
 */
export async function buildDigestForUser(options: BuildDigestOptions): Promise<{
  success: boolean;
  data?: DailyDigestEmailData;
  episodes: DigestAnimeItem[];
  error?: string;
  skippedReason?: string;
  userData?: {
    displayName: string | null;
    timezone: string;
    locale: "en" | "es";
  };
}> {
  const { email, targetDate } = options;
  const db = getAdminFirestore();

  // Find user by email
  const usersSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();

  if (usersSnapshot.empty) {
    return {
      success: false,
      episodes: [],
      error: "User not found with this email",
    };
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data() as UserDocument;

  // Validate user has UID
  if (!userData.uid) {
    return {
      success: false,
      episodes: [],
      error: "User document has no UID",
    };
  }

  // Get user settings
  const userTimezone = userData.timezone || "UTC";
  const userLocale = (["en", "es"].includes(userData.locale || "") ? userData.locale : "en") as
    | "en"
    | "es";
  const displayName = userData.displayName || null;

  // Validate timezone
  const testDate = DateTime.now().setZone(userTimezone);
  const validTimezone = testDate.isValid ? userTimezone : "UTC";

  // Get current time in user's timezone
  const userNow = targetDate
    ? targetDate.setZone(validTimezone)
    : DateTime.now().setZone(validTimezone);
  const todayStart = userNow.startOf("day");
  const todayEnd = todayStart.plus({ days: 1 });
  const startTimestamp = Math.floor(todayStart.toSeconds());
  const endTimestamp = Math.floor(todayEnd.toSeconds());

  // Get user's library (watching status)
  const librarySnapshot = await db
    .collection("users")
    .doc(userData.uid)
    .collection("library")
    .where("status", "==", "watching")
    .get();

  if (librarySnapshot.empty) {
    return {
      success: true,
      episodes: [],
      skippedReason: "No anime in watching list",
      userData: { displayName, timezone: validTimezone, locale: userLocale },
    };
  }

  const animeIds = librarySnapshot.docs
    .map((doc) => {
      const data = doc.data() as LibraryEntry;
      return data.animeId;
    })
    .filter((id) => typeof id === "number" && id > 0);

  if (animeIds.length === 0) {
    return {
      success: true,
      episodes: [],
      skippedReason: "No valid anime IDs in library",
      userData: { displayName, timezone: validTimezone, locale: userLocale },
    };
  }

  // Generate date key for cache (YYYY-MM-DD in user's timezone)
  const dateKey = todayStart.toFormat("yyyy-MM-dd");

  // Fetch today's airing schedule with caching (Firebase first, then AniList)
  const airingSchedule = await getAiringScheduleWithCache(
    animeIds,
    dateKey,
    startTimestamp,
    endTimestamp
  );

  // Collect all episodes for today
  const todayEpisodes: Array<{
    animeId: number;
    episode: number;
    airingAt: number;
  }> = [];

  for (const [animeId, episodes] of airingSchedule) {
    for (const ep of episodes) {
      const epTime = DateTime.fromSeconds(ep.airingAt).setZone(validTimezone);
      if (epTime >= todayStart && epTime < todayEnd) {
        todayEpisodes.push({
          animeId,
          episode: ep.episode,
          airingAt: ep.airingAt,
        });
      }
    }
  }

  if (todayEpisodes.length === 0) {
    return {
      success: true,
      episodes: [],
      skippedReason: "No episodes airing today",
      userData: { displayName, timezone: validTimezone, locale: userLocale },
    };
  }

  // Get anime metadata from cache
  const uniqueAnimeIds = [...new Set(todayEpisodes.map((ep) => ep.animeId))];
  const animeCache = await getManyAnimeFromCache(uniqueAnimeIds);

  // Build digest items
  const digestItems: DigestAnimeItem[] = [];
  for (const ep of todayEpisodes) {
    const anime = animeCache.get(ep.animeId);
    if (!anime) continue;

    const title = anime.title.english || anime.title.romaji || anime.title.native || "Unknown";
    const airingTime = DateTime.fromSeconds(ep.airingAt).setZone(validTimezone).toFormat("h:mm a");

    // Find Crunchyroll URL from external links
    const crunchyrollLink = anime.externalLinks?.find(
      (link) => link.site.toLowerCase() === "crunchyroll"
    );

    digestItems.push({
      title,
      episode: ep.episode,
      airingTime,
      coverUrl: anime.coverImage.large || anime.coverImage.extraLarge || "",
      slug: anime.slug || String(anime.id),
      format: anime.format,
      crunchyrollUrl: crunchyrollLink?.url || null,
    });
  }

  // Sort by airing time
  digestItems.sort((a, b) => a.airingTime.localeCompare(b.airingTime));

  if (digestItems.length === 0) {
    return {
      success: true,
      episodes: [],
      skippedReason: "No valid digest items (anime not in cache)",
      userData: { displayName, timezone: validTimezone, locale: userLocale },
    };
  }

  const emailData: DailyDigestEmailData = {
    displayName,
    date: todayStart,
    episodes: digestItems,
    timezone: validTimezone,
    locale: userLocale,
  };

  return {
    success: true,
    data: emailData,
    episodes: digestItems,
    userData: { displayName, timezone: validTimezone, locale: userLocale },
  };
}

/**
 * Build and send digest for a user by email.
 */
export async function sendDigestForUser(email: string): Promise<DigestResult> {
  const buildResult = await buildDigestForUser({ email });

  if (!buildResult.success) {
    return {
      success: false,
      email,
      episodeCount: 0,
      episodes: [],
      subject: "",
      error: buildResult.error,
    };
  }

  if (buildResult.skippedReason || !buildResult.data) {
    return {
      success: true,
      email,
      episodeCount: 0,
      episodes: [],
      subject: "",
      skippedReason: buildResult.skippedReason,
    };
  }

  const { data, episodes } = buildResult;
  const subject = generateDailyDigestSubject(data);

  // Send the email
  const result = await sendDailyDigestEmail(email, data);

  if (result) {
    return {
      success: true,
      email,
      episodeCount: episodes.length,
      episodes,
      subject,
      messageId: result.messageId,
    };
  } else {
    return {
      success: false,
      email,
      episodeCount: episodes.length,
      episodes,
      subject,
      error: "Failed to send email",
    };
  }
}

/**
 * Get digest preview (HTML, text, subject) without sending.
 */
export async function getDigestPreview(email: string): Promise<{
  success: boolean;
  email: string;
  episodeCount: number;
  episodes: DigestAnimeItem[];
  subject?: string;
  html?: string;
  text?: string;
  error?: string;
  skippedReason?: string;
  userData?: {
    displayName: string | null;
    timezone: string;
    locale: "en" | "es";
  };
}> {
  const buildResult = await buildDigestForUser({ email });

  if (!buildResult.success) {
    return {
      success: false,
      email,
      episodeCount: 0,
      episodes: [],
      error: buildResult.error,
    };
  }

  if (buildResult.skippedReason || !buildResult.data) {
    return {
      success: true,
      email,
      episodeCount: 0,
      episodes: [],
      skippedReason: buildResult.skippedReason,
      userData: buildResult.userData,
    };
  }

  const { data, episodes, userData } = buildResult;

  return {
    success: true,
    email,
    episodeCount: episodes.length,
    episodes,
    subject: generateDailyDigestSubject(data),
    html: generateDailyDigestHtml(data),
    text: generateDailyDigestText(data),
    userData,
  };
}
