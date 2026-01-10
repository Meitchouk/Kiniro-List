"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { getCurrentSeason } from "@/lib/api";

export default function CalendarNowPage() {
  const t = useTranslations();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-now", page],
    queryFn: () => getCurrentSeason(page),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("calendar.now")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <AnimeGridSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("calendar.now")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("calendar.now")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
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
          {/* Mobile top pagination */}
          {data && (
            <div className="md:hidden mb-4">
              <Pagination
                pagination={data.pagination}
                onPageChange={handlePageChange}
                compact
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data?.anime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
          {data && (
            <Pagination 
              pagination={data.pagination} 
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
      </div>
    </div>
  );
}
