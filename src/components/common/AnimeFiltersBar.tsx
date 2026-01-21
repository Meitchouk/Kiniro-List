"use client";

import { useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Button,
  Flex,
  Input,
  Typography,
} from "@/components/ds";
import { X, ArrowUpDown, Search } from "lucide-react";
import type { MediaFormat, MediaSeason, MediaStatus } from "@/lib/types";

// ============ Types ============

export type SortOption =
  | "title_asc"
  | "title_desc"
  | "release_asc"
  | "release_desc"
  | "score_asc"
  | "score_desc"
  | "popularity_asc"
  | "popularity_desc"
  | "added_asc"
  | "added_desc";

export interface AnimeFilters {
  search?: string;
  format?: MediaFormat | "ALL";
  season?: MediaSeason | "ALL";
  year?: number | "ALL";
  status?: MediaStatus | "ALL";
  genres?: string[];
  sortBy?: SortOption;
}

export interface AnimeFiltersBarProps {
  filters: AnimeFilters;
  onFiltersChange: (filters: AnimeFilters) => void;
  showSearch?: boolean;
  showFormat?: boolean;
  showSeason?: boolean;
  showYear?: boolean;
  showStatus?: boolean;
  showGenres?: boolean;
  showSort?: boolean;
  availableGenres?: string[];
  availableYears?: number[];
  sortOptions?: { value: SortOption; label: string }[];
  className?: string;
}

// ============ Constants ============

const FORMATS: MediaFormat[] = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const SEASONS: MediaSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
const STATUSES: MediaStatus[] = [
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];

const SORT_OPTIONS: SortOption[] = [
  "title_asc",
  "title_desc",
  "release_desc",
  "release_asc",
  "score_desc",
  "score_asc",
  "popularity_desc",
  "popularity_asc",
  "added_desc",
  "added_asc",
];

// Default years: current year and 10 years back
function getDefaultYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
}

// ============ Component ============

/**
 * Unified filter bar component for anime lists
 * Can be used in library, calendar, and search pages
 */
