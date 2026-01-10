"use client";

import { Skeleton, Container, Stack, Grid } from "@/components/ds";

export function ProfileSkeleton() {
  return (
    <Container className="py-8">
      <Stack className="max-w-2xl mx-auto" gap={6}>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Grid cols={1} smCols={3} gap={4}>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Grid>
      </Stack>
    </Container>
  );
}
