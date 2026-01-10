"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
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
      <p className="text-center text-muted-foreground">
        {emptyMessage || t("common.noResults")}
      </p>
    );
  }

  return (
    <>
      {header}
      
      {/* Mobile top pagination */}
      {pagination && onPageChange && (
        <div className="md:hidden mb-4">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            compact
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {children}
      </div>

      {/* Bottom pagination */}
      {pagination && onPageChange && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </>
  );
}
