"use client";

import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";

interface SeasonPageSkeletonProps {
  title: string;
  showHeader?: boolean;
}

export function SeasonPageSkeleton({ title, showHeader = true }: SeasonPageSkeletonProps) {
  if (showHeader) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <AnimeGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      <AnimeGridSkeleton />
    </div>
  );
}