export function AnimeFiltersBar({
  filters,
  onFiltersChange,
  showSearch = true,
  showFormat = true,
  showSeason = false,
  showYear = false,
  showStatus = false,
  showGenres = false,
  showSort = true,
  availableGenres = [],
  availableYears,
  sortOptions,
  className,
}: AnimeFiltersBarProps) {
  const t = useTranslations();

  const years = useMemo(() => availableYears || getDefaultYears(), [availableYears]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.format && filters.format !== "ALL") count++;
    if (filters.season && filters.season !== "ALL") count++;
    if (filters.year && filters.year !== "ALL") count++;
    if (filters.status && filters.status !== "ALL") count++;
    if (filters.genres && filters.genres.length > 0) count++;
    return count;
  }, [filters]);

  const handleChange = useCallback(
    <K extends keyof AnimeFilters>(key: K, value: AnimeFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      search: "",
      format: "ALL",
      season: "ALL",
      year: "ALL",
      status: "ALL",
      genres: [],
      sortBy: filters.sortBy, // Keep sort
    });
  }, [filters.sortBy, onFiltersChange]);

  const handleToggleGenre = useCallback(
    (genre: string) => {
      const currentGenres = filters.genres || [];
      const newGenres = currentGenres.includes(genre)
        ? currentGenres.filter((g) => g !== genre)
        : [...currentGenres, genre];
      handleChange("genres", newGenres);
    },
    [filters.genres, handleChange]
  );

  return (
    <div className={className}>
      <Flex direction="column" gap={3}>
        {/* Main filters row */}
        <Flex gap={2} wrap="wrap" align="center">
          {/* Search input */}
          {showSearch && (
            <div className="relative min-w-[200px] flex-1 md:max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={t("filters.searchPlaceholder")}
                value={filters.search || ""}
                onChange={(e) => handleChange("search", e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Format filter */}
          {showFormat && (
            <Select
              value={filters.format || "ALL"}
              onValueChange={(value) => handleChange("format", value as MediaFormat | "ALL")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("filters.format")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allFormats")}</SelectItem>
                {FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {t(`format.${format}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Season filter */}
          {showSeason && (
            <Select
              value={filters.season || "ALL"}
              onValueChange={(value) => handleChange("season", value as MediaSeason | "ALL")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("filters.season")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allSeasons")}</SelectItem>
                {SEASONS.map((season) => (
                  <SelectItem key={season} value={season}>
                    {t(`calendar.${season}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Year filter */}
          {showYear && (
            <Select
              value={String(filters.year || "ALL")}
              onValueChange={(value) =>
                handleChange("year", value === "ALL" ? "ALL" : parseInt(value, 10))
              }
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder={t("filters.year")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allYears")}</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          {showStatus && (
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value) => handleChange("status", value as MediaStatus | "ALL")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          {showSort && (
            <Select
              value={filters.sortBy || "release_desc"}
              onValueChange={(value) => handleChange("sortBy", value as SortOption)}
            >
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("filters.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions
                  ? sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  : SORT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`filters.sort.${option}`)}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear filters button */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
              <X className="h-4 w-4" />
              {t("filters.clear")}
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </Flex>

        {/* Genres row (if enabled and has genres) */}
        {showGenres && availableGenres.length > 0 && (
          <Flex gap={2} wrap="wrap" align="center">
            <Typography variant="caption" colorScheme="secondary" className="mr-1">
              {t("filters.genres")}:
            </Typography>
            {availableGenres.slice(0, 12).map((genre) => {
              const isSelected = filters.genres?.includes(genre);
              return (
                <Badge
                  key={genre}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => handleToggleGenre(genre)}
                >
                  {genre}
                </Badge>
              );
            })}
          </Flex>
        )}
      </Flex>
    </div>
  );
}

// ============ Filter utilities ============

/**
 * Apply filters to an array of anime items
 * Generic function that works with any anime-like object
 */
export function applyAnimeFilters<
  T extends {
    anime?: {
      title?: { english?: string | null; romaji?: string | null };
      format?: string | null;
      season?: string | null;
      seasonYear?: number | null;
      status?: string | null;
      genres?: string[] | null;
      averageScore?: number | null;
      popularity?: number | null;
    };
    addedAt?: Date | string;
  },
>(items: T[], filters: AnimeFilters): T[] {
  let result = [...items];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter((item) => {
      const title =
        item.anime?.title?.english?.toLowerCase() || item.anime?.title?.romaji?.toLowerCase() || "";
      return title.includes(searchLower);
    });
  }

  // Format filter
  if (filters.format && filters.format !== "ALL") {
    result = result.filter((item) => item.anime?.format === filters.format);
  }

  // Season filter
  if (filters.season && filters.season !== "ALL") {
    result = result.filter((item) => item.anime?.season === filters.season);
  }

  // Year filter
  if (filters.year && filters.year !== "ALL") {
    result = result.filter((item) => item.anime?.seasonYear === filters.year);
  }

  // Status filter
  if (filters.status && filters.status !== "ALL") {
    result = result.filter((item) => item.anime?.status === filters.status);
  }

  // Genres filter
  if (filters.genres && filters.genres.length > 0) {
    result = result.filter((item) => {
      const itemGenres = item.anime?.genres || [];
      return filters.genres!.every((genre) => itemGenres.includes(genre));
    });
  }

  // Sorting
  if (filters.sortBy) {
    result = sortAnimeItems(result, filters.sortBy);
  }

  return result;
}

/**
 * Sort anime items by the specified option
 */
function sortAnimeItems<
  T extends {
    anime?: {
      title?: { english?: string | null; romaji?: string | null };
      seasonYear?: number | null;
      averageScore?: number | null;
      popularity?: number | null;
    };
    addedAt?: Date | string;
  },
>(items: T[], sortBy: SortOption): T[] {
  return items.sort((a, b) => {
    switch (sortBy) {
      case "title_asc":
        return (a.anime?.title?.english || a.anime?.title?.romaji || "").localeCompare(
          b.anime?.title?.english || b.anime?.title?.romaji || ""
        );
      case "title_desc":
        return (b.anime?.title?.english || b.anime?.title?.romaji || "").localeCompare(
          a.anime?.title?.english || a.anime?.title?.romaji || ""
        );
      case "release_asc":
        return (a.anime?.seasonYear || 0) - (b.anime?.seasonYear || 0);
      case "release_desc":
        return (b.anime?.seasonYear || 0) - (a.anime?.seasonYear || 0);
      case "score_asc":
        return (a.anime?.averageScore || 0) - (b.anime?.averageScore || 0);
      case "score_desc":
        return (b.anime?.averageScore || 0) - (a.anime?.averageScore || 0);
      case "popularity_asc":
        return (a.anime?.popularity || 0) - (b.anime?.popularity || 0);
      case "popularity_desc":
        return (b.anime?.popularity || 0) - (a.anime?.popularity || 0);
      case "added_asc":
        return new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime();
      case "added_desc":
        return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
      default:
        return 0;
    }
  });
}

export { FORMATS, SEASONS, STATUSES, SORT_OPTIONS };
