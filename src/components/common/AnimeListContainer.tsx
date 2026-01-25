"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Typography, Grid } from "@/components/ds";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { MobileAnimeList, MobileAnimeListSkeleton } from "@/components/anime/MobileAnimeList";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import type { PaginationInfo, AnimeCache } from "@/lib/types";

interface AnimeListContainerProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyMessage?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  children: ReactNode;
  header?: ReactNode;
  /** Anime data for mobile list - if provided, renders optimized mobile view */
  anime?: AnimeCache[];
}

/**
 * Reusable container for anime lists with loading, error, empty states and pagination
 */
export function AnimeListContainer({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyMessage,
  pagination,
  onPageChange,
  children,
  header,
  anime,
}: AnimeListContainerProps) {
  const t = useTranslations();
  const hasMobileOptimization = !!anime;

  if (isLoading) {
    return (
      <>
        {hasMobileOptimization && <MobileAnimeListSkeleton />}
        <AnimeGridSkeleton className={hasMobileOptimization ? "hidden md:grid" : undefined} />
      </>
    );
  }

  if (error) {
    return <ErrorBanner onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <Typography variant="body1" colorScheme="secondary" align="center">
        {emptyMessage || t("common.noResults")}
      </Typography>
    );
  }

  return (
    <>
      {header}

      {/* Mobile top pagination */}
      {pagination && onPageChange && (
        <div className="mb-4 md:hidden">
          <Pagination pagination={pagination} onPageChange={onPageChange} compact />
        </div>
      )}

      {/* Mobile list view (when anime prop is provided) */}
      {hasMobileOptimization && <MobileAnimeList anime={anime} />}

      {/* Desktop grid view (or all views when no mobile optimization) */}
      <Grid
        cols={2}
        mdCols={3}
        lgCols={4}
        xlCols={5}
        xxlCols={6}
        gap={4}
        className={hasMobileOptimization ? "hidden md:grid" : undefined}
      >
        {children}
      </Grid>

      {/* Bottom pagination */}
      {pagination && onPageChange && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </>
  );
}
