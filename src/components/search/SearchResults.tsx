"use client";

import { useTranslations } from "next-intl";
import { Typography, Flex, Grid, Stack } from "@/components/ds";
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
      <Typography variant="body2" colorScheme="secondary" align="center">
        {t("search.noQuery")}
      </Typography>
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
    <Stack gap={4}>
      <Flex align="center" justify="between">
        <Typography variant="body2" colorScheme="secondary">
          {t("search.resultsFor", { query: searchQuery })}
        </Typography>
      </Flex>

      {data.anime.length === 0 ? (
        <Typography variant="body2" colorScheme="secondary" align="center">
          {t("common.noResults")}
        </Typography>
      ) : (
        <>
          {/* Mobile top pagination */}
          <div className="mb-4 md:hidden">
            <Pagination pagination={data.pagination} onPageChange={onPageChange} compact />
          </div>

          <Grid cols={2} smCols={3} mdCols={4} lgCols={5} xlCols={6} gap={4}>
            {data.anime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </Grid>

          {/* Bottom pagination */}
          <Pagination pagination={data.pagination} onPageChange={onPageChange} />
        </>
      )}
    </Stack>
  );
}
