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
  AniwatchAnime,
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
 * Uses multiple methods for better accuracy
 * Returns a value between 0 and 1
 */
function calculateSimilarity(searchTitle: string, candidateTitle: string): number {
  const s1 = normalizeForComparison(searchTitle);
  const s2 = normalizeForComparison(candidateTitle);

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  // Extract words, filtering out common/short words
  const commonWords = new Set([
    "season",
    "part",
    "the",
    "no",
    "of",
    "and",
    "to",
    "wa",
    "ga",
    "movie",
    "tv",
    "ova",
    "ona",
    "special",
  ]);
  const getSignificantWords = (str: string) => {
    return str.split(" ").filter((w) => w.length > 2 && !commonWords.has(w) && !/^\d+$/.test(w));
  };

  const searchWords = getSignificantWords(s1);
  const candidateWords = getSignificantWords(s2);

  if (searchWords.length === 0 || candidateWords.length === 0) return 0;

  const searchWordSet = new Set(searchWords);
  const candidateWordSet = new Set(candidateWords);

  // Count exact matches
  const exactMatches = [...searchWordSet].filter((w) => candidateWordSet.has(w));

  // Count partial matches (for romanization differences like "shimetsu" vs "shibuya")
  let partialMatches = 0;
  for (const w1 of searchWordSet) {
    if (exactMatches.includes(w1)) continue;
    for (const w2 of candidateWordSet) {
      if (exactMatches.includes(w2)) continue;
      if (w1.length >= 4 && w2.length >= 4) {
        const prefix = Math.min(4, Math.min(w1.length, w2.length));
        if (w1.substring(0, prefix) === w2.substring(0, prefix)) {
          partialMatches += 0.5;
          break;
        }
      }
    }
  }

  // Require at least one significant word match beyond just the franchise name
  if (exactMatches.length === 0 && partialMatches < 1) {
    return 0;
  }

  const totalMatches = exactMatches.length + partialMatches;

  // KEY CHANGE: Consider BOTH how many search words matched AND how many candidate words matched
  // This penalizes when the candidate is much simpler than the search (e.g., "Jujutsu Kaisen" vs "Jujutsu Kaisen: Shibuya...")
  const searchCoverage = totalMatches / searchWordSet.size; // How much of our search is covered
  const candidateCoverage = totalMatches / candidateWordSet.size; // How much of candidate matches

  // If the search title has many more words than the candidate matches, penalize heavily
  // e.g., searching "Jujutsu Kaisen Shibuya Jihen Tokubetsu..." but finding "Jujutsu Kaisen"
  // should score low because we're missing most of the search terms
  if (searchWords.length > 3 && searchCoverage < 0.4) {
    // Complex search title but candidate only matches a small portion
    return searchCoverage * 0.5; // Heavy penalty
  }

  // Balance between search coverage and candidate coverage
  // Prioritize search coverage (finding what we're looking for)
  const score = searchCoverage * 0.7 + candidateCoverage * 0.3;

  // Cap at 0.85 for partial matches (only exact full matches get higher)
  return Math.min(score, 0.85);
}

/**
 * Search hints from AniList metadata for better matching
 */
interface SearchHints {
  format?: string; // TV, MOVIE, OVA, ONA, SPECIAL, etc.
  totalEpisodes?: number;
  year?: number;
}

/**
 * Search for an anime on HiAnime by AniList title
 * Searches with all title variants and returns the best match globally
 */
