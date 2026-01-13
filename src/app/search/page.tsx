"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchForm, SearchResults } from "@/components/search";
import { searchAnime, getTopSearchQueries } from "@/lib/api";
import { Button, Typography, Flex } from "@/components/ds";

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["anime-search", searchQuery, page],
    queryFn: () => searchAnime(searchQuery, page),
    enabled: !!searchQuery,
  });

  const { data: topSearches } = useQuery({
    queryKey: ["top-search-queries"],
    queryFn: () => getTopSearchQueries(30),
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = () => {
    if (query.trim()) {
      setSearchQuery(query.trim());
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&page=${newPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectSuggestion = (q: string) => {
    setQuery(q);
    setSearchQuery(q);
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex flex-col">
      <PageHeader title={t("search.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        <SearchForm value={query} onChange={setQuery} onSubmit={handleSearch} className="mb-6" />

        {topSearches?.queries?.length ? (
          <TopQueriesCarousel
            label={t("search.topQueries")}
            queries={topSearches.queries}
            onSelect={handleSelectSuggestion}
          />
        ) : null}

        <SearchResults
          searchQuery={searchQuery}
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onPageChange={handlePageChange}
        />
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

  return (
    <div className="mb-8">
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
