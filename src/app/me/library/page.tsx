'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBanner } from '@/components/anime/ErrorBanner';
import { LibraryStatusSelect } from '@/components/anime/LibraryStatusSelect';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getLibrary, upsertLibraryEntry, deleteLibraryEntry, setAuthHeadersGetter } from '@/lib/api';
import type { LibraryStatus, LibraryEntryWithAnime } from '@/lib/types';

export default function LibraryPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['library'],
    queryFn: () => getLibrary(),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (params: { animeId: number; status: LibraryStatus }) =>
      upsertLibraryEntry(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success(t('library.updated'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (animeId: number) =>
      deleteLibraryEntry(animeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast.success(t('library.removed'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const handleStatusChange = (animeId: number, status: LibraryStatus) => {
    updateMutation.mutate({ animeId, status });
  };

  const handleRemove = (animeId: number) => {
    deleteMutation.mutate(animeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBanner message={t('errors.generic')} />
      </div>
    );
  }

  const items = data?.items || data?.entries || [];
  const statuses: LibraryStatus[] = ['watching', 'planned', 'completed', 'paused', 'dropped'];

  const getItemsByStatus = (status: string) =>
    items.filter((item) => item.status === status);

  const renderLibraryItem = (item: LibraryEntryWithAnime) => (
    <Card key={item.animeId} className="overflow-hidden">
      <div className="flex">
        <Link href={`/anime/${item.animeId}`} className="shrink-0">
          <div className="relative w-24 h-32">
            {item.anime?.coverImage?.large ? (
              <Image
                src={item.anime.coverImage.large}
                alt={item.anime?.title?.english || item.anime?.title?.romaji || 'Anime'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">No image</span>
              </div>
            )}
          </div>
        </Link>
        <CardContent className="flex-1 p-3">
          <Link href={`/anime/${item.animeId}`}>
            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
              {item.anime?.title?.english || item.anime?.title?.romaji || `Anime #${item.animeId}`}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 mb-2">
            {item.anime?.format && (
              <Badge variant="outline" className="text-xs">
                {item.anime.format}
              </Badge>
            )}
            {item.anime?.episodes && (
              <span className="text-xs text-muted-foreground">
                {item.anime.episodes} {t('anime.episodes', { count: item.anime.episodes })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LibraryStatusSelect
              value={item.status as LibraryStatus}
              onChange={(status) => handleStatusChange(item.animeId, status)}
              disabled={updateMutation.isPending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleRemove(item.animeId)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('library.title')}</h1>

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
        <Tabs defaultValue="watching">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            {statuses.map((status) => (
              <TabsTrigger key={status} value={status} className="gap-2">
                {t(`library.${status}`)}
                <Badge variant="secondary" className="ml-1">
                  {getItemsByStatus(status).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {statuses.map((status) => (
            <TabsContent key={status} value={status}>
              {getItemsByStatus(status).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {t('library.emptyStatus', { status: t(`library.${status}`) })}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getItemsByStatus(status).map(renderLibraryItem)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