export async function findAnimeByTitle(
  titleRomaji?: string,
  titleEnglish?: string,
  titleNative?: string,
  seasonHint?: number, // Optional hint for which season we're looking for
  hints?: SearchHints // Additional metadata hints from AniList
): Promise<string | null> {
  // All search queries to try
  const searchQueries = [titleRomaji, titleEnglish, titleNative].filter(Boolean) as string[];

  if (searchQueries.length === 0) {
    console.warn("[AniWatch] No titles provided for search");
    return null;
  }

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

  // Log search info including hints
  const hintsInfo = hints
    ? `format=${hints.format || "?"}, eps=${hints.totalEpisodes || "?"}, year=${hints.year || "?"}`
    : "no hints";
  console.log(
    `[AniWatch] Searching with ${searchQueries.length} title variants, target season: ${targetSeason || 1}, hints: ${hintsInfo}`
  );

  // Collect all results from all search queries
  interface ScoredResult {
    anime: AniwatchAnime;
    score: number;
    detectedSeason: number;
    matchedQuery: string;
    bestTitleScore: number;
  }

  const allCandidates: Map<string, ScoredResult> = new Map();

  // Search with each title variant
  for (const query of searchQueries) {
    try {
      const results = await searchAnime(query);

      if (results.animes.length === 0) {
        console.log(`[AniWatch] No results for query: "${query}"`);
        continue;
      }

      console.log(`[AniWatch] Found ${results.animes.length} results for: "${query}"`);

      // Score each result against ALL provided titles (not just the search query)
      for (const anime of results.animes) {
        // Calculate similarity against all titles and pick the best
        const titleScores = searchQueries.map((title) => ({
          title,
          nameScore: calculateSimilarity(title, anime.name || ""),
          jnameScore: calculateSimilarity(title, anime.jname || ""),
        }));

        // Best score across all title comparisons
        const bestTitleMatch = titleScores.reduce<{
          score: number;
          title: string;
          matchedName: string;
        }>(
          (best, current) => {
            const currentMax = Math.max(current.nameScore, current.jnameScore);
            if (currentMax > best.score) {
              return {
                score: currentMax,
                title: current.title,
                matchedName:
                  (current.nameScore > current.jnameScore ? anime.name : anime.jname) || "",
              };
            }
            return best;
          },
          { score: 0, title: "", matchedName: "" }
        );

        // CRITICAL: Skip candidates with very low title similarity
        // This prevents selecting completely unrelated anime
        const MIN_TITLE_SIMILARITY = 0.25;
        if (bestTitleMatch.score < MIN_TITLE_SIMILARITY) {
          continue; // Skip this candidate entirely
        }

        // Calculate total score - title similarity is now the PRIMARY factor
        let score = 0;

        // Base similarity score (0-70) - increased weight for title matching
        score += bestTitleMatch.score * 70;

        // Season matching (0-15)
        const animeSeason =
          extractSeasonFromTitle(anime.name || "") ||
          extractSeasonFromTitle(anime.jname || "") ||
          1;
        const effectiveTargetSeason = targetSeason || 1;

        if (animeSeason === effectiveTargetSeason) {
          score += 15; // Perfect season match
        } else {
          // Penalize wrong seasons
          score -= Math.abs(animeSeason - effectiveTargetSeason) * 8;
        }

        // FORMAT MATCHING (0-15) - Use hints from AniList
        if (hints?.format) {
          const anilistFormat = hints.format.toUpperCase();
          const hiAnimeType = (anime.type || "").toUpperCase();

          // Map AniList formats to HiAnime types
          const formatMatches =
            (anilistFormat === "MOVIE" && hiAnimeType === "MOVIE") ||
            (anilistFormat === "TV" && hiAnimeType === "TV") ||
            (anilistFormat === "TV_SHORT" && hiAnimeType === "TV") ||
            (anilistFormat === "OVA" && hiAnimeType === "OVA") ||
            (anilistFormat === "ONA" && hiAnimeType === "ONA") ||
            (anilistFormat === "SPECIAL" && hiAnimeType === "SPECIAL");

          if (formatMatches) {
            score += 15; // Strong bonus for matching format
          } else {
            // Penalize mismatched formats (movie vs TV is a big mismatch)
            const isMajorMismatch =
              (anilistFormat === "MOVIE" && hiAnimeType === "TV") ||
              (anilistFormat === "TV" && hiAnimeType === "MOVIE");
            score -= isMajorMismatch ? 20 : 5;
          }
        } else {
          // No format hint - use default type preference
          if (anime.type === "TV") {
            score += 5;
          } else if (anime.type === "Movie") {
            score += 3;
          }
        }

        // EPISODE COUNT MATCHING (0-10) - Use hints from AniList
        const candidateEpisodes = (anime.episodes?.sub || 0) + (anime.episodes?.dub || 0);
        if (hints?.totalEpisodes && candidateEpisodes > 0) {
          const epDiff = Math.abs(candidateEpisodes - hints.totalEpisodes);
          if (epDiff === 0) {
            score += 10; // Exact episode count match
          } else if (epDiff <= 2) {
            score += 5; // Close match (airing anime may have fewer)
          } else if (epDiff > 10) {
            score -= 10; // Big mismatch - probably wrong anime
          }
        } else if (candidateEpisodes > 0) {
          score += 2; // Has episodes available
        }

        // Check if we already have this anime from another query
        const existing = allCandidates.get(anime.id);
        if (!existing || score > existing.score) {
          allCandidates.set(anime.id, {
            anime,
            score,
            detectedSeason: animeSeason,
            matchedQuery: query,
            bestTitleScore: bestTitleMatch.score,
          });
        }
      }
    } catch (error) {
      console.warn(`[AniWatch] Search failed for "${query}":`, error);
    }
  }

  if (allCandidates.size === 0) {
    console.warn("[AniWatch] No candidates found from any search query");
    return null;
  }

  // Sort all candidates by score
  const sortedCandidates = [...allCandidates.values()].sort((a, b) => b.score - a.score);

  // Log top candidates for debugging (including type and episodes)
  console.log(
    `[AniWatch] Top ${Math.min(5, sortedCandidates.length)} candidates (from ${allCandidates.size} unique):`
  );
  sortedCandidates.slice(0, 5).forEach((r, i) => {
    const eps = (r.anime.episodes?.sub || 0) + (r.anime.episodes?.dub || 0);
    console.log(`  ${i + 1}. "${r.anime.name}" (${r.anime.id})`);
    console.log(
      `     Type: ${r.anime.type || "?"}, Eps: ${eps}, Title: ${(r.bestTitleScore * 100).toFixed(0)}%, Total: ${r.score.toFixed(1)}`
    );
  });

  const bestMatch = sortedCandidates[0];

  // Require minimum thresholds to avoid false matches
  const MIN_SCORE_THRESHOLD = 40; // Total score threshold
  const MIN_TITLE_SCORE = 0.35; // Title similarity threshold

  if (bestMatch.bestTitleScore < MIN_TITLE_SCORE) {
    console.warn(
      `[AniWatch] Best match title score (${(bestMatch.bestTitleScore * 100).toFixed(0)}%) below threshold (${MIN_TITLE_SCORE * 100}%)`
    );
    return null;
  }

  if (bestMatch.score < MIN_SCORE_THRESHOLD) {
    console.warn(
      `[AniWatch] Best match total score (${bestMatch.score.toFixed(1)}) below threshold (${MIN_SCORE_THRESHOLD})`
    );
    return null;
  }

  // Additional check: if we're looking for a movie with 1 episode, reject TV series
  if (hints?.format === "MOVIE" && hints?.totalEpisodes === 1) {
    const candidateType = (bestMatch.anime.type || "").toUpperCase();
    const candidateEps =
      (bestMatch.anime.episodes?.sub || 0) + (bestMatch.anime.episodes?.dub || 0);

    if (candidateType === "TV" && candidateEps > 2) {
      console.warn(
        `[AniWatch] Rejecting TV series (${candidateEps} eps) when looking for MOVIE (1 ep)`
      );
      return null;
    }
  }

  console.log(
    `[AniWatch] ✓ Selected: "${bestMatch.anime.name}" (id: ${bestMatch.anime.id}, score: ${bestMatch.score.toFixed(1)})`
  );
  return bestMatch.anime.id;
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
