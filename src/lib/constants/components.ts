/**
 * Constants and configuration values for components
 */

import type { LibraryStatus, Locale } from "@/lib/types";

/**
 * Available library statuses for anime tracking
 */
export const LIBRARY_STATUSES: readonly LibraryStatus[] = [
  "watching",
  "planned",
  "completed",
  "paused",
  "dropped",
] as const;

/**
 * Available locales for the application
 */
export const LOCALES: readonly { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

/**
 * Badge variant mapping for airing status
 */
export const AIRING_STATUS_VARIANTS = {
  airs_today: "success",
  airs_in: "default",
  aired: "secondary",
  unknown: "outline",
} as const;
