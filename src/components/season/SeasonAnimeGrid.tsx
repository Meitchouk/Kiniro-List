"use client";

import { useTranslations } from "next-intl";
import { Typography, Grid, Stack } from "@/components/ds";
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
    return <EmptyState title={t("common.noResults")} description={t("calendar.noAnimeInSeason")} />;
  }

  return (
    <Stack gap={4}>
      {/* Season info */}
      {showSeasonInfo && season && year && (
        <Typography variant="body2" colorScheme="secondary" className="mb-6">
          {t("calendar.season", {
            season: t(`calendar.${season}`),
            year,
          })}
        </Typography>
      )}

      {/* Mobile top pagination */}
      <div className="md:hidden">
        <Pagination pagination={pagination} onPageChange={onPageChange} compact />
      </div>

      {/* Anime grid */}
      <Grid cols={2} smCols={3} mdCols={4} lgCols={5} xlCols={6} gap={4}>
        {anime.map((item) => (
          <AnimeCard key={item.id} anime={item} />
        ))}
      </Grid>

      {/* Bottom pagination */}
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </Stack>
  );
}
