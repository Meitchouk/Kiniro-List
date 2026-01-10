"use client";

import { useTranslations } from "next-intl";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Pagination } from "@/components/anime/Pagination";
import { EmptyState } from "@/components/common";
import type { AnimeCache, PaginationInfo, MediaSeason } from "@/lib/types";

interface SeasonAnimeGridProps {
  anime: AnimeCache[];
  pagination: PaginationInfo;
  season?: MediaSeason;
  year?: number;
  onPageChange: (page: number) => void;
  showSeasonInfo?: boolean;
}

export function SeasonAnimeGrid({
  anime,
  pagination,
  season,
  year,
  onPageChange,
  showSeasonInfo = true,
}: SeasonAnimeGridProps) {
  const t = useTranslations();

  if (anime.length === 0) {
    return (
      <EmptyState
        title={t("common.noResults")}
        description={t("calendar.noAnimeInSeason")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Season info */}
      {showSeasonInfo && season && year && (
        <p className="mb-6 text-muted-foreground">
          {t("calendar.season", {
            season: t(`calendar.${season}`),
            year,
          })}
        </p>
      )}

      {/* Mobile top pagination */}
      <div className="md:hidden">
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          compact
        />
      </div>

      {/* Anime grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {anime.map((item) => (
          <AnimeCard key={item.id} anime={item} />
        ))}
      </div>

      {/* Bottom pagination */}
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
