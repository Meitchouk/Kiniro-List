import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import type { AiringHistoryEntry } from "@/lib/types";

const HISTORY_RETENTION_DAYS = 30;

/**
 * Get the document ID for an airing history entry
 */
function getHistoryDocId(animeId: number, episode: number): string {
  return `${animeId}_${episode}`;
}

/**
 * Add an aired episode to user's history
 */
export async function addAiringHistoryEntry(
  uid: string,
  animeId: number,
  episode: number,
  airingAt: Date
): Promise<void> {
  const db = getAdminFirestore();
  const docId = getHistoryDocId(animeId, episode);

  const expiresAt = DateTime.fromJSDate(airingAt).plus({ days: HISTORY_RETENTION_DAYS }).toJSDate();

  await db
    .collection("users")
    .doc(uid)
    .collection("airingHistory")
    .doc(docId)
    .set({
      animeId,
      episode,
      airingAt: Timestamp.fromDate(airingAt),
      detectedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
}

/**
 * Add multiple aired episodes to user's history
 */
export async function addManyAiringHistoryEntries(
  uid: string,
  entries: Array<{ animeId: number; episode: number; airingAt: Date }>
): Promise<void> {
  if (entries.length === 0) return;

  const db = getAdminFirestore();
  const batch = db.batch();

  for (const entry of entries) {
    const docId = getHistoryDocId(entry.animeId, entry.episode);
    const expiresAt = DateTime.fromJSDate(entry.airingAt)
      .plus({ days: HISTORY_RETENTION_DAYS })
      .toJSDate();

    const ref = db.collection("users").doc(uid).collection("airingHistory").doc(docId);
    batch.set(ref, {
      animeId: entry.animeId,
      episode: entry.episode,
      airingAt: Timestamp.fromDate(entry.airingAt),
      detectedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
  }

  await batch.commit();
}

/**
 * Get airing history for specific anime IDs (non-expired entries only)
 */
export async function getAiringHistoryForAnime(
  uid: string,
  animeIds: number[]
): Promise<Map<number, AiringHistoryEntry[]>> {
  if (animeIds.length === 0) return new Map();

  const db = getAdminFirestore();
  const now = new Date();

  const results = new Map<number, AiringHistoryEntry[]>();

  // Firestore "in" limit is 30, batch if needed
  // Query only by animeId and filter expiresAt in code to avoid composite index
  const batches: number[][] = [];
  for (let i = 0; i < animeIds.length; i += 30) {
    batches.push(animeIds.slice(i, i + 30));
  }

  const historyRef = db.collection("users").doc(uid).collection("airingHistory");

  for (const batch of batches) {
    const query = await historyRef.where("animeId", "in", batch).get();

    for (const doc of query.docs) {
      const data = doc.data() as {
        animeId: number;
        episode: number;
        airingAt: Timestamp;
        detectedAt: Timestamp;
        expiresAt: Timestamp;
      };

      // Filter expired entries in code
      if (data.expiresAt.toDate() <= now) continue;

      const entry: AiringHistoryEntry = {
        animeId: data.animeId,
        episode: data.episode,
        airingAt: data.airingAt.toDate(),
        detectedAt: data.detectedAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
      };

      const existing = results.get(data.animeId) || [];
      existing.push(entry);
      results.set(data.animeId, existing);
    }
  }

  return results;
}

/**
 * Check if an episode already exists in history
 */
export async function hasHistoryEntry(
  uid: string,
  animeId: number,
  episode: number
): Promise<boolean> {
  const db = getAdminFirestore();
  const docId = getHistoryDocId(animeId, episode);
  const doc = await db.collection("users").doc(uid).collection("airingHistory").doc(docId).get();
  return doc.exists;
}

/**
 * Clean up expired history entries for a user
 * Call this periodically or on user login
 */
export async function cleanupExpiredHistory(uid: string): Promise<number> {
  const db = getAdminFirestore();
  const now = Timestamp.now();

  const expiredDocs = await db
    .collection("users")
    .doc(uid)
    .collection("airingHistory")
    .where("expiresAt", "<=", now)
    .limit(500)
    .get();

  if (expiredDocs.empty) return 0;

  const batch = db.batch();
  expiredDocs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return expiredDocs.size;
}
