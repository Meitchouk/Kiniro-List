/**
 * Migration script to add notification settings to existing users.
 * Run this script once to enable daily digest for all existing users.
 *
 * Run with: npx tsx scripts/migrate-notifications.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import * as path from "path";

// Initialize Firebase Admin
function initFirebase(): Firestore {
  if (getApps().length === 0) {
    const serviceAccountPath = path.join(
      process.cwd(),
      "firebase",
      "kiniro-list-firebase-adminsdk-fbsvc-a334e98fda.json"
    );

    initializeApp({
      credential: cert(serviceAccountPath),
    });
  }

  return getFirestore();
}

async function migrateNotificationSettings() {
  const db = initFirebase();

  console.log("Fetching all users...");
  const usersSnapshot = await db.collection("users").get();

  if (usersSnapshot.empty) {
    console.log("No users found in the database.");
    return;
  }

  console.log(`Found ${usersSnapshot.size} users to check.`);

  const batch = db.batch();
  let updateCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();

    // Skip if user already has notification settings
    if (userData.notifications?.dailyDigest !== undefined) {
      console.log(`User ${userDoc.id} already has notification settings, skipping.`);
      continue;
    }

    // Add default notification settings
    batch.update(userDoc.ref, {
      notifications: {
        dailyDigest: true,
        digestHour: 10, // 10 AM in user's timezone
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    updateCount++;
    console.log(`Queued update for user: ${userDoc.id} (${userData.email || "no email"})`);
  }

  if (updateCount === 0) {
    console.log("No users need to be updated.");
    return;
  }

  console.log(`Committing ${updateCount} updates...`);
  await batch.commit();

  console.log(`Successfully updated ${updateCount} users with notification settings.`);
}

// Run the migration
migrateNotificationSettings()
  .then(() => {
    console.log("Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
