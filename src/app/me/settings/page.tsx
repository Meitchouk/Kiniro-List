"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, setAuthHeadersGetter } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, Globe, Palette, Calendar, Filter, Save } from "lucide-react";
import {
  TimezoneSelector,
  LocaleSelector,
  ThemeSelector,
  CalendarViewSelector,
  FilterSettings,
  SettingsCard,
} from "@/components/settings";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";

export default function SettingsPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => getCurrentUser(),
    enabled: !!user,
  });

  const { form, onSubmit, isPending } = useSettingsForm({ userData, t });
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = form;
  const currentValues = watch();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
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
        <ErrorBanner message={t("errors.generic")} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("nav.settings")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Localization Settings */}
            <SettingsCard
              title={t("settings.localization")}
              description={t("settings.localizationDescription")}
              icon={Globe}
            >
              <TimezoneSelector
                value={currentValues.timezone}
                onChange={(value) => setValue("timezone", value, { shouldDirty: true })}
              />
              <LocaleSelector
                value={currentValues.locale}
                onChange={(value) => setValue("locale", value, { shouldDirty: true })}
              />
            </SettingsCard>

            {/* Appearance Settings */}
            <SettingsCard
              title={t("settings.appearance")}
              description={t("settings.appearanceDescription")}
              icon={Palette}
            >
              <ThemeSelector
                value={currentValues.theme}
                onChange={(value) => setValue("theme", value, { shouldDirty: true })}
              />
            </SettingsCard>

            {/* Calendar Settings */}
            <SettingsCard
              title={t("settings.calendar")}
              description={t("settings.calendarDescription")}
              icon={Calendar}
            >
              <CalendarViewSelector
                value={currentValues.calendarView}
                onChange={(value) => setValue("calendarView", value, { shouldDirty: true })}
              />
            </SettingsCard>

            {/* Filter Settings */}
            <SettingsCard
              title={t("settings.filters")}
              description={t("settings.filtersDescription")}
              icon={Filter}
            >
              <FilterSettings
                filters={currentValues.filters}
                onChange={(filters) => setValue("filters", filters, { shouldDirty: true })}
              />
            </SettingsCard>

            <Button type="submit" className="w-full" disabled={!isDirty || isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? t("settings.saving") : t("settings.save")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
