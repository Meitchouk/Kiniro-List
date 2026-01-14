import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Generates the robots.txt for the application.
 * Controls search engine crawler behavior.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/me/", "/_next/", "/private/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
