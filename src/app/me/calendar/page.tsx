"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyCalendar, setAuthHeadersGetter, updateSettings } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { MyCalendarGrid } from "@/components/calendar";
import { Calendar } from "lucide-react";

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-52 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyCalendarPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const queryClient = useQueryClient();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-calendar", weekOffset],
    queryFn: () => getMyCalendar(weekOffset),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const filters = data?.filters || { hideAdult: true, onlyWatching: true };

  // Mutation to update filter
  const filterMutation = useMutation({
    mutationFn: (onlyWatching: boolean) =>
      updateSettings({ filters: { ...filters, onlyWatching } }),
    onSuccess: () => {
      // Invalidate calendar query to refetch with new filter
      queryClient.invalidateQueries({ queryKey: ["my-calendar"] });
    },
  });

  const handleFilterChange = (checked: boolean) => {
    filterMutation.mutate(checked);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("myCalendar.title")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <CalendarSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("myCalendar.title")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner message={t("errors.generic")} onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  const hasItems = data?.schedule && Object.values(data.schedule).some((items) => items.length > 0);
  const timezone = data?.timezone || "UTC";

  return (
    <div className="flex flex-col">
      <PageHeader title={t("myCalendar.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        {!hasItems ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2">{t("calendar.empty")}</p>
              <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">
                {t("calendar.emptyHint")}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/me/library">
                  <Button variant="outline">{t("calendar.goToLibrary")}</Button>
                </Link>
                <Link href="/calendar/now">
                  <Button>{t("calendar.browseSeason")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <MyCalendarGrid
            schedule={data.schedule}
            timezone={timezone}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
            onlyWatching={filters.onlyWatching}
            onFilterChange={handleFilterChange}
            filterLoading={filterMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
