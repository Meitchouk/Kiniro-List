import { siteConfig, organizationSchema, websiteSchema } from "./config";

/**
 * Generates JSON-LD structured data for the website
 */
export function generateWebsiteJsonLd(): string {
  return JSON.stringify(websiteSchema);
}

/**
 * Generates JSON-LD structured data for the organization
 */
export function generateOrganizationJsonLd(): string {
  return JSON.stringify(organizationSchema);
}

/**
 * Generates JSON-LD BreadcrumbList for navigation
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): string {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };

  return JSON.stringify(breadcrumbList);
}

/**
 * Generates JSON-LD TVSeries/Anime structured data
 */
export function generateAnimeJsonLd(anime: {
  title: string;
  description?: string;
  coverImage?: string;
  genres?: string[];
  averageScore?: number;
  episodes?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
  studios?: string[];
  slug: string;
}): string {
  const tvSeries = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: anime.title,
    description: anime.description || undefined,
    image: anime.coverImage || undefined,
    genre: anime.genres?.length ? anime.genres : undefined,
    aggregateRating: anime.averageScore
      ? {
          "@type": "AggregateRating",
          ratingValue: anime.averageScore / 10,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    numberOfEpisodes: anime.episodes || undefined,
    productionCompany: anime.studios?.map((studio) => ({
      "@type": "Organization",
      name: studio,
    })),
    url: `${siteConfig.url}/anime/${anime.slug}`,
    inLanguage: "ja",
    countryOfOrigin: {
      "@type": "Country",
      name: "Japan",
    },
  };

  // Remove undefined values
  const cleanedData = JSON.parse(JSON.stringify(tvSeries));
  return JSON.stringify(cleanedData);
}

/**
 * Generates JSON-LD ItemList for anime lists (carousels, grids, etc.)
 */
export function generateAnimeListJsonLd(
  items: Array<{ title: string; slug: string; coverImage?: string }>,
  listName: string
): string {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TVSeries",
        name: item.title,
        url: `${siteConfig.url}/anime/${item.slug}`,
        image: item.coverImage || undefined,
      },
    })),
  };

  return JSON.stringify(itemList);
}

/**
 * Generates JSON-LD CollectionPage for season/calendar pages
 */
export function generateCollectionPageJsonLd(options: {
  name: string;
  description: string;
  url: string;
  items?: Array<{ title: string; slug: string }>;
}): string {
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: options.url.startsWith("http") ? options.url : `${siteConfig.url}${options.url}`,
    mainEntity: options.items?.length
      ? {
          "@type": "ItemList",
          numberOfItems: options.items.length,
          itemListElement: options.items.slice(0, 20).map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteConfig.url}/anime/${item.slug}`,
            name: item.title,
          })),
        }
      : undefined,
  };

  const cleanedData = JSON.parse(JSON.stringify(collectionPage));
  return JSON.stringify(cleanedData);
}

/**
 * Generates JSON-LD SearchResultsPage
 */
export function generateSearchResultsJsonLd(
  query: string,
  results: Array<{ title: string; slug: string }>
): string {
  const searchResults = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: `Search results for "${query}"`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: results.length,
      itemListElement: results.slice(0, 20).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.url}/anime/${item.slug}`,
        name: item.title,
      })),
    },
  };

  return JSON.stringify(searchResults);
}
