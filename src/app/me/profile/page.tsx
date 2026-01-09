'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getLibrary, setAuthHeadersGetter } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Library, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => getCurrentUser(),
    enabled: !!user,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => getLibrary(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const libraryItems = libraryData?.items || libraryData?.entries || [];
  const libraryStats = libraryItems.reduce(
    (acc: Record<string, number>, item: { status: string }) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user?.displayName || t('profile.anonymous')}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('settings.timezone')}</p>
                <p className="font-medium">{userData?.timezone || 'UTC'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('settings.language')}</p>
                <p className="font-medium">{userData?.locale === 'es' ? 'Español' : 'English'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('settings.theme')}</p>
                <p className="font-medium capitalize">{userData?.theme || 'system'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('settings.calendarView')}</p>
                <p className="font-medium capitalize">{userData?.calendarView || 'weekly'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('library.title')}</CardTitle>
            <CardDescription>{t('library.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="default">
                {t('library.watching')}: {libraryStats.watching || 0}
              </Badge>
              <Badge variant="secondary">
                {t('library.planned')}: {libraryStats.planned || 0}
              </Badge>
              <Badge variant="outline">
                {t('library.completed')}: {libraryStats.completed || 0}
              </Badge>
              <Badge variant="outline">
                {t('library.paused')}: {libraryStats.paused || 0}
              </Badge>
              <Badge variant="destructive">
                {t('library.dropped')}: {libraryStats.dropped || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/me/library">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Library className="h-6 w-6" />
              <span>{t('nav.library')}</span>
            </Button>
          </Link>
          <Link href="/me/calendar">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>{t('nav.myCalendar')}</span>
            </Button>
          </Link>
          <Link href="/me/settings">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>{t('nav.settings')}</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
