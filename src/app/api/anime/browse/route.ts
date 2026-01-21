import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { browseAnime } from "@/lib/anilist/client";
import type { BrowseAnimeFilters, MediaSort } from "@/lib/anilist/client";
import { upsertManyAnimeCache, getManyAnimeFromCache } from "@/lib/firestore/cache";
import { getOrSetJSON } from "@/lib/redis/cache";
import { z } from "zod";
import type { AniListMedia, AnimeListResponse } from "@/lib/types";

const browseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(50),
  sort: z.string().optional().default("POPULARITY_DESC"),
  search: z.string().optional(),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  seasonYear: z.coerce.number().int().min(1900).max(2100).optional(),
  format: z.enum(["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]).optional(),
  status: z.enum(["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"]).optional(),
  genres: z.string().optional(), // Comma-separated list
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "search");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const parseResult = browseQuerySchema.safeParse({
      page: searchParams.get("page") || "1",
      perPage: searchParams.get("perPage") || "50",
      sort: searchParams.get("sort") || "POPULARITY_DESC",
      search: searchParams.get("search") || undefined,
      season: searchParams.get("season") || undefined,
      seasonYear: searchParams.get("seasonYear") || undefined,
      format: searchParams.get("format") || undefined,
      status: searchParams.get("status") || undefined,
      genres: searchParams.get("genres") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { page, perPage, sort, search, season, seasonYear, format, status, genres } =
      parseResult.data;

    // Build filters object
    const filters: BrowseAnimeFilters = {
      isAdult: false,
    };
    if (search) filters.search = search;
    if (season) filters.season = season;
    if (seasonYear) filters.seasonYear = seasonYear;
    if (format) filters.format = format;
    if (status) filters.status = status;
    if (genres) filters.genres = genres.split(",").map((g) => g.trim());

    // Parse sort options
    const sortOptions = sort.split(",").map((s) => s.trim()) as MediaSort[];

    // Build cache key
    const cacheKey = `cache:browse:${JSON.stringify({ page, perPage, sort, ...filters })}`;

    // Fetch from AniList with caching (cache for 5 minutes)
    const result = await getOrSetJSON<{
      media: AniListMedia[];
      pageInfo: {
        currentPage: number;
        hasNextPage: boolean;
        lastPage: number;
        perPage: number;
        total: number;
      };
    }>(cacheKey, 300, () => browseAnime(page, perPage, sortOptions, filters));

    // Cache anime in Firestore
    if (result.media.length > 0) {
      await upsertManyAnimeCache(result.media);
    }

    // Get from cache to ensure consistent format
    const ids = result.media.map((m) => m.id);
    const cached = await getManyAnimeFromCache(ids);
    const anime = ids.map((id) => cached.get(id)).filter((a) => a !== undefined);

    const response: AnimeListResponse = {
      anime,
      pagination: {
        currentPage: result.pageInfo.currentPage,
        hasNextPage: result.pageInfo.hasNextPage,
        lastPage: result.pageInfo.lastPage,
        perPage: result.pageInfo.perPage,
        total: result.pageInfo.total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Browse anime error:", error);
    return NextResponse.json({ error: "Failed to browse anime" }, { status: 500 });
  }
}
