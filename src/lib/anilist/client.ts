// Server-only AniList GraphQL client
import type { AniListMedia, MediaSeason, PaginationInfo } from "@/lib/types";

const ANILIST_API = process.env.ANILIST_API || "";

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
