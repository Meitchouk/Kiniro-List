'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorBanner } from '@/components/anime/ErrorBanner';
import { LibraryTabs } from '@/components/library';
import { useLibrary } from '@/lib/hooks/useLibrary';

export default function LibraryPage() {
  const t = useTranslations();

  const {
    items,
    isLoading,
    error,
    updateMutation,
    deleteMutation,
    handleStatusChange,
    handleRemove,
  } = useLibrary();

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t('library.title')} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t('library.title')} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner message={t('errors.generic')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t('library.title')} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('library.empty')}</p>
              <Link href="/search">
                <Button className="mt-4">{t('library.browseAnime')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <LibraryTabs
            items={items}
            onStatusChange={handleStatusChange}
            onRemove={handleRemove}
            isUpdating={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
