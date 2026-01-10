"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchForm, SearchResults } from "@/components/search";
import { searchAnime } from "@/lib/api";

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

  return (
    <div className="flex flex-col">
      <PageHeader title={t("search.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        <SearchForm
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          className="mb-8"
        />

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
