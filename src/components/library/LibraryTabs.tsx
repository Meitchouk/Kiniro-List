"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
} from "@/components/ds";
import { LibraryItemCard } from "./LibraryItemCard";
import { AnimeFiltersBar, applyAnimeFilters } from "@/components/common";
import type { AnimeFilters } from "@/components/common";
import type { LibraryStatus, LibraryEntryWithAnime } from "@/lib/types";

const STATUSES: LibraryStatus[] = ["watching", "planned", "completed", "paused", "dropped"];

const DEFAULT_FILTERS: AnimeFilters = {
  search: "",
  format: "ALL",
  sortBy: "added_desc",
};

interface LibraryTabsProps {
  items: LibraryEntryWithAnime[];
  onStatusChange: (animeId: number, status: LibraryStatus) => void;
  onRemove: (animeId: number) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  defaultStatus?: LibraryStatus;
}

/**
 * Tabbed library view with status filters and sorting
 */
export function LibraryTabs({
  items,
  onStatusChange,
  onRemove,
  isUpdating = false,
  isDeleting = false,
  defaultStatus = "watching",
}: LibraryTabsProps) {
  const t = useTranslations();
  const [filters, setFilters] = useState<AnimeFilters>(DEFAULT_FILTERS);

  // Get unique genres from all items
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    items.forEach((item) => {
      item.anime?.genres?.forEach((g) => genresSet.add(g));
    });
    return Array.from(genresSet).sort();
  }, [items]);

  // Apply filters to items for each status
  const getFilteredItemsByStatus = (status: string) => {
    const statusItems = items.filter((item) => item.status === status);
    return applyAnimeFilters(statusItems, filters);
  };

  // Count items per status (unfiltered for tab badges)
  const getItemCountByStatus = (status: string) =>
    items.filter((item) => item.status === status).length;

  return (
    <Stack gap={4}>
      {/* Filters */}
      <AnimeFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        showSearch={true}
        showFormat={true}
        showSeason={false}
        showYear={false}
        showStatus={false}
        showGenres={availableGenres.length > 0}
        showSort={true}
        availableGenres={availableGenres}
      />

      <Tabs defaultValue={defaultStatus}>
        <TabsList className="mb-6 h-auto flex-wrap gap-2 bg-transparent p-0">
          {STATUSES.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted border-border gap-2 rounded-md border px-4 py-2"
            >
              {t(`library.${status}`)}
              <Badge variant="secondary" className="ml-1">
                {getItemCountByStatus(status)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((status) => {
          const filteredItems = getFilteredItemsByStatus(status);
          const totalItems = getItemCountByStatus(status);

          return (
            <TabsContent key={status} value={status}>
              {totalItems === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Typography variant="body2" colorScheme="secondary">
                      {t("library.emptyStatus", { status: t(`library.${status}`) })}
                    </Typography>
                  </CardContent>
                </Card>
              ) : filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Typography variant="body2" colorScheme="secondary">
                      {t("common.noResultsFound")}
                    </Typography>
                    <Typography variant="caption" colorScheme="secondary" className="mt-1">
                      {t("common.tryAdjustingFilters")}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid cols={1} mdCols={2} lgCols={3} gap={4}>
                  {filteredItems.map((item) => (
                    <LibraryItemCard
                      key={item.animeId}
                      item={item}
                      onStatusChange={onStatusChange}
                      onRemove={onRemove}
                      isUpdating={isUpdating}
                      isDeleting={isDeleting}
                    />
                  ))}
                </Grid>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </Stack>
  );
}
