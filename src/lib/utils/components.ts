/**
 * Utility functions for components
 */

import type { AiringStatusLabel } from "@/lib/types";
import { AIRING_STATUS_VARIANTS } from "@/lib/constants/components";
import type { BadgeVariant } from "@/lib/types/components";

/**
 * Get the appropriate badge variant for an airing status
 */
export function getAiringBadgeVariant(statusLabel: AiringStatusLabel): BadgeVariant {
  return (AIRING_STATUS_VARIANTS[statusLabel] || AIRING_STATUS_VARIANTS.unknown) as BadgeVariant;
}

/**
 * Get translated label text for airing status
 */
export function getAiringLabelText(
  statusLabel: AiringStatusLabel,
  countdown: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  formatCountdown: (seconds: number) => string
): string {
  switch (statusLabel) {
    case "airs_today":
      return t("airing.airs_today");
    case "airs_in":
      return t("airing.airs_in", { time: formatCountdown(countdown) });
    case "aired":
      return t("airing.aired");
    default:
      return t("airing.unknown");
  }
}
