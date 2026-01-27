/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test script for animeflv-scraper package
 * Run with: npx ts-node --esm scripts/test-animeflv.ts
 */

import * as AnimeFLV from "animeflv-scraper";

interface AnimeFLVEpisode {
  number: number;
  slug: string;
  url: string;
}

interface AnimeFLVAnimeInfo {
  title: string;
  alternative_titles: string[];
  status: string;
  rating: string;
  type: string;
  cover: string;
  synopsis: string;
  genres: string[];
  next_airing_episode: string | null;
  episodes: AnimeFLVEpisode[];
  url: string;
}

async function testAnimeFLV() {
  console.log("🔍 Testing AnimeFLV Scraper...\n");

  // Test anime: Seihantai na Kimi to Boku (You and I Are Polar Opposites)
  const animeSlug = "seihantai-na-kimi-to-boku";

  try {
    // 1. Get anime info directly by slug
    console.log(`📌 Getting anime info for slug: "${animeSlug}"`);
    console.log("─".repeat(50));

    const animeInfo = (await AnimeFLV.getAnimeInfo(animeSlug)) as AnimeFLVAnimeInfo;
    console.log("\n✅ Anime Details:");
    console.log(JSON.stringify(animeInfo, null, 2));

    // 2. Get episodes if available
    if (animeInfo && animeInfo.episodes && animeInfo.episodes.length > 0) {
      console.log("\n" + "─".repeat(50));
      console.log("🎬 Episodes available:", animeInfo.episodes.length);

      // Get first episode info
      const firstEpisodeId = animeInfo.episodes[0];
      console.log("\nFirst episode data:", JSON.stringify(firstEpisodeId, null, 2));

      // Try to get episode servers/links
      console.log("\n📺 Getting episode servers...");
      try {
        const episodeData = await AnimeFLV.getEpisode(`${animeSlug}-1`);
        console.log("Episode 1 servers:", JSON.stringify(episodeData, null, 2));
      } catch (epError) {
        console.log("Error getting episode:", epError);
      }
    }

    // 3. Test getLatest
    console.log("\n" + "─".repeat(50));
    console.log("📺 Getting latest anime releases...");
    const latest = (await AnimeFLV.getLatest()) as Array<{
      title: string;
      number: number;
      cover: string;
      slug: string;
      url: string;
    }>;
    console.log("Latest releases (first 3):");
    console.log(JSON.stringify(latest?.slice(0, 3), null, 2));

    // 4. Test getOnAir
    console.log("\n" + "─".repeat(50));
    console.log("📺 Getting currently airing anime...");
    const onAir = (await AnimeFLV.getOnAir()) as Array<{
      title: string;
      type: string;
      slug: string;
      url: string;
    }>;
    console.log("On Air (first 3):");
    console.log(JSON.stringify(onAir?.slice(0, 3), null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Also test what methods are available in the package
async function inspectPackage() {
  console.log("\n" + "═".repeat(50));
  console.log("📦 Available methods in animeflv-scraper:");
  console.log("═".repeat(50));

  const methods = Object.keys(AnimeFLV);
  methods.forEach((method) => {
    console.log(`  - ${method}: ${typeof (AnimeFLV as any)[method]}`);
  });
  console.log("\n");
}

// Run tests
async function main() {
  await inspectPackage();
  await testAnimeFLV();
}

main().catch(console.error);
