"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationInfo } from "@/lib/types";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const t = useTranslations("pagination");

  const { currentPage, hasNextPage, lastPage } = pagination;
  const hasPrevPage = currentPage > 1;

  if (lastPage <= 1) return null;

  return (
    <div className="flex flex-col gap-4 py-6 md:py-8">
      {/* Mobile-friendly full-width buttons */}
      <div className="flex gap-2 md:hidden">
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
      </div>

      {/* Desktop centered layout */}
      <div className="hidden md:flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("previous")}
        </Button>

        <span className="text-sm text-muted-foreground">
          {t("page", { current: currentPage, total: lastPage })}
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
      </div>

      {/* Mobile page indicator */}
      <div className="md:hidden text-center text-xs text-muted-foreground">
        {t("page", { current: currentPage, total: lastPage })}
      </div>
    </div>
  );
}
