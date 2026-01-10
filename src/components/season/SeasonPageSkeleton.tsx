"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ds";

interface SeasonPageSkeletonProps {
  title: string;
  showHeader?: boolean;
}

function SkeletonCard() {
  return (
    <div className="w-full rounded-xl border bg-card shadow overflow-hidden">
      <div className="relative aspect-[3/4] w-full bg-muted animate-pulse" />
      <div className="p-3 h-32 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2 mt-auto" />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SeasonPageSkeleton({ title, showHeader = true }: SeasonPageSkeletonProps) {
  if (showHeader) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <SkeletonGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h3 className="text-xl font-semibold mb-6">{title}</h3>
      <SkeletonGrid />
    </div>
  );
}
