"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { getUpcomingSeason } from "@/lib/api";

export default function CalendarUpcomingPage() {
  const t = useTranslations();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-upcoming", page],
    queryFn: () => getUpcomingSeason(page),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("calendar.upcoming")}</h1>
        <AnimeGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("calendar.upcoming")}</h1>
        <ErrorBanner onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">{t("calendar.upcoming")}</h1>
      {data && (
        <p className="mb-6 text-muted-foreground">
          {t("calendar.season", {
            season: t(`calendar.${data.season}`),
            year: data.year,
          })}
        </p>
      )}

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
