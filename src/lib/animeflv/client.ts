/**
 * AnimeFLV API Client
 * Server-side client for scraping AnimeFLV
 * Uses animeflv-scraper package for data extraction
 *
 * Package: https://www.npmjs.com/package/animeflv-scraper
 *
 * NOTE: AnimeFLV is a Spanish anime streaming site.
 * This provides Spanish-subbed anime options for users.
 */

import * as AnimeFLVScraper from "animeflv-scraper";
import type {
  AnimeFLVSearchResult,
  AnimeFLVAnimeInfo,
  AnimeFLVEpisodeInfo,
  AnimeFLVLatestEpisode,
  AnimeFLVOnAirAnime,
  NormalizedAnimeFLVEpisode,
  NormalizedAnimeFLVServer,
  NormalizedAnimeFLVStreamingLinks,
} from "./types";

// ============ Configuration ============

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 20000;

// ============ Helper Functions ============

/**
 * Wrap a promise with timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeout: number = REQUEST_TIMEOUT): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("AnimeFLV request timed out")), timeout)
    ),
  ]);
}

/**
 * Normalize string for comparison (lowercase, remove special chars)
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity score between two strings
 * Returns a number between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Simple word overlap similarity
  const words1 = new Set(s1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(s2.split(" ").filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  return overlap / Math.max(words1.size, words2.size);
}

// ============ Search Functions ============

/**
 * Search anime by query
 */
export async function searchAnime(query: string): Promise<AnimeFLVSearchResult> {
  console.log(`[AnimeFLV] Searching for: "${query}"`);

  const result = await withTimeout(AnimeFLVScraper.searchAnime(query));
  return result as AnimeFLVSearchResult;
}

/**
 * Find anime on AnimeFLV by trying different title variations
 * Returns the best matching slug or null
 */
export async function findAnimeByTitle(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
): Promise<string | null> {
  const titlesToTry = [titleRomaji, titleEnglish, titleNative].filter(Boolean) as string[];

  console.log(`[AnimeFLV] Finding anime with titles:`, titlesToTry);

  for (const title of titlesToTry) {
    try {
      const searchResult = await searchAnime(title);

      if (searchResult.media && searchResult.media.length > 0) {
        // Find best match based on title similarity
        let bestMatch = searchResult.media[0];
        let bestScore = 0;

        for (const anime of searchResult.media) {
          // Check against all provided titles
          for (const searchTitle of titlesToTry) {
            const score = Math.max(
              calculateSimilarity(anime.title, searchTitle),
              // Also check alternative titles if available
              ...titlesToTry.map((t) => calculateSimilarity(anime.title, t))
            );

            if (score > bestScore) {
              bestScore = score;
              bestMatch = anime;
            }
          }
        }

        // Only return if we have a reasonable match (> 0.5 similarity)
        if (bestScore > 0.5) {
          console.log(
            `[AnimeFLV] Found match: "${bestMatch.title}" (slug: ${bestMatch.slug}, score: ${bestScore.toFixed(2)})`
          );
          return bestMatch.slug;
        }

        // If no good match but we have results, return first result
        // (the search already filtered by relevance)
        console.log(
          `[AnimeFLV] Using first result: "${bestMatch.title}" (slug: ${bestMatch.slug})`
        );
        return bestMatch.slug;
      }
    } catch (error) {
      console.warn(`[AnimeFLV] Search failed for "${title}":`, error);
      // Continue to next title variant
    }
  }

  console.warn(`[AnimeFLV] No anime found for any title variant`);
  return null;
}

// ============ Anime Info Functions ============

/**
 * Get anime info by AnimeFLV slug
 */
export async function getAnimeInfo(slug: string): Promise<AnimeFLVAnimeInfo> {
  console.log(`[AnimeFLV] Fetching anime info for: ${slug}`);

  const result = await withTimeout(AnimeFLVScraper.getAnimeInfo(slug));
  return result as AnimeFLVAnimeInfo;
}

/**
 * Get episodes for an anime by its slug
 */
