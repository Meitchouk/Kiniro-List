/**
 * Component-specific type definitions
 */

import type { AnimeCache, AiringStatusLabel, LibraryStatus, PaginationInfo } from "@/lib/types";

// ============ Anime Card Types ============

export interface AnimeCardProps {
  anime: AnimeCache;
  showBadges?: boolean;
}

// ============ Countdown Badge Types ============

export interface CountdownBadgeProps {
  statusLabel: AiringStatusLabel;
  secondsToAir?: number;
  nextEpisodeNumber?: number | null;
}

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

// ============ Library Status Select Types ============

export interface LibraryStatusSelectProps {
  value: LibraryStatus;
  onChange: (value: LibraryStatus) => void;
  disabled?: boolean;
}

// ============ Pagination Types ============

export interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  compact?: boolean;
}

// ============ Error Banner Types ============

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

// ============ Login Prompt Types ============

export interface LoginPromptProps {
  message?: string;
}
