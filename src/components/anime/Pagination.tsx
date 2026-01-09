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
    <div className="flex items-center justify-center gap-4 py-8">
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
  );
}
