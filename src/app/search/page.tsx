"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { searchAnime } from "@/lib/api";

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["anime-search", searchQuery, page],
    queryFn: () => searchAnime(searchQuery, page),
    enabled: !!searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&page=${newPage}`);
    // Scroll to top when changing pages
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setShowScrollTop(rect.top < -100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col" ref={containerRef}>
      <PageHeader title={t("search.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <Input
          type="text"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" disabled={!query.trim()}>
          <SearchIcon className="mr-2 h-4 w-4" />
          {t("common.search")}
        </Button>
      </form>

      {/* Results */}
      {!searchQuery && (
        <p className="text-center text-muted-foreground">{t("search.noQuery")}</p>
      )}

      {searchQuery && isLoading && <AnimeGridSkeleton />}

      {searchQuery && error && (
        <ErrorBanner onRetry={() => refetch()} />
      )}

      {searchQuery && data && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {t("search.resultsFor", { query: searchQuery })}
            </p>
            {showScrollTop && (
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToTop}
                className="md:hidden gap-2"
              >
                <ArrowUp className="h-4 w-4" />
                {t("common.topPage")}
              </Button>
            )}
          </div>

          {data.anime.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("common.noResults")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.anime.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
              <Pagination
                pagination={data.pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}
