/**
 * Script to set a user as admin by email
 * Run: npx ts-node --project tsconfig.json scripts/set-admin.ts admin@kinirolist.app
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

async function setAdmin(email: string) {
  // Initialize Firebase Admin
  if (!getApps().length) {
    const serviceAccountPath = path.join(
      process.cwd(),
      "firebase",
      "kiniro-list-firebase-adminsdk-fbsvc-a334e98fda.json"
    );

    if (!fs.existsSync(serviceAccountPath)) {
      console.error("❌ Service account file not found at:", serviceAccountPath);
      process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    // Find user by email
    console.log(`🔍 Looking for user with email: ${email}`);
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid} (${userRecord.displayName || "No name"})`);

    // Update Firestore user document
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error("❌ User document not found in Firestore");
      process.exit(1);
    }

    await userRef.update({
      isAdmin: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ User ${email} is now an admin!`);
    console.log(`\n📋 User details:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName || "Not set"}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    console.log(`\n🔗 Admin dashboard: /admin/feedback`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("Usage: npx ts-node scripts/set-admin.ts <email>");
  console.error("Example: npx ts-node scripts/set-admin.ts admin@kinirolist.app");
  process.exit(1);
}

setAdmin(email).then(() => process.exit(0));
