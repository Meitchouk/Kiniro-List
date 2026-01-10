'use client';

import Link from 'next/link';
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
import { CalendarList } from '@/components/calendar';
import { Calendar, Clock } from 'lucide-react';
import { DateTime } from 'luxon';

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
    refetchInterval: 60000,
  });

  const timezone = userData?.timezone || DateTime.local().zoneName || 'UTC';

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
              <p className="text-muted-foreground mb-2">{t('calendar.empty')}</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t('calendar.emptyHint')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/me/library">
                  <Button variant="outline">{t('calendar.goToLibrary')}</Button>
                </Link>
                <Link href="/calendar/now">
                  <Button>{t('calendar.browseSeason')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <CalendarList items={data.items} timezone={timezone} />
        )}
      </div>
    </div>
  );
}
