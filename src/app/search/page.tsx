"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchForm, SearchResults } from "@/components/search";
import { browseAnimeList, getTopSearchQueries } from "@/lib/api";
import type { BrowseAnimeParams } from "@/lib/api";
import {
  Button,
  Typography,
  Flex,
  Stack,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ds";
import { X } from "lucide-react";

// Types for filters
type FormatFilter = "ALL" | "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";
type SeasonFilter = "ALL" | "WINTER" | "SPRING" | "SUMMER" | "FALL";
type StatusFilter = "ALL" | "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
type SortOption =
  | "POPULARITY_DESC"
  | "TRENDING_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC"
  | "TITLE_ROMAJI";

interface SearchFilters {
  format: FormatFilter;
  season: SeasonFilter;
  year: number | "ALL";
  status: StatusFilter;
  sort: SortOption;
}

const DEFAULT_FILTERS: SearchFilters = {
  format: "ALL",
  season: "ALL",
  year: "ALL",
  status: "ALL",
  sort: "POPULARITY_DESC",
};

const FORMATS: FormatFilter[] = [
  "ALL",
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
];
const SEASONS: SeasonFilter[] = ["ALL", "WINTER", "SPRING", "SUMMER", "FALL"];
const STATUSES: StatusFilter[] = [
  "ALL",
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];
const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "POPULARITY_DESC", labelKey: "filters.sortPopularity" },
  { value: "TRENDING_DESC", labelKey: "filters.sortTrending" },
  { value: "SCORE_DESC", labelKey: "filters.sortScore" },
  { value: "START_DATE_DESC", labelKey: "filters.sortRelease" },
  { value: "TITLE_ROMAJI", labelKey: "filters.sortTitle" },
];

function getDefaultYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
}

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const years = useMemo(() => getDefaultYears(), []);

  // Build API params from filters
  const apiParams = useMemo((): BrowseAnimeParams => {
    const params: BrowseAnimeParams = {
      page,
      perPage: 50,
      sort: filters.sort,
    };

    if (searchQuery) params.search = searchQuery;
    if (filters.format !== "ALL") params.format = filters.format;
    if (filters.season !== "ALL") params.season = filters.season;
    if (filters.year !== "ALL") params.seasonYear = filters.year;
    if (filters.status !== "ALL") params.status = filters.status;

    return params;
  }, [page, searchQuery, filters]);

  // Main browse query - always fetches from AniList
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["anime-browse", apiParams],
    queryFn: () => browseAnimeList(apiParams),
  });

  // Top search queries for suggestions
  const { data: topSearches } = useQuery({
    queryKey: ["top-search-queries"],
    queryFn: () => getTopSearchQueries(30),
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    setSearchQuery(trimmed);
    setPage(1);
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }, [query, router]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (newPage > 1) params.set("page", String(newPage));
      router.push(`/search${params.toString() ? `?${params}` : ""}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchQuery, router]
  );

  const handleSelectSuggestion = useCallback(
    (q: string) => {
      setQuery(q);
      setSearchQuery(q);
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router]
  );

  const handleFilterChange = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1); // Reset to first page when filters change
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.format !== "ALL") count++;
    if (filters.season !== "ALL") count++;
    if (filters.year !== "ALL") count++;
    if (filters.status !== "ALL") count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col">
      <PageHeader title={t("search.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        <Stack gap={6}>
          {/* Search input */}
          <SearchForm value={query} onChange={setQuery} onSubmit={handleSearch} />

          {/* Filters row */}
          <Flex gap={2} wrap="wrap" align="center">
            {/* Format filter */}
            <Select
              value={filters.format}
              onValueChange={(value) => handleFilterChange("format", value as FormatFilter)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("filters.format")} />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format === "ALL" ? t("filters.allFormats") : t(`filters.formats.${format}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Season filter */}
            <Select
              value={filters.season}
              onValueChange={(value) => handleFilterChange("season", value as SeasonFilter)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("filters.season")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filters.allSeasons")}</SelectItem>
                {SEASONS.filter((s) => s !== "ALL").map((season) => (
                  <SelectItem key={season} value={season}>
                    {t(`calendar.${season}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year filter */}
            <Select
              value={String(filters.year)}
              onValueChange={(value) =>
                handleFilterChange("year", value === "ALL" ? "ALL" : parseInt(value, 10))
              }
            >
              <SelectTrigger className="w-28">
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

            {/* Status filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value as StatusFilter)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? t("filters.allStatuses") : t(`filters.statuses.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange("sort", value as SortOption)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filters.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
                <X className="h-4 w-4" />
                {t("filters.clear")} ({activeFiltersCount})
              </Button>
            )}
          </Flex>

          {/* Top searches (only show when not actively searching) */}
          {!searchQuery && topSearches?.queries?.length ? (
            <TopQueriesCarousel
              label={t("search.topQueries")}
              queries={topSearches.queries}
              onSelect={handleSelectSuggestion}
            />
          ) : null}

          {/* Results */}
          <SearchResults
            searchQuery={searchQuery}
            data={data}
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            onPageChange={handlePageChange}
            showNoQueryMessage={false}
          />
        </Stack>
      </div>
    </div>
  );
}

function TopQueriesCarousel({
  label,
  queries,
  onSelect,
}: {
  label: string;
  queries: string[];
  onSelect: (q: string) => void;
}) {
  const slides = useMemo(() => {
    const limited = queries.slice(0, 30);
    const chunkSize = 6;
    const chunks: string[][] = [];
    for (let i = 0; i < limited.length; i += chunkSize) {
      chunks.push(limited.slice(i, i + chunkSize));
    }
    return chunks;
  }, [queries]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (next: number) => {
    if (!slides.length) return;
    setIndex((next + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Typography variant="body2" colorScheme="secondary">
          {label}
        </Typography>
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => goTo(index - 1)}>
              {"<"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => goTo(index + 1)}>
              {">"}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card/50 relative overflow-hidden rounded-lg border">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)`, width: `${slides.length * 100}%` }}
        >
          {slides.map((slide, slideIdx) => (
            <div key={slideIdx} className="w-full shrink-0 basis-full px-4 py-3">
              <Flex wrap="wrap" gap={2}>
                {slide.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(q)}
                    className="truncate"
                  >
                    {q}
                  </Button>
                ))}
              </Flex>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              aria-label={`Slide ${dotIdx + 1}`}
              onClick={() => goTo(dotIdx)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${dotIdx === index ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
