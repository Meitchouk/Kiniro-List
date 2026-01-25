"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ds";

interface SeasonPageSkeletonProps {
  title: string;
  showHeader?: boolean;
}

/**
 * Mobile skeleton card - horizontal compact layout
 */
function MobileSkeletonCard() {
  return (
    <div className="bg-card flex overflow-hidden rounded-xl border shadow">
      {/* Cover skeleton */}
      <div className="bg-muted h-28 w-20 shrink-0 animate-pulse" />
      {/* Content skeleton */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop skeleton card - vertical poster layout
 */
function DesktopSkeletonCard() {
  return (
    <div className="bg-card w-full overflow-hidden rounded-xl border shadow">
      <div className="bg-muted relative aspect-3/4 w-full animate-pulse" />
      <div className="h-32 space-y-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-auto h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Mobile skeleton list
 */
function MobileSkeletonList({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <MobileSkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Desktop skeleton grid
 */
function DesktopSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="hidden md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <DesktopSkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Combined responsive skeleton
 */
function ResponsiveSkeleton() {
  return (
    <>
      <MobileSkeletonList count={8} />
      <DesktopSkeletonGrid count={12} />
    </>
  );
}

export function SeasonPageSkeleton({ title, showHeader = true }: SeasonPageSkeletonProps) {
  if (showHeader) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ResponsiveSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h3 className="mb-6 text-xl font-semibold">{title}</h3>
      <ResponsiveSkeleton />
    </div>
  );
}
