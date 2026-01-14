/**
 * Centralized SEO configuration for Kiniro List.
 * All SEO-related constants and base configuration should be defined here.
 */

export const siteConfig = {
  name: "Kiniro List",
  shortName: "Kiniro",
  url: "https://kinirolist.app",
  ogImage: "https://kinirolist.app/og-image.png",
  defaultLocale: "en",
  locales: ["en", "es"] as const,
  localeMap: {
    en: "en_US",
    es: "es_ES",
  } as const,
  creator: "@kinirolist",
  keywords: {
    en: [
      "anime",
      "anime tracker",
      "anime calendar",
      "anime schedule",
      "anime list",
      "watchlist",
      "seasonal anime",
      "airing anime",
      "anime database",
      "myanimelist alternative",
      "anilist",
    ] as string[],
    es: [
      "anime",
      "seguimiento de anime",
      "calendario de anime",
      "horario de anime",
      "lista de anime",
      "watchlist",
      "anime de temporada",
      "anime en emisión",
      "base de datos de anime",
      "alternativa a myanimelist",
      "anilist",
    ] as string[],
  },
  links: {
    github: "https://github.com/kinirolist",
  },
};

export type SupportedLocale = (typeof siteConfig.locales)[number];

export const defaultOpenGraph = {
  type: "website" as const,
  url: siteConfig.url,
  siteName: siteConfig.name,
  images: [
    {
      url: siteConfig.ogImage,
      width: 1200,
      height: 630,
      alt: siteConfig.name,
    },
  ],
};

export const defaultTwitter = {
  card: "summary_large_image" as const,
  images: [siteConfig.ogImage],
  creator: siteConfig.creator,
};

/**
 * Structured data types for JSON-LD
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  sameAs: [siteConfig.links.github],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
