/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Subdl API Client
 * Free subtitle API without authentication
 *
 * API: https://api.subdl.com
 */

// ============ Types ============

export interface SubdlSubtitle {
  sd_id: number;
  type: string;
  name: string;
  release_name: string;
  author: string;
  url: string;
  subtitlePage: string;
  language: string;
  hi: boolean; // Hearing impaired
  episode_from?: number;
  episode_end?: number;
  season?: number;
}

export interface SubdlSearchResponse {
  status: boolean;
  results?: Array<{
    sd_id: number;
    type: string;
    name: string;
    imdb_id: string;
    tmdb_id: number;
    first_air_date?: string;
    release_date?: string;
  }>;
  subtitles?: SubdlSubtitle[];
}

export interface SubtitleResult {
  id: string;
  language: string;
  languageCode: string;
  downloadCount: number;
  rating: number;
  release: string;
  isHD: boolean;
  isTrusted: boolean;
  isAiTranslated: boolean;
  fileId: number;
  // Subdl specific
  downloadUrl?: string;
  source: "opensubtitles" | "subdl";
}

// ============ Configuration ============

const SUBDL_API_URL = "https://api.subdl.com/api/v1/subtitles";
const SUBDL_API_KEY = process.env.SUBDL_API_KEY || "";

// Language code mapping
const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  en: "English",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  ru: "Russian",
};

// ============ API Functions ============

/**
 * Search for subtitles on Subdl
 */
export async function searchSubdl(
  query: string,
  options: {
    languages?: string[];
    season?: number;
    episode?: number;
    type?: "movie" | "tv";
  } = {}
): Promise<SubtitleResult[]> {
  if (!SUBDL_API_KEY) {
    throw new Error("Subdl API key not configured");
  }

  const params = new URLSearchParams();
  params.set("api_key", SUBDL_API_KEY);
  params.set("film_name", query);
  params.set("subs_per_page", "30");

  // Set languages
  const languages = options.languages || ["es", "en"];
  params.set("languages", languages.join(","));

  // Set season/episode for TV
  if (options.season !== undefined) {
    params.set("season_number", options.season.toString());
  }
  if (options.episode !== undefined) {
    params.set("episode_number", options.episode.toString());
  }

  // Set type
  if (options.type) {
    params.set("type", options.type);
  }

  const url = `${SUBDL_API_URL}?${params.toString()}`;
  console.log(`[Subdl] Searching: ${query} (${languages.join(", ")})`);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Kiniro-List/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Subdl API error: ${response.status}`);
    }

    const data: SubdlSearchResponse = await response.json();

    if (!data.status || !data.subtitles || data.subtitles.length === 0) {
      console.log("[Subdl] No subtitles found");
      return [];
    }

    console.log(`[Subdl] Found ${data.subtitles.length} subtitles`);

    // Map to unified format
    return data.subtitles.map((sub, index) => ({
      id: `subdl-${sub.sd_id}`,
      language: LANGUAGE_NAMES[sub.language] || sub.language,
      languageCode: sub.language,
      downloadCount: 0, // Subdl doesn't provide this
      rating: 0, // Subdl doesn't provide this
      release: sub.release_name || sub.name,
      isHD: false,
      isTrusted: false,
      isAiTranslated: false,
      fileId: sub.sd_id,
      downloadUrl: sub.url, // Subdl gives direct download URL
      source: "subdl" as const,
    }));
  } catch (error) {
    console.error("[Subdl] Search error:", error);
    throw error;
  }
}

/**
 * Search for anime subtitles on Subdl
 */
export async function searchAnimeSubtitlesSubdl(
  animeTitle: string,
  episodeNumber: number,
  options: {
    languages?: string[];
    seasonNumber?: number;
  } = {}
): Promise<SubtitleResult[]> {
  // Try as TV show first
  let results = await searchSubdl(animeTitle, {
    languages: options.languages || ["es", "en"],
    episode: episodeNumber,
    season: options.seasonNumber || 1,
    type: "tv",
  });

  // If no results, try without type filter
  if (results.length === 0) {
    console.log("[Subdl] No results as TV, trying general search...");
    results = await searchSubdl(`${animeTitle} ${episodeNumber}`, {
      languages: options.languages || ["es", "en"],
    });
  }

  return results;
}

/**
 * Get best Spanish subtitle from Subdl results
 */
export function getBestSpanishSubtitleSubdl(results: SubtitleResult[]): SubtitleResult | null {
  const spanishSubs = results.filter(
    (sub) =>
      sub.languageCode === "es" ||
      sub.language.toLowerCase().includes("spanish") ||
      sub.language.toLowerCase().includes("español")
  );

  if (spanishSubs.length === 0) return null;

  // Return first one (they're usually sorted by relevance)
  return spanishSubs[0];
}

/**
 * Check if Subdl is configured
 */
export function isSubdlConfigured(): boolean {
  return !!SUBDL_API_KEY;
}
