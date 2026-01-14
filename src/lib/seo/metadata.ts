import type { Metadata, Viewport } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { siteConfig, defaultOpenGraph, defaultTwitter, type SupportedLocale } from "./config";

/**
 * Gets the current locale as a SupportedLocale type
 */
export async function getCurrentLocale(): Promise<SupportedLocale> {
  const locale = await getLocale();
  return siteConfig.locales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : (siteConfig.defaultLocale as SupportedLocale);
}

/**
 * Creates the base metadata for the application.
 * This should be used in the root layout.
 */
export async function createBaseMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const t = await getTranslations("seo");
  const description = t("home.description");
  const keywords = siteConfig.keywords[locale];
  const ogLocale = siteConfig.localeMap[locale];

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.creator,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      ...defaultOpenGraph,
      description,
      locale: ogLocale,
      title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
      },
    },
    twitter: {
      ...defaultTwitter,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: siteConfig.url,
      languages: {
        "en-US": siteConfig.url,
        "es-ES": `${siteConfig.url}/es`,
      },
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    category: "entertainment",
  };
}

/**
 * Default viewport configuration
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Creates metadata for a specific page using translation keys
 */
export async function createPageMetadataFromKey(
  seoKey: string,
  options?: {
    path?: string;
    image?: string;
    noIndex?: boolean;
    additionalKeywords?: string[];
  }
): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const t = await getTranslations("seo");

  const title = t(`${seoKey}.title`);
  const description = t(`${seoKey}.description`);
  const keywords = siteConfig.keywords[locale];
  const ogLocale = siteConfig.localeMap[locale];

  const { path = "", image, noIndex = false, additionalKeywords = [] } = options || {};
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title,
    description,
    keywords: additionalKeywords.length > 0 ? [...keywords, ...additionalKeywords] : keywords,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: siteConfig.creator,
    },
    alternates: {
      canonical: url,
      languages: {
        "en-US": `${siteConfig.url}${path}`,
        "es-ES": `${siteConfig.url}/es${path}`,
      },
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

/**
 * Creates metadata for a specific page with custom title and description
 */
export async function createPageMetadata(options: {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const { title, description, keywords, path = "", image, noIndex = false } = options;
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.ogImage;
  const baseKeywords = siteConfig.keywords[locale];
  const ogLocale = siteConfig.localeMap[locale];

  return {
    title,
    description,
    keywords: keywords ? [...baseKeywords, ...keywords] : baseKeywords,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: siteConfig.creator,
    },
    alternates: {
      canonical: url,
      languages: {
        "en-US": `${siteConfig.url}${path}`,
        "es-ES": `${siteConfig.url}/es${path}`,
      },
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

/**
 * Creates metadata for anime detail pages with dynamic data
 */
export async function createAnimeMetadata(options: {
  title: string;
  description: string;
  coverImage?: string;
  genres?: string[];
  slug: string;
}): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const { title, description, coverImage, genres = [], slug } = options;
  const pageTitle = `${title} - ${siteConfig.name}`;
  const url = `${siteConfig.url}/anime/${slug}`;
  const truncatedDesc = description.length > 160 ? `${description.slice(0, 157)}...` : description;
  const baseKeywords = siteConfig.keywords[locale];
  const ogLocale = siteConfig.localeMap[locale];

  return {
    title: pageTitle,
    description: truncatedDesc,
    keywords: [...baseKeywords, ...genres, title],
    openGraph: {
      title: pageTitle,
      description: truncatedDesc,
      url,
      siteName: siteConfig.name,
      images: coverImage
        ? [
            {
              url: coverImage,
              width: 460,
              height: 650,
              alt: title,
            },
          ]
        : [
            {
              url: siteConfig.ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
      locale: ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: truncatedDesc,
      images: coverImage ? [coverImage] : [siteConfig.ogImage],
      creator: siteConfig.creator,
    },
    alternates: {
      canonical: url,
      languages: {
        "en-US": `${siteConfig.url}/anime/${slug}`,
        "es-ES": `${siteConfig.url}/es/anime/${slug}`,
      },
    },
  };
}

/**
 * Creates metadata for season pages using translations
 */
export async function createSeasonMetadata(season: string, year: number): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const t = await getTranslations("seo");
  const seasonKey = season.toLowerCase() as "winter" | "spring" | "summer" | "fall";

  const title = t(`seasons.${seasonKey}`, { year });
  const description = t("calendarSeason.description", {
    season: t(`seasons.${seasonKey}`, { year }),
  });
  const path = `/calendar/season/${year}/${season.toLowerCase()}`;
  const baseKeywords = siteConfig.keywords[locale];
  const ogLocale = siteConfig.localeMap[locale];

  return {
    title,
    description,
    keywords: [...baseKeywords, season.toLowerCase(), `${year} anime`],
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
      creator: siteConfig.creator,
    },
    alternates: {
      canonical: `${siteConfig.url}${path}`,
      languages: {
        "en-US": `${siteConfig.url}${path}`,
        "es-ES": `${siteConfig.url}/es${path}`,
      },
    },
  };
}
