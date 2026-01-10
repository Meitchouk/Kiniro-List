"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { SeasonAnimeGrid, SeasonPageSkeleton } from "@/components/season";
import { useSeasonCalendar } from "@/lib/hooks/useSeasonCalendar";
import type { MediaSeason } from "@/lib/types";

const VALID_SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];

export default function SeasonPage({
  params,
}: {
  params: Promise<{ year: string; season: string }>;
}) {
  const { year: yearStr, season: seasonStr } = use(params);
  const t = useTranslations();

  const year = parseInt(yearStr, 10);
  const season = seasonStr.toUpperCase() as MediaSeason;

  const isValidSeason = VALID_SEASONS.includes(season);
  const isValidYear = !isNaN(year) && year >= 1970 && year <= 2100;
  const isValid = isValidSeason && isValidYear;

  const { data, isLoading, error, refetch, handlePageChange } = useSeasonCalendar({
    type: "specific",
    year,
    season,
    enabled: isValid,
  });

  const title = t("calendar.season", {
    season: t(`calendar.${season}`),
    year,
  });

  if (!isValid) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("errors.notFound")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner message={t("errors.notFound")} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <SeasonPageSkeleton title={title} />;
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={title} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        {data && (
          <SeasonAnimeGrid
            anime={data.anime}
            pagination={data.pagination}
            onPageChange={handlePageChange}
            showSeasonInfo={false}
          />
        )}
      </div>
    </div>
  );
}
