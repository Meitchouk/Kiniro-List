/**
 * Test script for AnimeFLV integration with our API
 * Run with: npx ts-node --esm scripts/test-animeflv-integration.ts
 */

import * as AnimeFLVScraper from "animeflv-scraper";

// Types from our implementation
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

interface AnimeFLVSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  media: Array<{
    title: string;
    slug: string;
    cover: string;
    synopsis: string;
    rating: string;
    type: string;
    url: string;
  }>;
}

interface AnimeFLVServer {
  name: string;
  embed?: string;
  download?: string;
}

interface AnimeFLVEpisodeInfo {
  title: string;
  number: number;
  servers: AnimeFLVServer[];
}

// Simulating our client functions
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const words1 = new Set(s1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(s2.split(" ").filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  return overlap / Math.max(words1.size, words2.size);
}

async function findAnimeByTitle(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
): Promise<string | null> {
  const titlesToTry = [titleRomaji, titleEnglish, titleNative].filter(Boolean) as string[];

  console.log(`[AnimeFLV] Finding anime with titles:`, titlesToTry);

  for (const title of titlesToTry) {
    try {
      const searchResult = (await AnimeFLVScraper.searchAnime(title)) as AnimeFLVSearchResult;

      if (searchResult.media && searchResult.media.length > 0) {
        let bestMatch = searchResult.media[0];
        let bestScore = 0;

        for (const anime of searchResult.media) {
          for (const searchTitle of titlesToTry) {
            const score = calculateSimilarity(anime.title, searchTitle);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = anime;
            }
          }
        }

        if (bestScore > 0.5) {
          console.log(
            `[AnimeFLV] Found match: "${bestMatch.title}" (slug: ${bestMatch.slug}, score: ${bestScore.toFixed(2)})`
          );
          return bestMatch.slug;
        }

        console.log(
          `[AnimeFLV] Using first result: "${bestMatch.title}" (slug: ${bestMatch.slug})`
        );
        return bestMatch.slug;
      }
    } catch (error) {
      console.warn(`[AnimeFLV] Search failed for "${title}":`, error);
    }
  }

  return null;
}

async function getEpisodes(
  slug: string
): Promise<Array<{ id: string; title: string; number: number }>> {
  console.log(`[AnimeFLV] Fetching episodes for: ${slug}`);

  const animeInfo = (await AnimeFLVScraper.getAnimeInfo(slug)) as AnimeFLVAnimeInfo;

  return animeInfo.episodes.map((ep) => ({
    id: ep.slug,
    title: `Episodio ${ep.number}`,
    number: ep.number,
  }));
}

async function getAnimeEpisodesByTitles(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
): Promise<{
  slug: string;
  episodes: Array<{ id: string; title: string; number: number }>;
} | null> {
  const slug = await findAnimeByTitle(titleRomaji, titleEnglish, titleNative);

  if (!slug) {
    return null;
  }

  const episodes = await getEpisodes(slug);
  return { slug, episodes };
}

async function getStreamingLinks(episodeSlug: string): Promise<{
  servers: Array<{ name: string; url: string; type: "embed" | "download" }>;
  episodeNumber: number;
  animeTitle: string;
}> {
  console.log(`[AnimeFLV] Fetching servers for episode: ${episodeSlug}`);

  const episodeInfo = (await AnimeFLVScraper.getEpisode(episodeSlug)) as AnimeFLVEpisodeInfo;

  const servers: Array<{ name: string; url: string; type: "embed" | "download" }> =
    episodeInfo.servers
      .map((server) => {
        const results: Array<{ name: string; url: string; type: "embed" | "download" }> = [];

        if (server.embed) {
          results.push({
            name: server.name,
            url: server.embed,
            type: "embed",
          });
        }

        if (server.download) {
          results.push({
            name: `${server.name} (Download)`,
            url: server.download,
            type: "download",
          });
        }

        return results;
      })
      .flat();

  return {
    servers,
    episodeNumber: episodeInfo.number,
    animeTitle: episodeInfo.title,
  };
}

async function testIntegration() {
  console.log("🔍 Testing AnimeFLV Integration...\n");
  console.log("═".repeat(60));

  // Test anime: Seihantai na Kimi to Boku (You and I Are Polar Opposites)
  const titleRomaji = "Seihantai na Kimi to Boku";
  const titleEnglish = "You and I Are Polar Opposites";
  const titleNative = "正反対な君と僕";

  try {
    // 1. Test findAnimeByTitle (simulating what our API does)
    console.log("\n📌 Test 1: Finding anime by AniList titles");
    console.log("─".repeat(60));

    const slug = await findAnimeByTitle(titleRomaji, titleEnglish, titleNative);
    console.log(`✅ Found slug: ${slug}`);

    if (!slug) {
      console.log("❌ Could not find anime, stopping tests");
      return;
    }

    // 2. Test getEpisodes
    console.log("\n📌 Test 2: Getting normalized episodes");
    console.log("─".repeat(60));

    const episodes = await getEpisodes(slug);
    console.log(`✅ Found ${episodes.length} episodes`);
    console.log("First episode:", JSON.stringify(episodes[0], null, 2));

    // 3. Test getAnimeEpisodesByTitles (full flow)
    console.log("\n📌 Test 3: Full flow - getAnimeEpisodesByTitles");
    console.log("─".repeat(60));

    const fullResult = await getAnimeEpisodesByTitles(titleRomaji, titleEnglish, titleNative);
    console.log(`✅ Slug: ${fullResult?.slug}`);
    console.log(`✅ Episodes: ${fullResult?.episodes.length}`);

    // 4. Test getStreamingLinks
    console.log("\n📌 Test 4: Getting streaming links for episode 1");
    console.log("─".repeat(60));

    if (episodes.length > 0) {
      const streamingLinks = await getStreamingLinks(episodes[0].id);
      console.log(`✅ Found ${streamingLinks.servers.length} servers`);
      console.log("Servers:");
      streamingLinks.servers.forEach((server) => {
        console.log(`  - ${server.name} (${server.type}): ${server.url.substring(0, 50)}...`);
      });
    }

    // 5. Test with another anime to ensure robustness
    console.log("\n📌 Test 5: Testing with 'Solo Leveling'");
    console.log("─".repeat(60));

    const soloLevelingSlug = await findAnimeByTitle(
      "Ore dake Level Up na Ken",
      "Solo Leveling",
      "俺だけレベルアップな件"
    );

    if (soloLevelingSlug) {
      const slEpisodes = await getEpisodes(soloLevelingSlug);
      console.log(`✅ Found: ${soloLevelingSlug}`);
      console.log(`✅ Episodes: ${slEpisodes.length}`);
    } else {
      console.log("⚠️ Could not find Solo Leveling");
    }

    console.log("\n" + "═".repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

// Run the test
testIntegration().catch(console.error);
