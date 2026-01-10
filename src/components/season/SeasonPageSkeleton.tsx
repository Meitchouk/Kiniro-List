"use client";

import { Typography, Container, Stack } from "@/components/ds";
import { AnimeGridSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";

interface SeasonPageSkeletonProps {
  title: string;
  showHeader?: boolean;
}

export function SeasonPageSkeleton({ title, showHeader = true }: SeasonPageSkeletonProps) {
  if (showHeader) {
    return (
      <Stack>
        <PageHeader title={title} showBack={true} />
        <Container className="py-8">
          <AnimeGridSkeleton />
        </Container>
      </Stack>
    );
  }

  return (
    <Container className="py-8">
      <Typography variant="h3" className="mb-6">{title}</Typography>
      <AnimeGridSkeleton />
    </Container>
  );
}
