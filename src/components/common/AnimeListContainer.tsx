"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Typography, Grid } from "@/components/ds";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import type { PaginationInfo } from "@/lib/types";

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
}: AnimeListContainerProps) {
  const t = useTranslations();

  if (isLoading) {
    return <AnimeGridSkeleton />;
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

      <Grid cols={2} smCols={3} mdCols={4} lgCols={5} xlCols={6} gap={4}>
        {children}
      </Grid>

      {/* Bottom pagination */}
      {pagination && onPageChange && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </>
  );
}
