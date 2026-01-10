'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getMyCalendar, setAuthHeadersGetter } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorBanner } from '@/components/anime/ErrorBanner';
import { CountdownBadge } from '@/components/anime/CountdownBadge';
import { Calendar, Clock, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import type { CalendarAnimeItem } from '@/lib/types';

export default function MyCalendarPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => getCurrentUser(),
    enabled: !!user,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-calendar'],
    queryFn: () => getMyCalendar(),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update countdowns
  });

  const timezone = userData?.timezone || DateTime.local().zoneName || 'UTC';

  const groupedItems = useMemo(() => {
    if (!data?.items) return {};

    const items = data.items;
    const grouped: Record<string, CalendarAnimeItem[]> = {};

    items.forEach((item) => {
      if (!item.nextAiringAt) {
        if (!grouped['unknown']) grouped['unknown'] = [];
        grouped['unknown'].push(item);
        return;
      }

      const dt = DateTime.fromISO(item.nextAiringAt).setZone(timezone);
      const dateKey = dt.toFormat('yyyy-MM-dd');
      
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    // Sort each group by air time
    Object.keys(grouped).forEach((key) => {
      if (key !== 'unknown') {
        grouped[key].sort((a, b) => {
          const aTime = a.nextAiringAt ? new Date(a.nextAiringAt).getTime() : 0;
          const bTime = b.nextAiringAt ? new Date(b.nextAiringAt).getTime() : 0;
          return aTime - bTime;
        });
      }
    });

    return grouped;
  }, [data?.items, timezone]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems)
      .filter((key) => key !== 'unknown')
      .sort((a, b) => a.localeCompare(b));
  }, [groupedItems]);

  const formatDateHeader = (dateKey: string) => {
    const dt = DateTime.fromISO(dateKey).setZone(timezone);
    const today = DateTime.now().setZone(timezone).startOf('day');
    const tomorrow = today.plus({ days: 1 });
    const itemDate = dt.startOf('day');

    if (itemDate.equals(today)) {
      return t('calendar.today');
    } else if (itemDate.equals(tomorrow)) {
      return t('calendar.tomorrow');
    }
    
    return dt.toFormat('EEEE, MMMM d');
  };

  const formatAirTime = (isoTime: string) => {
    return DateTime.fromISO(isoTime).setZone(timezone).toFormat('HH:mm');
  };

  const getStatusVariant = (statusLabel: string) => {
    switch (statusLabel) {
      case 'airs_today':
        return 'default';
      case 'airs_in':
        return 'secondary';
      case 'aired':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t('myCalendar.title')} showBack={true} />
        <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-24" />
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t('myCalendar.title')} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner message={t('errors.generic')} onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  const hasItems = data?.items && data.items.length > 0;

  return (
    <div className="flex flex-col">
      <PageHeader title={t('myCalendar.title')} showBack={true} />
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('nav.myCalendar')}</h1>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {timezone}
        </Badge>
      </div>

      {!hasItems ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t('calendar.empty')}</p>
            <Link href="/me/library">
              <Button>{t('calendar.goToLibrary')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatDateHeader(dateKey)}
              </h2>
              <div className="space-y-3">
                {groupedItems[dateKey].map((item) => (
                  <Card key={item.anime.id} className="overflow-hidden">
                    <div className="flex">
                      <Link href={`/anime/${item.anime.id}`} className="shrink-0">
                        <div className="relative w-20 h-28">
                          {item.anime?.coverImage?.large ? (
                            <Image
                              src={item.anime.coverImage.large}
                              alt={item.anime?.title?.english || item.anime?.title?.romaji || 'Anime'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                      </Link>
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/anime/${item.anime.id}`}>
                              <h3 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                                {item.anime?.title?.english || item.anime?.title?.romaji}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {item.nextAiringAt && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatAirTime(item.nextAiringAt)}
                                </span>
                              )}
                              {item.nextEpisodeNumber && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  {t('anime.episode')} {item.nextEpisodeNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={getStatusVariant(item.statusLabel)}>
                              {t(`calendar.${item.statusLabel}`)}
                            </Badge>
                            {item.secondsToAir && item.secondsToAir > 0 && (
                              <CountdownBadge 
                                statusLabel={item.statusLabel}
                                secondsToAir={item.secondsToAir} 
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {groupedItems['unknown'] && groupedItems['unknown'].length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                {t('calendar.unknown')}
              </h2>
              <div className="space-y-3">
                {groupedItems['unknown'].map((item) => (
                  <Card key={item.anime.id} className="overflow-hidden opacity-60">
                    <div className="flex">
                      <Link href={`/anime/${item.anime.id}`} className="shrink-0">
                        <div className="relative w-20 h-28">
                          {item.anime?.coverImage?.large ? (
                            <Image
                              src={item.anime.coverImage.large}
                              alt={item.anime?.title?.english || item.anime?.title?.romaji || 'Anime'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                      </Link>
                      <CardContent className="flex-1 p-3">
                        <Link href={`/anime/${item.anime.id}`}>
                          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                            {item.anime?.title?.english || item.anime?.title?.romaji}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('calendar.noAiringInfo')}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}      </div>    </div>
  );
}
