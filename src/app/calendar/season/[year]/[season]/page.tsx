"use client";

import { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { getSeason } from "@/lib/api";
import type { MediaSeason } from "@/lib/types";

export default function SeasonPage({ 
  params 
}: { 
  params: Promise<{ year: string; season: string }> 
}) {
  const { year: yearStr, season: seasonStr } = use(params);
  const t = useTranslations();
  const [page, setPage] = useState(1);

  const year = parseInt(yearStr, 10);
  const season = seasonStr.toUpperCase() as MediaSeason;

  const validSeasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const isValidSeason = validSeasons.includes(season);
  const isValidYear = !isNaN(year) && year >= 1970 && year <= 2100;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-season", year, season, page],
    queryFn: () => getSeason(year, season, page),
    enabled: isValidSeason && isValidYear,
  });

  if (!isValidSeason || !isValidYear) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBanner message={t("errors.notFound")} />
      </div>
    );
  }

  const title = t("calendar.season", {
    season: t(`calendar.${season}`),
    year,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{title}</h1>
        <AnimeGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{title}</h1>
        <ErrorBanner onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>

      {data && data.anime.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data?.anime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
          {data && (
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
