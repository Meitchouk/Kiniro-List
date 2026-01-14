import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Generates the sitemap.xml for the application.
 * Includes static routes and can be extended with dynamic routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const currentDate = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calendar/now`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calendar/upcoming`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/schedule/weekly`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Generate season routes for past years
  const seasonRoutes: MetadataRoute.Sitemap = [];
  const seasons = ["winter", "spring", "summer", "fall"];
  const currentYear = currentDate.getFullYear();

  // Generate routes for the last 5 years and next year
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    for (const season of seasons) {
      // Skip future seasons
      if (year === currentYear + 1 && seasons.indexOf(season) > 0) continue;

      seasonRoutes.push({
        url: `${baseUrl}/calendar/season/${year}/${season}`,
        lastModified: currentDate,
        changeFrequency: year === currentYear ? "weekly" : "monthly",
        priority: year === currentYear ? 0.7 : 0.5,
      });
    }
  }

  return [...staticRoutes, ...seasonRoutes];
}
