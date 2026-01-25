"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Typography, Grid, Stack } from "@/components/ds";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { MobileAnimeList } from "@/components/anime/MobileAnimeList";
import { Pagination } from "@/components/anime/Pagination";
import { EmptyState, AnimeFiltersBar } from "@/components/common";
import type { AnimeFilters } from "@/components/common";
import type { AnimeCache, PaginationInfo, MediaSeason } from "@/lib/types";

const DEFAULT_FILTERS: AnimeFilters = {
  search: "",
  format: "ALL",
  status: "ALL",
  sortBy: "popularity_desc",
};

interface SeasonAnimeGridProps {
  anime: AnimeCache[];
  pagination: PaginationInfo;
  season?: MediaSeason;
  year?: number;
  onPageChange: (page: number) => void;
  showSeasonInfo?: boolean;
  showFilters?: boolean;
}

export function SeasonAnimeGrid({
  anime,
  pagination,
  season,
  year,
  onPageChange,
  showSeasonInfo = true,
  showFilters = true,
}: SeasonAnimeGridProps) {
  const t = useTranslations();
  const [filters, setFilters] = useState<AnimeFilters>(DEFAULT_FILTERS);

  // Apply client-side filters
  const filteredAnime = useMemo(() => {
    let result = [...anime];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.romaji?.toLowerCase().includes(searchLower) ||
          a.title?.english?.toLowerCase().includes(searchLower) ||
          a.title?.native?.toLowerCase().includes(searchLower)
      );
    }

    // Apply format filter
    if (filters.format && filters.format !== "ALL") {
      result = result.filter((a) => a.format === filters.format);
    }

    // Apply status filter
    if (filters.status && filters.status !== "ALL") {
      result = result.filter((a) => a.status === filters.status);
    }

    // Apply sorting
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split("_") as [string, "asc" | "desc"];
      result.sort((a, b) => {
        let cmp = 0;
        switch (field) {
          case "title":
            cmp = (a.title?.romaji || "").localeCompare(b.title?.romaji || "");
            break;
          case "release":
            cmp = (b.seasonYear || 0) - (a.seasonYear || 0);
            break;
          default:
            return 0;
        }
        return direction === "asc" ? -cmp : cmp;
      });
    }

    return result;
  }, [anime, filters]);

  const isFiltering = filters.search || filters.format !== "ALL" || filters.status !== "ALL";

  if (anime.length === 0) {
    return <EmptyState title={t("common.noResults")} description={t("calendar.noAnimeInSeason")} />;
  }

  return (
    <Stack gap={4}>
      {/* Season info */}
      {showSeasonInfo && season && year && (
        <Typography variant="body2" colorScheme="secondary">
          {t("calendar.season", {
            season: t(`calendar.${season}`),
            year,
          })}
        </Typography>
      )}

      {/* Filters */}
      {showFilters && (
        <AnimeFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          showSearch={true}
          showFormat={true}
          showSeason={false}
          showYear={false}
          showStatus={true}
          showGenres={false}
          showSort={true}
          sortOptions={[
            { value: "release_desc", label: t("filters.sortRelease") },
            { value: "title_asc", label: t("filters.sortTitle") },
          ]}
        />
      )}

      {/* Mobile top pagination */}
      {!isFiltering && (
        <div className="md:hidden">
          <Pagination pagination={pagination} onPageChange={onPageChange} compact />
        </div>
      )}

      {/* Empty state after filtering */}
      {filteredAnime.length === 0 && isFiltering ? (
        <EmptyState
          title={t("common.noResultsFound")}
          description={t("common.tryAdjustingFilters")}
        />
      ) : (
        <>
          {/* Mobile list view - compact horizontal cards */}
          <MobileAnimeList anime={filteredAnime} />

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
            {filteredAnime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </Grid>

          {/* Bottom pagination - hide when filtering locally */}
          {!isFiltering && <Pagination pagination={pagination} onPageChange={onPageChange} />}
        </>
      )}
    </Stack>
  );
}
