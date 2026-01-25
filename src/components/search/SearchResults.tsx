"use client";

import { useTranslations } from "next-intl";
import { Typography, Flex, Grid, Stack } from "@/components/ds";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { MobileAnimeList, MobileAnimeListSkeleton } from "@/components/anime/MobileAnimeList";
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
  showNoQueryMessage?: boolean;
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
  showNoQueryMessage = true,
}: SearchResultsProps) {
  const t = useTranslations();

  if (!searchQuery && showNoQueryMessage) {
    return (
      <Typography variant="body2" colorScheme="secondary" align="center">
        {t("search.noQuery")}
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <>
        <MobileAnimeListSkeleton />
        <AnimeGridSkeleton className="hidden md:grid" />
      </>
    );
  }

  if (error) {
    return <ErrorBanner onRetry={onRetry} />;
  }

  if (!data) return null;

  return (
    <Stack gap={4}>
      {searchQuery && (
        <Flex align="center" justify="between">
          <Typography variant="body2" colorScheme="secondary">
            {t("search.resultsFor", { query: searchQuery })}
          </Typography>
        </Flex>
      )}

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

          {/* Mobile list view */}
          <MobileAnimeList anime={data.anime} />

          {/* Desktop grid view */}
          <Grid
            cols={2}
            mdCols={3}
            lgCols={4}
            xlCols={5}
            xxlCols={6}
            gap={4}
            className="hidden md:grid"
          >
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
