"use client";

import { useTranslations } from "next-intl";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import type { AnimeListResponse } from "@/lib/types";

interface SearchResultsProps {
  searchQuery: string;
  data: AnimeListResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

/**
 * Search results display with loading, error states
 */
export function SearchResults({
  searchQuery,
  data,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: SearchResultsProps) {
  const t = useTranslations();

  if (!searchQuery) {
    return (
      <p className="text-center text-muted-foreground">{t("search.noQuery")}</p>
    );
  }

  if (isLoading) {
    return <AnimeGridSkeleton />;
  }

  if (error) {
    return <ErrorBanner onRetry={onRetry} />;
  }

  if (!data) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          {t("search.resultsFor", { query: searchQuery })}
        </p>
      </div>

      {data.anime.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <>
          {/* Mobile top pagination */}
          <div className="md:hidden mb-4">
            <Pagination
              pagination={data.pagination}
              onPageChange={onPageChange}
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.anime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {/* Bottom pagination */}
          <Pagination pagination={data.pagination} onPageChange={onPageChange} />
        </>
      )}
    </>
  );
}
