/**
 * AniWatch API Client
 * Server-side client for the HiAnime API
 * Uses REST API instead of scraping locally
 *
 * API Documentation: https://github.com/ghoshRitesh12/aniwatch-api
 */

import type {
  AniwatchSearchResult,
  AniwatchEpisodesResponse,
  AniwatchServersResponse,
  AniwatchStreamingResponse,
  AniwatchAnimeInfo,
  ServerCategory,
  NormalizedEpisode,
  NormalizedStreamingLinks,
  NormalizedAnimeInfo,
} from "./types";

// ============ Configuration ============

// Local Docker instance of aniwatch-api (recommended for development)
// Run: docker run -d --name aniwatch-api -p 4000:4000 ghcr.io/ghoshritesh12/aniwatch
const ANIWATCH_API_BASE_URL = process.env.ANIWATCH_API_URL || "http://localhost:4000";

// Default server to use for streaming (hd-1 is usually most reliable)
const DEFAULT_SERVER = "hd-1";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 15000;

// ============ API Response Wrapper ============

// The AniWatch API wraps all responses in { status: number, data: T }
interface ApiResponse<T> {
  status: number;
  data: T;
}

// ============ Helper Functions ============

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Kiniro-List/1.0",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`AniWatch API error (${response.status}): ${errorText}`);
    }

    // API returns { status: number, data: T } - extract data
    const json = (await response.json()) as ApiResponse<T>;
    return json.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AniWatch API request timed out");
    }

    throw error;
  }
}

// ============ Search Functions ============

/**
 * Search anime by query
 */
export async function searchAnime(query: string, page: number = 1): Promise<AniwatchSearchResult> {
  const url = `${ANIWATCH_API_BASE_URL}/api/v2/hianime/search?q=${encodeURIComponent(query)}&page=${page}`;

  console.log(`[AniWatch] Searching for: "${query}" (page ${page})`);

  return fetchWithTimeout<AniwatchSearchResult>(url);
}

// ============ Anime Info Functions ============

/**
 * Get anime info by HiAnime ID
 */
export async function getAnimeInfo(animeId: string): Promise<AniwatchAnimeInfo> {
  const url = `${ANIWATCH_API_BASE_URL}/api/v2/hianime/anime/${animeId}`;

  console.log(`[AniWatch] Fetching anime info for: ${animeId}`);

  return fetchWithTimeout<AniwatchAnimeInfo>(url);
}

/**
 * Get episodes for an anime by HiAnime ID
 */
export async function getEpisodes(animeId: string): Promise<AniwatchEpisodesResponse> {
  const url = `${ANIWATCH_API_BASE_URL}/api/v2/hianime/anime/${animeId}/episodes`;

  console.log(`[AniWatch] Fetching episodes for: ${animeId}`);

  return fetchWithTimeout<AniwatchEpisodesResponse>(url);
}

// ============ Streaming Functions ============

/**
 * Get available servers for an episode
 */
export async function getEpisodeServers(episodeId: string): Promise<AniwatchServersResponse> {
  const url = `${ANIWATCH_API_BASE_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${encodeURIComponent(episodeId)}`;

  console.log(`[AniWatch] Fetching servers for episode: ${episodeId}`);

  return fetchWithTimeout<AniwatchServersResponse>(url);
}

/**
 * Get streaming sources for an episode
 * @param episodeId - Episode ID (e.g., "spy-x-family-17977?ep=95653")
 * @param server - Server name (e.g., "hd-1", "hd-2")
 * @param category - "sub", "dub", or "raw"
 */
export async function getStreamingSources(
  episodeId: string,
  server: string = DEFAULT_SERVER,
  category: ServerCategory = "sub"
): Promise<AniwatchStreamingResponse> {
  const url = `${ANIWATCH_API_BASE_URL}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&server=${server}&category=${category}`;

  console.log(
    `[AniWatch] Fetching sources for episode: ${episodeId} (server: ${server}, category: ${category})`
  );

  return fetchWithTimeout<AniwatchStreamingResponse>(url);
}

// ============ Mapping Functions ============

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
 * Extract season number from title string
 * Handles formats like: "Season 2", "2nd Season", "Part 2", "II", etc.
 */
