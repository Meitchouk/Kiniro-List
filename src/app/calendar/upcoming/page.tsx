"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { SeasonAnimeGrid, SeasonPageSkeleton } from "@/components/season";
import { useSeasonCalendar } from "@/lib/hooks/useSeasonCalendar";

export default function CalendarUpcomingPage() {
  const t = useTranslations();

  const { data, isLoading, error, refetch, handlePageChange } = useSeasonCalendar({
    type: "upcoming",
  });

  if (isLoading) {
    return <SeasonPageSkeleton title={t("calendar.upcoming")} />;
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("calendar.upcoming")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <ErrorBanner onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("calendar.upcoming")} showBack={true} />
      <div className="container mx-auto px-4 py-8">
        {data && (
          <SeasonAnimeGrid
            anime={data.anime}
            pagination={data.pagination}
            season={data.season}
            year={data.year}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
