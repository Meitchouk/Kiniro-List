/**
 * OpenSubtitles API Client
 * Fetches subtitles from OpenSubtitles.com when primary source lacks desired language
 *
 * API Documentation: https://opensubtitles.stoplight.io/docs/opensubtitles-api
 */

// ============ Types ============

export interface OpenSubtitlesSubtitle {
  id: string;
  type: string;
  attributes: {
    subtitle_id: string;
    language: string;
    download_count: number;
    hearing_impaired: boolean;
    hd: boolean;
    fps: number;
    votes: number;
    ratings: number;
    from_trusted: boolean;
    foreign_parts_only: boolean;
    upload_date: string;
    ai_translated: boolean;
    machine_translated: boolean;
    release: string;
    comments: string;
    legacy_subtitle_id: number;
    uploader: {
      uploader_id: number;
      name: string;
      rank: string;
    };
    feature_details: {
      feature_id: number;
      feature_type: string;
      year: number;
      title: string;
      movie_name: string;
      imdb_id: number;
      season_number?: number;
      episode_number?: number;
      parent_imdb_id?: number;
      parent_title?: string;
      parent_feature_id?: number;
    };
    url: string;
    related_links: Array<{
      label: string;
      url: string;
      img_url: string;
    }>;
    files: Array<{
      file_id: number;
      cd_number: number;
      file_name: string;
    }>;
  };
}

export interface OpenSubtitlesSearchResponse {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: OpenSubtitlesSubtitle[];
}

export interface OpenSubtitlesDownloadResponse {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
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
}

// ============ Configuration ============

const OPENSUBTITLES_API_URL = "https://api.opensubtitles.com/api/v1";
const API_KEY = process.env.OPENSUBTITLES_API_KEY || "";
const USER_AGENT = "Kiniro-List v1.0";

// Language code mapping
const LANGUAGE_CODES: Record<string, string> = {
  spanish: "es",
  "spanish (latin america)": "es",
  english: "en",
  portuguese: "pt-BR",
  french: "fr",
  german: "de",
  italian: "it",
  japanese: "ja",
  korean: "ko",
  chinese: "zh-CN",
  arabic: "ar",
  russian: "ru",
};

// ============ Helper Functions ============

async function fetchOpenSubtitles<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error("OpenSubtitles API key not configured");
  }

  const response = await fetch(`${OPENSUBTITLES_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Api-Key": API_KEY,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenSubtitles API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============ API Functions ============

/**
 * Search for subtitles by anime/movie name
 */
export async function searchSubtitles(
  query: string,
  options: {
    languages?: string[];
    season?: number;
    episode?: number;
    year?: number;
    type?: "movie" | "episode" | "all";
  } = {}
): Promise<SubtitleResult[]> {
  const params = new URLSearchParams();
  params.set("query", query);

  // Set languages (default to Spanish and English)
  const languages = options.languages || ["es", "en"];
  params.set("languages", languages.join(","));

  // Set type filter
  if (options.type && options.type !== "all") {
    params.set("type", options.type);
  }

  // Set season/episode for TV shows
  if (options.season !== undefined) {
    params.set("season_number", options.season.toString());
  }
  if (options.episode !== undefined) {
    params.set("episode_number", options.episode.toString());
  }

  // Set year if provided
  if (options.year) {
    params.set("year", options.year.toString());
  }

  // Order by download count (popularity)
  params.set("order_by", "download_count");
  params.set("order_direction", "desc");

  console.log(`[OpenSubtitles] Searching: ${query} (${languages.join(", ")})`);

  const response = await fetchOpenSubtitles<OpenSubtitlesSearchResponse>(
    `/subtitles?${params.toString()}`
  );

  // Map to simplified format
  return response.data.map((sub) => ({
    id: sub.id,
    language: sub.attributes.language,
    languageCode: LANGUAGE_CODES[sub.attributes.language.toLowerCase()] || sub.attributes.language,
    downloadCount: sub.attributes.download_count,
    rating: sub.attributes.ratings,
    release: sub.attributes.release,
    isHD: sub.attributes.hd,
    isTrusted: sub.attributes.from_trusted,
    isAiTranslated: sub.attributes.ai_translated || sub.attributes.machine_translated,
    fileId: sub.attributes.files[0]?.file_id || 0,
  }));
}

/**
 * Search for anime subtitles specifically
 * Uses the anime title and episode number to find matching subtitles
 */
export async function searchAnimeSubtitles(
  animeTitle: string,
  episodeNumber: number,
  options: {
    languages?: string[];
    seasonNumber?: number;
    year?: number;
  } = {}
): Promise<SubtitleResult[]> {
  // For anime, we typically search as TV episode
  const results = await searchSubtitles(animeTitle, {
    languages: options.languages || ["es", "en"],
    episode: episodeNumber,
    season: options.seasonNumber || 1, // Most anime are "season 1"
    year: options.year,
    type: "episode",
  });

  // If no results with episode filter, try without
  if (results.length === 0) {
    console.log("[OpenSubtitles] No results with episode filter, trying broader search...");
    return searchSubtitles(`${animeTitle} ${episodeNumber}`, {
      languages: options.languages || ["es", "en"],
      type: "all",
    });
  }

  return results;
}

/**
 * Get download link for a subtitle
 * Note: This requires user authentication for the download endpoint
 */
export async function getSubtitleDownloadLink(fileId: number): Promise<string> {
  const response = await fetchOpenSubtitles<OpenSubtitlesDownloadResponse>("/download", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId }),
  });

  console.log(`[OpenSubtitles] Download link obtained. Remaining requests: ${response.remaining}`);

  return response.link;
}

/**
 * Check if OpenSubtitles is configured
 */
export function isOpenSubtitlesConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Get the best Spanish subtitle from results
 * Prioritizes: trusted > high downloads > HD > not AI translated
 */
export function getBestSpanishSubtitle(results: SubtitleResult[]): SubtitleResult | null {
  const spanishSubs = results.filter(
    (sub) => sub.languageCode === "es" || sub.language.toLowerCase().includes("spanish")
  );

  if (spanishSubs.length === 0) return null;

  // Sort by quality criteria
  return spanishSubs.sort((a, b) => {
    // Trusted sources first
    if (a.isTrusted !== b.isTrusted) return a.isTrusted ? -1 : 1;
    // Non-AI translated preferred
    if (a.isAiTranslated !== b.isAiTranslated) return a.isAiTranslated ? 1 : -1;
    // Higher downloads = more reliable
    if (b.downloadCount !== a.downloadCount) return b.downloadCount - a.downloadCount;
    // HD preferred
    if (a.isHD !== b.isHD) return a.isHD ? -1 : 1;
    // Higher rating
    return b.rating - a.rating;
  })[0];
}
