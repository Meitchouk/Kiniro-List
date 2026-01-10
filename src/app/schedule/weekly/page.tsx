"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { WeeklyScheduleTabs } from "@/components/schedule";
import { getWeeklySchedule } from "@/lib/api";

function ScheduleSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export default function WeeklySchedulePage() {
  const t = useTranslations();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["weekly-schedule"],
    queryFn: getWeeklySchedule,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("schedule.title")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <p className="mb-6 text-muted-foreground">{t("schedule.subtitle")}</p>
          <ScheduleSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("schedule.title")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("schedule.title")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        <p className="mb-6 text-muted-foreground">{t("schedule.subtitle")}</p>
        <WeeklyScheduleTabs schedule={data?.schedule || {}} />
      </div>
    </div>
  );
}
