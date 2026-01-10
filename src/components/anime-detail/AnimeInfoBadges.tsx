"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { MediaFormat, MediaStatus, MediaSeason } from "@/lib/types";

interface AnimeInfoBadgesProps {
  format?: MediaFormat | null;
  status?: MediaStatus | null;
  episodes?: number | null;
  season?: MediaSeason | null;
  seasonYear?: number | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  isAdult?: boolean | null;
}

/**
 * Info badges showing format, status, episodes, season, dates
 */
export function AnimeInfoBadges({
  format,
  status,
  episodes,
  season,
  seasonYear,
  startDate,
  isAdult,
}: AnimeInfoBadgesProps) {
  const t = useTranslations();

  // Format start date
  const formattedStartDate = startDate && startDate.year
    ? new Date(startDate.year, (startDate.month || 1) - 1, startDate.day || 1)
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      {format && <Badge>{t(`format.${format}`)}</Badge>}
      {status && <Badge variant="secondary">{t(`status.${status}`)}</Badge>}
      {episodes && (
        <Badge variant="outline">{t("anime.episodes", { count: episodes })}</Badge>
      )}
      {season && seasonYear && (
        <Badge variant="outline">
          {t(`calendar.${season}`)} {seasonYear}
        </Badge>
      )}
      {formattedStartDate && (
        <Badge variant="outline">
          <Calendar className="mr-1 h-3 w-3" />
          {formattedStartDate.toLocaleDateString()}
        </Badge>
      )}
      {isAdult && <Badge variant="destructive">{t("anime.adult")}</Badge>}
    </div>
  );
}
