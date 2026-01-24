import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getBatchAiringSchedule } from "@/lib/anilist/client";
import { getManyAnimeFromCache } from "@/lib/firestore/cache";
import { sendDailyDigestEmail } from "@/lib/email/sender";
import { cron } from "@/lib/config";
import { DateTime } from "luxon";
import { logEvent } from "@/lib/logging";
import type { UserDocument, LibraryEntry, DigestAnimeItem } from "@/lib/types";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Cron endpoint for sending daily digest emails.
 * Runs every hour and sends emails to users whose digest hour matches current hour in their timezone.
 *
 * Security: Protected by CRON_SECRET environment variable.
 *
 * Query params:
 * - sendNow=true: Skip hour check and send to all eligible users immediately (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = cron.secret;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[cron/daily-digest] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for sendNow flag (for testing)
    const sendNow = request.nextUrl.searchParams.get("sendNow") === "true";

    const startTime = Date.now();
    logEvent.cron("daily-digest", "started", undefined, { sendNow });

    console.log(
      `[cron/daily-digest] Starting daily digest job...${sendNow ? " (sendNow mode)" : ""}`
    );

    const db = getAdminFirestore();
    const now = DateTime.now();

    // Get all users with daily digest enabled
    const usersSnapshot = await db
      .collection("users")
      .where("notifications.dailyDigest", "==", true)
      .get();

    if (usersSnapshot.empty) {
      console.log("[cron/daily-digest] No users with daily digest enabled");
      return NextResponse.json({ success: true, sent: 0, skipped: 0 });
    }

    console.log(`[cron/daily-digest] Found ${usersSnapshot.size} users with digest enabled`);

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data() as UserDocument & {
          createdAt: Timestamp;
          updatedAt: Timestamp;
        };

        // ============ User Validations ============

        // Skip if user document is missing UID
        if (!userData.uid) {
          console.log(`[cron/daily-digest] User document ${userDoc.id} has no UID, skipping`);
          skipped++;
          continue;
        }

        // Skip users without email
        if (!userData.email) {
          console.log(`[cron/daily-digest] User ${userData.uid} has no email, skipping`);
          skipped++;
          continue;
        }

        // Skip users with invalid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          console.log(
            `[cron/daily-digest] User ${userData.uid} has invalid email format, skipping`
          );
          skipped++;
          continue;
        }

        // Skip if notifications are explicitly disabled (double-check)
        if (userData.notifications?.dailyDigest === false) {
          console.log(`[cron/daily-digest] User ${userData.uid} has digest disabled, skipping`);
          skipped++;
          continue;
        }

        // ============ Timezone Validation ============

        const userTimezone = userData.timezone || "UTC";

        // Validate timezone is valid
        const userNow = now.setZone(userTimezone);
        if (!userNow.isValid) {
          console.log(
            `[cron/daily-digest] User ${userData.uid} has invalid timezone "${userTimezone}", using UTC`
          );
          // Fall back to UTC if timezone is invalid
          const utcNow = now.setZone("UTC");
          const utcHour = utcNow.hour;
          const digestHour = userData.notifications?.digestHour ?? 10;
          if (utcHour !== digestHour) {
            continue;
          }
        }

        const userHour = userNow.hour;
        const digestHour = userData.notifications?.digestHour ?? 10; // Default 10 AM

        // Validate digest hour is within valid range (0-23)
        if (digestHour < 0 || digestHour > 23) {
          console.log(
            `[cron/daily-digest] User ${userData.uid} has invalid digestHour ${digestHour}, skipping`
          );
          skipped++;
          continue;
        }

        // Skip hour check if sendNow flag is set
        if (!sendNow && userHour !== digestHour) {
          // Not time for this user's digest yet
          continue;
        }

        console.log(
          `[cron/daily-digest] Processing user ${userData.uid} (${userData.email}) at ${userHour}:00 ${userTimezone}${sendNow ? " (forced)" : ""}`
        );

        // ============ Library Validation ============

        // Get user's library (watching status only for daily digest)
        const librarySnapshot = await db
          .collection("users")
          .doc(userData.uid)
          .collection("library")
          .where("status", "==", "watching")
          .get();

        if (librarySnapshot.empty) {
          console.log(`[cron/daily-digest] User ${userData.uid} has no watching anime, skipping`);
          skipped++;
          continue;
        }

        const animeIds = librarySnapshot.docs
          .map((doc) => {
            const data = doc.data() as LibraryEntry;
            return data.animeId;
          })
          .filter((id) => typeof id === "number" && id > 0); // Filter out invalid IDs

        // Skip if no valid anime IDs after filtering
        if (animeIds.length === 0) {
          console.log(`[cron/daily-digest] User ${userData.uid} has no valid anime IDs, skipping`);
          skipped++;
          continue;
        }

        // Get today's start and end timestamps in user's timezone
        const todayStart = userNow.startOf("day");
        const todayEnd = todayStart.plus({ days: 1 });
        const startTimestamp = Math.floor(todayStart.toSeconds());
        const endTimestamp = Math.floor(todayEnd.toSeconds());

        // Fetch today's airing schedule from AniList
        const airingSchedule = await getBatchAiringSchedule(animeIds, startTimestamp, endTimestamp);

        // Collect all episodes for today
        const todayEpisodes: Array<{
          animeId: number;
          episode: number;
          airingAt: number;
        }> = [];

        for (const [animeId, episodes] of airingSchedule) {
          for (const ep of episodes) {
            // Filter to only today's episodes
            const epTime = DateTime.fromSeconds(ep.airingAt).setZone(userTimezone);
            if (epTime >= todayStart && epTime < todayEnd) {
              todayEpisodes.push({
                animeId,
                episode: ep.episode,
                airingAt: ep.airingAt,
              });
            }
          }
        }

        // Skip if no episodes today
        if (todayEpisodes.length === 0) {
          console.log(`[cron/daily-digest] User ${userData.uid} has no episodes today`);
          skipped++;
          continue;
        }

        // Get anime metadata from cache
        const uniqueAnimeIds = [...new Set(todayEpisodes.map((ep) => ep.animeId))];
        const animeCache = await getManyAnimeFromCache(uniqueAnimeIds);

        // Build digest items
        const digestItems: DigestAnimeItem[] = [];
        for (const ep of todayEpisodes) {
          const anime = animeCache.get(ep.animeId);
          if (!anime) continue;

          // Get best title (prefer English, then Romaji)
          const title =
            anime.title.english || anime.title.romaji || anime.title.native || "Unknown";

          // Format airing time in user's timezone (12-hour format)
          const airingTime = DateTime.fromSeconds(ep.airingAt)
            .setZone(userTimezone)
            .toFormat("h:mm a");

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

        // ============ Final Validation Before Sending ============

        // Skip if no digest items were built (all anime missing from cache)
        if (digestItems.length === 0) {
          console.log(
            `[cron/daily-digest] User ${userData.uid} has no valid digest items, skipping`
          );
          skipped++;
          continue;
        }

        // Validate locale
        const validLocales = ["en", "es"];
        const userLocale = validLocales.includes(userData.locale || "")
          ? (userData.locale as "en" | "es")
          : "en";

        // ============ Create In-App Notifications ============
        // Create a notification for each anime airing today
        const notificationsRef = db
          .collection("users")
          .doc(userData.uid)
          .collection("notifications");

        const notificationBatch = db.batch();
        for (const item of digestItems) {
          const notificationRef = notificationsRef.doc();
          const notificationTitle =
            userLocale === "es"
              ? `${item.title} - Episodio ${item.episode}`
              : `${item.title} - Episode ${item.episode}`;
          const notificationMessage =
            userLocale === "es"
              ? `Episodio ${item.episode} se emite hoy a las ${item.airingTime}`
              : `Episode ${item.episode} airs today at ${item.airingTime}`;

          notificationBatch.set(notificationRef, {
            type: "anime_airing",
            title: notificationTitle,
            message: notificationMessage,
            data: {
              animeSlug: item.slug,
              animeCover: item.coverUrl,
              episode: item.episode,
              airingTime: item.airingTime,
              crunchyrollUrl: item.crunchyrollUrl,
            },
            read: false,
            createdAt: new Date(),
          });
        }
        await notificationBatch.commit();

        console.log(
          `[cron/daily-digest] Created ${digestItems.length} notifications for user ${userData.uid}`
        );

        // Send email with DateTime object (template handles localization)
        const result = await sendDailyDigestEmail(userData.email, {
          displayName: userData.displayName || null,
          date: todayStart,
          episodes: digestItems,
          timezone: userTimezone,
          locale: userLocale,
        });

        if (result) {
          sent++;
          console.log(
            `[cron/daily-digest] Sent digest to ${userData.email} with ${digestItems.length} episodes`
          );
        } else {
          errors.push(`Failed to send to ${userData.email}`);
        }
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : "Unknown error";
        console.error(`[cron/daily-digest] Error processing user ${userDoc.id}:`, userError);
        errors.push(`User ${userDoc.id}: ${errorMsg}`);
      }
    }

    console.log(
      `[cron/daily-digest] Completed: sent=${sent}, skipped=${skipped}, errors=${errors.length}`
    );

    const duration = Date.now() - startTime;
    logEvent.cron("daily-digest", "completed", duration, {
      sent,
      skipped,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cron/daily-digest] Fatal error:", error);
    logEvent.cron("daily-digest", "failed", undefined, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to process daily digest" }, { status: 500 });
  }
}

// Disable body parsing for cron endpoint
export const dynamic = "force-dynamic";
