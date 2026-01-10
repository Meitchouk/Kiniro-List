"use client";

import type { ReactNode } from "react";
import { Skeleton, Container } from "@/components/ds";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";

interface PageContainerProps {
  title: string;
  showBack?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingSkeleton?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable page container with header, loading and error states
 */
export function PageContainer({
  title,
  showBack = true,
  isLoading = false,
  error = null,
  onRetry,
  loadingSkeleton,
  children,
}: PageContainerProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={showBack} />
        <Container className="py-8">
          {loadingSkeleton || (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={title} showBack={showBack} />
        <Container className="py-8">
          <ErrorBanner onRetry={onRetry} />
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={title} showBack={showBack} />
      <Container className="py-8">
        {children}
      </Container>
    </div>
  );
}
