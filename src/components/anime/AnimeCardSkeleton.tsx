"use client";

import { Skeleton, Card, CardContent, Grid } from "@/components/ds";

export function AnimeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Skeleton className="absolute inset-0" />
      </div>
      <CardContent className="p-3 h-32 flex flex-col">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-3 w-3/4" />
        <Skeleton className="mt-auto h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function AnimeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Grid cols={2} smCols={3} mdCols={4} lgCols={5} xlCols={6} gap={4}>
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </Grid>
  );
}

export function AnimeDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="shrink-0">
          <Skeleton className="h-[400px] w-[280px] rounded-lg" />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
