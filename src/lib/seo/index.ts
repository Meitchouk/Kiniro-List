/**
 * SEO module exports
 *
 * Centralized SEO utilities for Kiniro List.
 * Import from '@/lib/seo' for all SEO-related functionality.
 */

// Configuration
export { siteConfig, defaultOpenGraph, defaultTwitter, type SupportedLocale } from "./config";

// Metadata helpers
export {
  createBaseMetadata,
  createPageMetadata,
  createPageMetadataFromKey,
  createAnimeMetadata,
  createSeasonMetadata,
  getCurrentLocale,
  viewport,
} from "./metadata";

// Structured data (JSON-LD)
export {
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateAnimeJsonLd,
  generateAnimeListJsonLd,
  generateCollectionPageJsonLd,
  generateSearchResultsJsonLd,
} from "./structured-data";
