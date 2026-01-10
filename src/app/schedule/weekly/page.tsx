"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { getWeeklySchedule } from "@/lib/api";
import { getLocalizedTitle } from "@/lib/utils/text";
import { formatAiringTime } from "@/lib/utils/date";
import { Calendar, Clock } from "lucide-react";

const weekdays = [0, 1, 2, 3, 4, 5, 6];

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

  // Get current day (0-6)
  const today = new Date().getDay();

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("schedule.title")} showBack={true} />
        <div className="container mx-auto px-4 py-8">
          <p className="mb-6 text-muted-foreground">
            {t("schedule.subtitle")}
          </p>
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
      <p className="mb-6 text-muted-foreground">
        {t("schedule.subtitle")}
      </p>

      <Tabs defaultValue={String(today)} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-7 gap-1">
          {weekdays.map((day) => {
            const isToday = day === today;
            const animeCount = data?.schedule[day]?.length || 0;

            return (
              <TabsTrigger
                key={day}
                value={String(day)}
                className="flex flex-col gap-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden text-sm font-medium sm:inline">
                  {t(`schedule.weekdays.${day}`)}
                </span>
                <span className="text-sm font-medium sm:hidden">
                  {t(`schedule.weekdays.${day}`).slice(0, 3)}
                </span>
                <Badge
                  variant={isToday ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {animeCount}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {weekdays.map((day) => {
          const isToday = day === today;
          const animeCount = data?.schedule[day]?.length || 0;

          return (
            <TabsContent key={day} value={String(day)} className="pt-10">
              <div className="mb-4 flex items-center gap-2">
                {isToday && <Calendar className="h-5 w-5 text-primary" />}
                <h2 className="text-xl font-semibold">
                  {t(`schedule.weekdays.${day}`)}
                </h2>
                <Badge variant={isToday ? "default" : "secondary"}>
                  {animeCount}
                </Badge>
              </div>

              {animeCount === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                      {t("schedule.noEpisodes")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data?.schedule[day]?.map((item) => {
                    const title = getLocalizedTitle(item.anime.title);
                    const coverImage =
                      item.anime.coverImage.large || "/placeholder.png";

                    return (
                      <Link
                        key={item.anime.id}
                        href={`/anime/${item.anime.id}`}
                        className="group"
                      >
                        <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                          <CardContent className="flex gap-3 p-4">
                            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded">
                              <Image
                                src={coverImage}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                              <div>
                                <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                                  {title}
                                </h3>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatAiringTime(item.airingAt)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {t("airing.episode", { number: item.episode })}
                                  </Badge>
                                  {item.anime.format && (
                                    <Badge variant="outline" className="text-xs">
                                      {t(`format.${item.anime.format}`)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      </div>
    </div>
  );
}