export async function getEpisodes(slug: string): Promise<NormalizedAnimeFLVEpisode[]> {
  console.log(`[AnimeFLV] Fetching episodes for: ${slug}`);

  const animeInfo = await getAnimeInfo(slug);

  return animeInfo.episodes.map((ep) => ({
    id: ep.slug,
    title: `Episodio ${ep.number}`, // AnimeFLV doesn't provide episode titles
    number: ep.number,
    provider: "animeflv" as const,
  }));
}

/**
 * Get anime episodes by searching with AniList titles
 */
export async function getAnimeEpisodesByTitles(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
): Promise<{ slug: string; episodes: NormalizedAnimeFLVEpisode[] } | null> {
  const slug = await findAnimeByTitle(titleRomaji, titleEnglish, titleNative);

  if (!slug) {
    return null;
  }

  const episodes = await getEpisodes(slug);
  return { slug, episodes };
}

// ============ Episode Streaming Functions ============

/**
 * Get streaming servers for an episode
 */
export async function getEpisodeServers(episodeSlug: string): Promise<AnimeFLVEpisodeInfo> {
  console.log(`[AnimeFLV] Fetching servers for episode: ${episodeSlug}`);

  const result = await withTimeout(AnimeFLVScraper.getEpisode(episodeSlug));
  return result as AnimeFLVEpisodeInfo;
}

/**
 * Get normalized streaming links for an episode
 */
export async function getStreamingLinks(
  episodeSlug: string
): Promise<NormalizedAnimeFLVStreamingLinks> {
  const episodeInfo = await getEpisodeServers(episodeSlug);

  const servers: NormalizedAnimeFLVServer[] = episodeInfo.servers
    .map((server) => {
      const results: NormalizedAnimeFLVServer[] = [];

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

// ============ Discovery Functions ============

/**
 * Get latest episode releases
 */
export async function getLatestEpisodes(): Promise<AnimeFLVLatestEpisode[]> {
  console.log(`[AnimeFLV] Fetching latest episodes`);

  const result = await withTimeout(AnimeFLVScraper.getLatest());
  return result as AnimeFLVLatestEpisode[];
}

/**
 * Get currently airing anime
 */
export async function getOnAirAnime(): Promise<AnimeFLVOnAirAnime[]> {
  console.log(`[AnimeFLV] Fetching on-air anime`);

  const result = await withTimeout(AnimeFLVScraper.getOnAir());
  return result as AnimeFLVOnAirAnime[];
}

// ============ Advanced Search Functions ============

/**
 * Search anime with filters
 */
export async function searchAnimeWithFilters(options: {
  query?: string;
  genre?: string;
  year?: number;
  type?: string;
  status?: string;
  order?: string;
  page?: number;
}): Promise<AnimeFLVSearchResult> {
  console.log(`[AnimeFLV] Searching with filters:`, options);

  // Build filter object for the scraper
  const filterOptions: Record<string, unknown> = {};

  if (options.genre) filterOptions.genre = options.genre;
  if (options.year) filterOptions.year = options.year;
  if (options.type) filterOptions.type = options.type;
  if (options.status) filterOptions.status = options.status;
  if (options.order) filterOptions.order = options.order;
  if (options.page) filterOptions.page = options.page;

  // If we have a query, use searchAnime, otherwise use filter search
  if (options.query) {
    return searchAnime(options.query);
  }

  const result = await withTimeout(AnimeFLVScraper.searchAnimesByFilter(filterOptions));
  return result as AnimeFLVSearchResult;
}

// ============ Utility Functions ============

/**
 * Extract anime slug from a full AnimeFLV URL
 */
export function extractSlugFromUrl(url: string): string | null {
  // URL format: https://www3.animeflv.net/anime/slug-name
  const match = url.match(/\/anime\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

/**
 * Extract episode slug from a full AnimeFLV URL
 */
export function extractEpisodeSlugFromUrl(url: string): string | null {
  // URL format: https://www3.animeflv.net/ver/slug-name-1
  const match = url.match(/\/ver\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

/**
 * Build AnimeFLV anime URL from slug
 */
export function buildAnimeUrl(slug: string): string {
  return `https://www3.animeflv.net/anime/${slug}`;
}

/**
 * Build AnimeFLV episode URL from slug
 */
export function buildEpisodeUrl(episodeSlug: string): string {
  return `https://www3.animeflv.net/ver/${episodeSlug}`;
}
