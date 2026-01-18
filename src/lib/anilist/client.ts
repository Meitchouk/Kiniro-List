// Server-only AniList GraphQL client
import type { AniListMedia, MediaSeason, PaginationInfo } from "@/lib/types";
import { anilist } from "@/lib/config";

const ANILIST_API = anilist.apiUrl;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface PageInfo {
  currentPage: number;
  hasNextPage: boolean;
  lastPage: number;
  perPage: number;
  total: number;
}

async function fetchAniList<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// ============ Search Query ============

const SEARCH_QUERY = `
query ($search: String!, $page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      lastPage
      perPage
      total
    }
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description
      genres
      season
      seasonYear
      status
      episodes
      format
      isAdult
      siteUrl
      externalLinks {
        id
        url
        site
        type
        icon
      }
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
    }
  }
}
`;

interface SearchResponse {
  Page: {
    pageInfo: PageInfo;
    media: AniListMedia[];
  };
}

export async function searchAnime(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<{ media: AniListMedia[]; pageInfo: PaginationInfo }> {
  const data = await fetchAniList<SearchResponse>(SEARCH_QUERY, {
    search: query,
    page,
    perPage,
  });

  return {
    media: data.Page.media,
    pageInfo: data.Page.pageInfo,
  };
}

// ============ Media Detail Query ============

const MEDIA_DETAIL_QUERY = `
query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
    }
    bannerImage
    description
    genres
    season
    seasonYear
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    status
    episodes
    duration
    format
    isAdult
    siteUrl
    averageScore
    meanScore
    popularity
    favourites
    source
    hashtag
    studios {
      nodes {
        id
        name
        isAnimationStudio
      }
    }
    externalLinks {
      id
      url
      site
      type
      language
      color
      icon
    }
    streamingEpisodes {
      title
      thumbnail
      url
      site
    }
    trailer {
      id
      site
      thumbnail
    }
    tags {
      id
      name
      rank
      isMediaSpoiler
    }
    relations {
      edges {
        node {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          format
          type
        }
        relationType
      }
    }
    recommendations {
      nodes {
        mediaRecommendation {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          format
          averageScore
        }
      }
    }
    nextAiringEpisode {
      airingAt
      episode
      timeUntilAiring
    }
  }
}
`;

interface MediaDetailResponse {
  Media: AniListMedia;
}

export async function getAnimeById(id: number): Promise<AniListMedia> {
  const data = await fetchAniList<MediaDetailResponse>(MEDIA_DETAIL_QUERY, { id });
  return data.Media;
}

// ============ Season Query ============

const SEASON_QUERY = `
query ($season: MediaSeason!, $seasonYear: Int!, $page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      lastPage
      perPage
      total
    }
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description
      genres
      season
      seasonYear
      status
      episodes
      format
      isAdult
      siteUrl
      externalLinks {
        id
        url
        site
        type
        icon
      }
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
    }
  }
}
`;

interface SeasonResponse {
  Page: {
    pageInfo: PageInfo;
    media: AniListMedia[];
  };
}

export async function getSeasonAnime(
  season: MediaSeason,
  seasonYear: number,
  page: number = 1,
  perPage: number = 20
): Promise<{ media: AniListMedia[]; pageInfo: PaginationInfo }> {
  const data = await fetchAniList<SeasonResponse>(SEASON_QUERY, {
    season,
    seasonYear,
    page,
    perPage,
  });

  return {
    media: data.Page.media,
    pageInfo: data.Page.pageInfo,
  };
}

/**
 * Fetches ALL anime from a season by iterating through all pages.
 * Use this when you want to cache all data and do pagination locally.
 * AniList allows up to 50 items per page.
 */
export async function getAllSeasonAnime(
  season: MediaSeason,
  seasonYear: number
): Promise<AniListMedia[]> {
  const allMedia: AniListMedia[] = [];
  let page = 1;
  let hasNextPage = true;
  const perPage = 50; // Max allowed by AniList

  while (hasNextPage) {
    const data = await fetchAniList<SeasonResponse>(SEASON_QUERY, {
      season,
      seasonYear,
      page,
      perPage,
    });

    allMedia.push(...data.Page.media);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page++;

    // Safety limit to prevent infinite loops
    if (page > 20) break;
  }

  return allMedia;
}

/**
 * Paginates an array locally and returns reliable pagination info.
 */
export function paginateLocally<T>(
  items: T[],
  page: number,
  perPage: number
): { items: T[]; pageInfo: PaginationInfo } {
  const total = items.length;
  const lastPage = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(1, page), lastPage || 1);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  return {
    items: items.slice(start, end),
    pageInfo: {
      currentPage,
      hasNextPage: currentPage < lastPage,
      lastPage,
      perPage,
      total,
    },
  };
}