function extractSeasonFromTitle(title: string): number | null {
  const lowerTitle = title.toLowerCase();

  // Direct patterns: "season 3", "3rd season", "part 3"
  const directMatch = lowerTitle.match(/(?:season|part)\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season/);
  if (directMatch) {
    return parseInt(directMatch[1] || directMatch[2], 10);
  }

  // Roman numerals in title: "II", "III", "IV"
  const romanNumerals: Record<string, number> = {
    " ii": 2,
    " iii": 3,
    " iv": 4,
    " v": 5,
    " vi": 6,
    ":ii": 2,
    ":iii": 3,
    ":iv": 4,
    ":v": 5,
    ":vi": 6,
  };
  for (const [pattern, num] of Object.entries(romanNumerals)) {
    if (lowerTitle.includes(pattern)) {
      return num;
    }
  }

  // If no season indicator, it's likely season 1
  return null;
}

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }

  // Word-based similarity
  const words1 = new Set(s1.split(" "));
  const words2 = new Set(s2.split(" "));
  const intersection = [...words1].filter((w) => words2.has(w));
  const union = new Set([...words1, ...words2]);

  return intersection.length / union.size;
}

/**
 * Search for an anime on HiAnime by AniList title
 * Returns the best match's HiAnime ID with improved season matching
 */
export async function findAnimeByTitle(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string,
  seasonHint?: number // Optional hint for which season we're looking for
): Promise<string | null> {
  // Try English title first, then Romaji, then Native
  const searchQueries = [titleEnglish, titleRomaji, titleNative].filter(Boolean) as string[];

  // Detect season from provided titles
  let targetSeason = seasonHint || null;
  if (!targetSeason) {
    for (const title of searchQueries) {
      const detected = extractSeasonFromTitle(title);
      if (detected) {
        targetSeason = detected;
        break;
      }
    }
  }

  console.log(`[AniWatch] Searching for anime with target season: ${targetSeason || 1}`);

  for (const query of searchQueries) {
    try {
      const results = await searchAnime(query);

      if (results.animes.length === 0) continue;

      // Score each result
      const scoredResults = results.animes.map((anime) => {
        let score = 0;

        // Base similarity score (0-100)
        const nameSimilarity = Math.max(
          calculateSimilarity(query, anime.name || ""),
          calculateSimilarity(query, anime.jname || "")
        );
        score += nameSimilarity * 50;

        // Season matching (0-50)
        const animeSeason =
          extractSeasonFromTitle(anime.name || "") ||
          extractSeasonFromTitle(anime.jname || "") ||
          1;
        const effectiveTargetSeason = targetSeason || 1;

        if (animeSeason === effectiveTargetSeason) {
          score += 50; // Perfect season match
        } else if (Math.abs(animeSeason - effectiveTargetSeason) === 1) {
          score += 10; // Close season (off by 1)
        }
        // Penalize wrong seasons significantly
        if (animeSeason !== effectiveTargetSeason) {
          score -= Math.abs(animeSeason - effectiveTargetSeason) * 15;
        }

        // Prefer TV over Special/OVA for main content
        if (anime.type === "TV") {
          score += 5;
        } else if (anime.type === "Special" || anime.type === "OVA") {
          score -= 10;
        }

        return { anime, score, detectedSeason: animeSeason };
      });

      // Sort by score descending
      scoredResults.sort((a, b) => b.score - a.score);

      // Log top 3 candidates for debugging
      console.log(
        `[AniWatch] Top candidates for "${query}" (target season: ${targetSeason || 1}):`
      );
      scoredResults.slice(0, 3).forEach((r, i) => {
        console.log(
          `  ${i + 1}. "${r.anime.name}" (${r.anime.id}) - Season: ${r.detectedSeason}, Score: ${r.score.toFixed(1)}`
        );
      });

      const bestMatch = scoredResults[0];
      if (bestMatch && bestMatch.score > 0) {
        console.log(`[AniWatch] Selected: "${bestMatch.anime.name}" (id: ${bestMatch.anime.id})`);
        return bestMatch.anime.id;
      }
    } catch (error) {
      console.warn(`[AniWatch] Search failed for "${query}":`, error);
    }
  }

  return null;
}

// ============ Normalized API (compatible with existing code) ============

