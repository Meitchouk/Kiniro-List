'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateSettings, setAuthHeadersGetter } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBanner } from '@/components/anime/ErrorBanner';
import { Settings, Globe, Palette, Calendar, Filter, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';
import { DateTime } from 'luxon';

const settingsSchema = z.object({
  timezone: z.string().min(1),
  locale: z.enum(['en', 'es']),
  theme: z.enum(['light', 'dark', 'system']),
  calendarView: z.enum(['weekly', 'season']),
  filters: z.object({
    hideAdult: z.boolean(),
    onlyWatching: z.boolean(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function SettingsPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => getCurrentUser(),
    enabled: !!user,
  });

  const browserTimezone = useMemo(() => {
    try {
      return DateTime.local().zoneName || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: browserTimezone,
      locale: 'en',
      theme: 'system',
      calendarView: 'weekly',
      filters: {
        hideAdult: true,
        onlyWatching: true,
      },
    },
  });

  useEffect(() => {
    if (userData) {
      reset({
        timezone: userData.timezone || browserTimezone,
        locale: userData.locale || 'en',
        theme: userData.theme || 'system',
        calendarView: userData.calendarView || 'weekly',
        filters: userData.filters || { hideAdult: true, onlyWatching: true },
      });
    }
  }, [userData, reset, browserTimezone]);

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormData) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  const currentValues = watch();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBanner message={t('errors.generic')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Localization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.localization')}
              </CardTitle>
              <CardDescription>{t('settings.localizationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                <Select
                  value={currentValues.timezone}
                  onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder={t('settings.selectTimezone')} />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('settings.browserTimezone')}: {browserTimezone}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">{t('settings.language')}</Label>
                <Select
                  value={currentValues.locale}
                  onValueChange={(value: 'en' | 'es') => setValue('locale', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="locale">
                    <SelectValue placeholder={t('settings.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{t('settings.theme')}</Label>
                <Select
                  value={currentValues.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => setValue('theme', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder={t('settings.selectTheme')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
                    <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
                    <SelectItem value="system">{t('settings.themeSystem')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('settings.calendar')}
              </CardTitle>
              <CardDescription>{t('settings.calendarDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendarView">{t('settings.calendarView')}</Label>
                <Select
                  value={currentValues.calendarView}
                  onValueChange={(value: 'weekly' | 'season') => setValue('calendarView', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="calendarView">
                    <SelectValue placeholder={t('settings.selectCalendarView')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('settings.viewWeekly')}</SelectItem>
                    <SelectItem value="season">{t('settings.viewSeason')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filter Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('settings.filters')}
              </CardTitle>
              <CardDescription>{t('settings.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hideAdult">{t('settings.hideAdult')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.hideAdultDescription')}</p>
                </div>
                <Switch
                  id="hideAdult"
                  checked={currentValues.filters?.hideAdult || false}
                  onCheckedChange={(checked) => setValue('filters.hideAdult', checked, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="onlyWatching">{t('settings.onlyWatching')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.onlyWatchingDescription')}</p>
                </div>
                <Switch
                  id="onlyWatching"
                  checked={currentValues.filters?.onlyWatching || false}
                  onCheckedChange={(checked) => setValue('filters.onlyWatching', checked, { shouldDirty: true })}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={!isDirty || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
          </Button>
        </form>
      </div>
    </div>
  );
}