// ============ Weekly Schedule Query ============

const WEEKLY_SCHEDULE_QUERY = `
query ($page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      lastPage
      perPage
      total
    }
    media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description
      genres
      season
      seasonYear
      status
      episodes
      format
      isAdult
      siteUrl
      externalLinks {
        id
        url
        site
        type
        icon
      }
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
    }
  }
}
`;

export async function getReleasingAnime(
  page: number = 1,
  perPage: number = 50
): Promise<{ media: AniListMedia[]; pageInfo: PaginationInfo }> {
  const data = await fetchAniList<SeasonResponse>(WEEKLY_SCHEDULE_QUERY, {
    page,
    perPage,
  });

  return {
    media: data.Page.media,
    pageInfo: data.Page.pageInfo,
  };
}

// ============ Batch Anime Info Query ============

const BATCH_ANIME_QUERY = `
query ($ids: [Int]!) {
  Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description
      genres
      season
      seasonYear
      status
      episodes
      format
      isAdult
      siteUrl
      externalLinks {
        id
        url
        site
        type
        icon
      }
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
    }
  }
}
`;

interface BatchAnimeResponse {
  Page: {
    media: AniListMedia[];
  };
}

export async function getBatchAnimeInfo(ids: number[]): Promise<AniListMedia[]> {
  if (ids.length === 0) {
    return [];
  }

  // Split into batches of 50
  const batches: number[][] = [];
  for (let i = 0; i < ids.length; i += 50) {
    batches.push(ids.slice(i, i + 50));
  }

  const results: AniListMedia[] = [];

  for (const batch of batches) {
    const data = await fetchAniList<BatchAnimeResponse>(BATCH_ANIME_QUERY, {
      ids: batch,
    });
    results.push(...data.Page.media);
  }

  return results;
}

// ============ Batch Next Airing Query ============

const BATCH_AIRING_QUERY = `
query ($ids: [Int]!) {
  Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
    }
  }
}
`;

interface BatchAiringResponse {
  Page: {
    media: Array<{
      id: number;
      nextAiringEpisode: {
        airingAt: number;
        episode: number;
        timeUntilAiring: number;
      } | null;
    }>;
  };
}

export async function getBatchAiringInfo(
  ids: number[]
): Promise<Map<number, { airingAt: number; episode: number } | null>> {
  if (ids.length === 0) {
    return new Map();
  }

  // Split into batches of 50
  const batches: number[][] = [];
  for (let i = 0; i < ids.length; i += 50) {
    batches.push(ids.slice(i, i + 50));
  }

  const results = new Map<number, { airingAt: number; episode: number } | null>();

  for (const batch of batches) {
    const data = await fetchAniList<BatchAiringResponse>(BATCH_AIRING_QUERY, {
      ids: batch,
    });

    for (const media of data.Page.media) {
      if (media.nextAiringEpisode) {
        results.set(media.id, {
          airingAt: media.nextAiringEpisode.airingAt,
          episode: media.nextAiringEpisode.episode,
        });
      } else {
        results.set(media.id, null);
      }
    }
  }

  return results;
}

