"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationProps } from "@/lib/types";

export function Pagination({ 
  pagination, 
  onPageChange, 
  compact = false 
}: PaginationProps) {
  const t = useTranslations("pagination");

  const { currentPage, hasNextPage, lastPage, total } = pagination;
  const hasPrevPage = currentPage > 1;
  const canGoFirst = currentPage > 1;
  const canGoLast = lastPage > 0 && currentPage < lastPage;

  // Don't show pagination if we're on page 1 and there's no next page
  if (currentPage === 1 && !hasNextPage) return null;

  if (compact) {
    // Compact mobile version for top of page
    return (
      <div className="flex items-center justify-between gap-2 py-3">
        <div className="flex gap-1">
          {canGoFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              title={t("first")}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {lastPage > 0 
            ? t("page", { current: currentPage, total: lastPage })
            : t("pageSimple", { current: currentPage })
          }
          {total > 0 && <span className="text-xs ml-1">({total})</span>}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {canGoLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(lastPage)}
              title={t("last")}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-6 md:py-8">
      {/* Mobile-friendly full-width buttons */}
      <div className="flex gap-2 md:hidden">
        {canGoFirst && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            title={t("first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          {t("next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {canGoLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(lastPage)}
            title={t("last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop centered layout */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {canGoFirst && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            title={t("first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("previous")}
        </Button>

        <span className="text-sm text-muted-foreground px-2">
          {lastPage > 0 
            ? t("page", { current: currentPage, total: lastPage })
            : t("pageSimple", { current: currentPage })
          }
          {total > 0 && <span className="text-xs ml-1">({total} {t("items")})</span>}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          {t("next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {canGoLast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(lastPage)}
            title={t("last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile page indicator */}
      <div className="md:hidden text-center text-xs text-muted-foreground">
        {lastPage > 0 
          ? t("page", { current: currentPage, total: lastPage })
          : t("pageSimple", { current: currentPage })
        }
        {total > 0 && <span className="ml-1">({total})</span>}
      </div>
    </div>
  );
}