/**
 * Get anime episodes using AniList ID
 * Maps AniList ID to HiAnime ID and fetches episodes
 */
export async function getAnimeEpisodesByAnilistId(
  anilistId: number,
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string
  //   dub: boolean = false
): Promise<NormalizedAnimeInfo | null> {
  try {
    // First, search for the anime on HiAnime
    const hiAnimeId = await findAnimeByTitle(titleRomaji, titleEnglish, titleNative);

    if (!hiAnimeId) {
      console.warn(`[AniWatch] Could not find anime on HiAnime for AniList ID: ${anilistId}`);
      return null;
    }

    // Get anime info and episodes
    const [animeInfo, episodesData] = await Promise.all([
      getAnimeInfo(hiAnimeId),
      getEpisodes(hiAnimeId),
    ]);

    // Normalize to our expected format
    const normalized: NormalizedAnimeInfo = {
      id: hiAnimeId,
      title: {
        romaji: titleRomaji,
        english: titleEnglish || animeInfo.anime.info.name,
        native: titleNative || animeInfo.anime.moreInfo.japanese,
      },
      malId: animeInfo.anime.info.malId ?? undefined,
      anilistId: animeInfo.anime.info.anilistId ?? anilistId,
      image: animeInfo.anime.info.poster,
      description: animeInfo.anime.info.description,
      status: animeInfo.anime.moreInfo.status,
      rating: animeInfo.anime.info.stats?.rating
        ? parseFloat(animeInfo.anime.info.stats.rating)
        : undefined,
      genres: animeInfo.anime.moreInfo.genres,
      totalEpisodes: episodesData.totalEpisodes,
      type: animeInfo.anime.info.stats?.type,
      episodes: episodesData.episodes.map(
        (ep): NormalizedEpisode => ({
          id: ep.episodeId,
          title: ep.title || null,
          number: ep.number,
          isFiller: ep.isFiller,
        })
      ),
    };

    return normalized;
  } catch (error) {
    console.error(`[AniWatch] Error fetching episodes for AniList ID ${anilistId}:`, error);
    throw error;
  }
}

/**
 * Get streaming links for an episode
 * Returns normalized format compatible with existing VideoPlayer
 */
export async function getStreamingLinks(
  episodeId: string,
  dub: boolean = false
): Promise<NormalizedStreamingLinks> {
  try {
    const category: ServerCategory = dub ? "dub" : "sub";

    // Try multiple servers in order of reliability
    let sources: AniwatchStreamingResponse | null = null;
    const servers = ["hd-1", "hd-2", "megacloud"];
    let lastError: Error | null = null;

    for (const server of servers) {
      try {
        sources = await getStreamingSources(episodeId, server, category);
        if (sources.sources.length > 0) {
          console.log(`[AniWatch] Got sources from server: ${server}`);
          break;
        }
      } catch (serverError) {
        lastError = serverError as Error;
        console.warn(`[AniWatch] Server ${server} failed, trying next...`, serverError);
      }
    }

    if (!sources || sources.sources.length === 0) {
      throw lastError || new Error("No streaming sources found");
    }

    // Get referer from API response, fallback to hianime.to
    const referer = sources.headers?.Referer || "https://hianime.to/";

    // Normalize to our expected format
    const normalized: NormalizedStreamingLinks = {
      sources: sources.sources.map((src) => ({
        url: src.url,
        quality: "auto", // HiAnime typically provides adaptive HLS
        isM3U8: src.type === "hls" || src.url.includes(".m3u8"),
      })),
      subtitles: sources.tracks?.map((track) => ({
        url: track.url,
        lang: track.lang,
        label: track.label,
      })),
      intro: sources.intro?.start !== undefined ? sources.intro : undefined,
      outro: sources.outro?.start !== undefined ? sources.outro : undefined,
      headers: {
        Referer: referer,
      },
    };

    console.log(`[AniWatch] Streaming links:`, {
      sourcesCount: normalized.sources.length,
      subtitlesCount: normalized.subtitles?.length || 0,
      hasIntro: !!normalized.intro,
      hasOutro: !!normalized.outro,
    });

    return normalized;
  } catch (error) {
    console.error(`[AniWatch] Error fetching streaming links for episode ${episodeId}:`, error);
    throw error;
  }
}