// ============ Global Popular Query ============

const GLOBAL_POPULAR_QUERY = `
  query ($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
        perPage
        total
      }
      media(type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        bannerImage
        description
        genres
        season
        seasonYear
        status
        episodes
        format
        isAdult
        siteUrl
        externalLinks {
          id
          url
          site
          type
          icon
        }
        nextAiringEpisode {
          airingAt
          episode
          timeUntilAiring
        }
        popularity
      }
    }
  }
  `;

interface GlobalPopularResponse {
  Page: {
    pageInfo: PageInfo;
    media: AniListMedia[];
  };
}

export async function getGlobalPopularAnime(perPage: number = 50): Promise<AniListMedia[]> {
  const data = await fetchAniList<GlobalPopularResponse>(GLOBAL_POPULAR_QUERY, {
    page: 1,
    perPage,
  });

  return data.Page.media;
}

// ============ Batch Airing Schedule Query ============

/**
 * Query to get airing schedule for multiple anime within a time range.
 * This fetches past aired episodes from AniList.
 */
const BATCH_AIRING_SCHEDULE_QUERY = `
query ($mediaId_in: [Int], $airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      lastPage
    }
    airingSchedules(mediaId_in: $mediaId_in, airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME_DESC) {
      id
      mediaId
      airingAt
      episode
    }
  }
}
`;

interface AiringScheduleResponse {
  Page: {
    pageInfo: {
      currentPage: number;
      hasNextPage: boolean;
      lastPage: number;
    };
    airingSchedules: Array<{
      id: number;
      mediaId: number;
      airingAt: number;
      episode: number;
    }>;
  };
}

export interface AiredEpisodeInfo {
  mediaId: number;
  episode: number;
  airingAt: number;
}

/**
 * Fetches past aired episodes for multiple anime IDs within a time range.
 * @param animeIds - List of anime IDs to fetch airing history for
 * @param fromTimestamp - Start of time range (Unix timestamp in seconds)
 * @param toTimestamp - End of time range (Unix timestamp in seconds)
 * @returns Map of anime ID to array of aired episodes
 */
export async function getBatchAiringSchedule(
  animeIds: number[],
  fromTimestamp: number,
  toTimestamp: number
): Promise<Map<number, AiredEpisodeInfo[]>> {
  if (animeIds.length === 0) {
    return new Map();
  }

  const results = new Map<number, AiredEpisodeInfo[]>();

  // Initialize empty arrays for all requested IDs
  for (const id of animeIds) {
    results.set(id, []);
  }

  // AniList has a limit on query complexity, batch by 50 anime IDs
  const batches: number[][] = [];
  for (let i = 0; i < animeIds.length; i += 50) {
    batches.push(animeIds.slice(i, i + 50));
  }

  for (const batch of batches) {
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(
        `[getBatchAiringSchedule] Querying page ${page} for ${batch.length} anime, range: ${fromTimestamp}-${toTimestamp}`
      );

      const data = await fetchAniList<AiringScheduleResponse>(BATCH_AIRING_SCHEDULE_QUERY, {
        mediaId_in: batch,
        airingAt_greater: fromTimestamp,
        airingAt_lesser: toTimestamp,
        page,
        perPage: 50,
      });

      console.log(`[getBatchAiringSchedule] Got ${data.Page.airingSchedules.length} results`);

      for (const schedule of data.Page.airingSchedules) {
        const existing = results.get(schedule.mediaId) || [];
        existing.push({
          mediaId: schedule.mediaId,
          episode: schedule.episode,
          airingAt: schedule.airingAt,
        });
        results.set(schedule.mediaId, existing);
      }

      hasNextPage = data.Page.pageInfo.hasNextPage;
      page++;

      // Safety limit
      if (page > 10) break;
    }
  }

  return results;
}
