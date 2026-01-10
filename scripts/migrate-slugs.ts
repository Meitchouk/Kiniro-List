/**
 * Migration script to add slugs to all existing anime documents in Firestore
 * 
 * Run with: npx tsx scripts/migrate-slugs.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
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

// Slug generation utilities (copied from src/lib/utils/text.ts)
function generateSlug(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

function getLocalizedTitle(title: { english?: string | null; romaji: string }): string {
  return title.english || title.romaji;
}

interface AnimeDoc {
  id: number;
  slug?: string;
  title: {
    english?: string | null;
    romaji: string;
  };
  seasonYear?: number;
}

async function generateUniqueSlug(
  db: Firestore,
  animeId: number,
  title: { english?: string | null; romaji: string },
  seasonYear?: number
): Promise<string> {
  const displayTitle = getLocalizedTitle(title);
  let slug = generateSlug(displayTitle);
  
  if (!slug) {
    slug = generateSlug(title.romaji);
  }
  
  if (!slug) {
    return `anime-${animeId}`;
  }

  // Check if slug is already taken by another anime
  const slugQuery = await db.collection("anime")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  
  if (slugQuery.empty) {
    return slug;
  }
  
  // Check if it's the same anime (already has this slug)
  if (slugQuery.docs[0].id === String(animeId)) {
    return slug;
  }
  
  // Slug is taken - try with romaji if we used english
  if (title.english && title.romaji !== title.english) {
    const romajiSlug = generateSlug(title.romaji);
    if (romajiSlug && romajiSlug !== slug) {
      const romajiQuery = await db.collection("anime")
        .where("slug", "==", romajiSlug)
        .limit(1)
        .get();
      if (romajiQuery.empty) {
        return romajiSlug;
      }
    }
  }
  
  // Add year suffix if available
  if (seasonYear) {
    const yearSlug = `${slug}-${seasonYear}`;
    const yearQuery = await db.collection("anime")
      .where("slug", "==", yearSlug)
      .limit(1)
      .get();
    if (yearQuery.empty) {
      return yearSlug;
    }
  }

  // Last resort: append anime ID
  return `${slug}-${animeId}`;
}

async function migrateAnimeSlugs() {
  console.log("🚀 Starting slug migration...\n");
  
  const db = initFirebase();
  
  // Get all anime documents
  const snapshot = await db.collection("anime").get();
  
  console.log(`📊 Found ${snapshot.size} anime documents\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let batchCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data() as AnimeDoc;
    
    // Skip if already has a slug
    if (data.slug) {
      skipped++;
      continue;
    }
    
    try {
      const slug = await generateUniqueSlug(db, data.id, data.title, data.seasonYear);
      
      batch.update(doc.ref, { slug });
      batchCount++;
      updated++;
      
      console.log(`✅ ${data.id}: "${getLocalizedTitle(data.title)}" → ${slug}`);
      
      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`\n📦 Committed batch of ${batchCount} updates\n`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      console.error(`❌ Error processing ${data.id}:`, error);
      errors++;
    }
  }
  
  // Commit remaining updates
  if (batchCount > 0) {
    await batch.commit();
    console.log(`\n📦 Committed final batch of ${batchCount} updates\n`);
  }
  
  console.log("\n========================================");
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already had slug): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("========================================\n");
}

// Run the migration
migrateAnimeSlugs()
  .then(() => {
    console.log("✨ Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
