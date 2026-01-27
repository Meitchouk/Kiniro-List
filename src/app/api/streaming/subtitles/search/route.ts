import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis";
import {
  searchAnimeSubtitles,
  getBestSpanishSubtitle,
  isSubtitleSearchAvailable,
  getAvailableLanguages,
  filterByLanguage,
} from "@/lib/subtitles";
import { z } from "zod";

// Helper to handle optional numeric params (empty string = undefined)
const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().positive().optional()
);

const optionalYear = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().min(1900).max(2100).optional()
);

const searchSchema = z.object({
  title: z.string().min(1).max(200),
  episode: z.coerce.number().int().positive(),
  season: optionalPositiveInt,
  year: optionalYear,
  languages: z.string().optional(), // comma-separated language codes
  filterLanguage: z.string().optional(), // single language to filter results
});

/**
 * Search for external subtitles from OpenSubtitles + Subdl (parallel)
 * GET /api/streaming/subtitles/search?title=...&episode=...&filterLanguage=es
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "streaming");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Check if any subtitle provider is configured
    if (!isSubtitleSearchAvailable()) {
      return NextResponse.json(
        { error: "External subtitles service not configured" },
        { status: 503 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = searchSchema.safeParse({
      title: searchParams.get("title"),
      episode: searchParams.get("episode"),
      season: searchParams.get("season"),
      year: searchParams.get("year"),
      languages: searchParams.get("languages"),
      filterLanguage: searchParams.get("filterLanguage"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, episode, season, year, languages, filterLanguage } = parseResult.data;

    // Parse languages or default to Spanish and English
    const languageList = languages ? languages.split(",").map((l) => l.trim()) : ["es", "en"];

    // Search for subtitles (searches OpenSubtitles + Subdl in parallel)
    const allResults = await searchAnimeSubtitles(title, episode, {
      languages: languageList,
      seasonNumber: season,
      year,
    });

    // Get available languages for filtering
    const availableLanguages = getAvailableLanguages(allResults);

    // Apply language filter if specified
    const filteredResults = filterLanguage
      ? filterByLanguage(allResults, filterLanguage)
      : allResults;

    // Find best Spanish subtitle from all results
    const bestSpanish = getBestSpanishSubtitle(allResults);

    // Count results by source
    const sourceStats = {
      opensubtitles: allResults.filter((r) => r.source === "opensubtitles").length,
      subdl: allResults.filter((r) => r.source === "subdl").length,
    };

    return NextResponse.json({
      query: { title, episode, season, year, filterLanguage },
      totalResults: allResults.length,
      filteredCount: filteredResults.length,
      results: filteredResults.slice(0, 30), // Limit to 30 results
      bestSpanish,
      availableLanguages,
      sourceStats,
    });
  } catch (error) {
    console.error("External subtitles search error:", error);
    return NextResponse.json({ error: "Failed to search for subtitles" }, { status: 500 });
  }
}
