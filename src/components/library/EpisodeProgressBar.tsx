"use client";

import { useTranslations } from "next-intl";
import { Typography, Flex } from "@/components/ds";
import { cn } from "@/lib/utils";

interface EpisodeProgressBarProps {
  current: number;
  total?: number | null;
  compact?: boolean;
  className?: string;
}

/**
 * Visual progress bar showing episode progress
 * Displays "EP X / Y" or "EP X / ?" if total is unknown
 */
export function EpisodeProgressBar({
  current,
  total,
  compact = false,
  className,
}: EpisodeProgressBarProps) {
  const t = useTranslations();

  const percentage = total && total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const displayTotal = total ?? "?";
  const isComplete = total && current >= total;

  return (
    <Flex direction="column" gap={1} className={cn("w-full", className)}>
      {/* Progress text */}
      <Flex align="center" justify="between" className="min-w-0">
        <Typography
          variant={compact ? "caption" : "body2"}
          weight="medium"
          className={cn("shrink-0", isComplete && "text-green-600 dark:text-green-400")}
        >
          {t("library.episode")} {current} / {displayTotal}
        </Typography>
        {total && (
          <Typography variant="caption" colorScheme="secondary" className="ml-2 shrink-0">
            {Math.round(percentage)}%
          </Typography>
        )}
      </Flex>

      {/* Progress bar */}
      {total && (
        <div
          className={cn(
            "bg-muted relative overflow-hidden rounded-full",
            compact ? "h-1.5" : "h-2"
          )}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={t("library.episodesWatched", { current, total })}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              isComplete ? "bg-green-500 dark:bg-green-400" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </Flex>
  );
}
