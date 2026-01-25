"use client";

import Image, { ImageProps } from "next/image";

/**
 * Hostnames that already serve optimized images from their CDN
 * These don't need Vercel's image optimization
 */
const OPTIMIZED_CDN_HOSTS = [
  "s4.anilist.co", // AniList CDN - already serves optimized WebP images
  "i.ytimg.com", // YouTube thumbnails - already optimized
];

/**
 * Check if a URL is from a CDN that already serves optimized images
 */
function isFromOptimizedCDN(src: string): boolean {
  try {
    const url = new URL(src);
    return OPTIMIZED_CDN_HOSTS.some((host) => url.hostname === host);
  } catch {
    // Not a valid URL (local path), needs optimization
    return false;
  }
}

export interface OptimizedImageProps extends Omit<ImageProps, "unoptimized"> {
  /**
   * Force optimization even for CDN images (not recommended)
   */
  forceOptimize?: boolean;
}

/**
 * Smart image component that skips Vercel optimization for images
 * that are already served from optimized CDNs (like AniList).
 *
 * This helps reduce Vercel's image optimization usage on the free tier.
 *
 * - AniList images: Already WebP, properly sized → skip optimization
 * - YouTube thumbnails: Already optimized → skip optimization
 * - Local images: Need optimization → use Vercel
 * - Google user avatars: Need optimization → use Vercel
 */
export function OptimizedImage({ src, alt, forceOptimize = false, ...props }: OptimizedImageProps) {
  const srcString = typeof src === "string" ? src : "";

  // Determine if we should skip Vercel optimization
  const shouldSkipOptimization = !forceOptimize && srcString && isFromOptimizedCDN(srcString);

  // For CDN images, we can also hint the browser about format support
  const extraProps = shouldSkipOptimization
    ? {
        unoptimized: true,
        // Add loading="lazy" for non-priority images (already default in Next.js Image)
      }
    : {};

  return <Image src={src} alt={alt} {...props} {...extraProps} />;
}

/**
 * Utility to get the best AniList image size based on display size
 * AniList provides: small (100px), medium (200px), large (400px), extraLarge (500px+)
 */
export function getOptimalAniListImage(
  coverImage: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  },
  displaySize: "small" | "medium" | "large" = "large"
): string {
  switch (displaySize) {
    case "small":
      // For thumbnails < 100px
      return coverImage.medium || coverImage.large || coverImage.extraLarge || "/placeholder.png";
    case "medium":
      // For cards 100-300px
      return coverImage.large || coverImage.extraLarge || coverImage.medium || "/placeholder.png";
    case "large":
      // For hero images, detail pages
      return coverImage.extraLarge || coverImage.large || "/placeholder.png";
    default:
      return coverImage.large || coverImage.extraLarge || "/placeholder.png";
  }
}
