"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { getWeeklySchedule } from "@/lib/api";
import { getLocalizedTitle } from "@/lib/utils/text";
import { formatAiringTime } from "@/lib/utils/date";

const weekdays = [0, 1, 2, 3, 4, 5, 6];

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("schedule.title")}</h1>
        <ScheduleSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("schedule.title")}</h1>
        <ErrorBanner onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("schedule.title")}</h1>

      <Tabs defaultValue={String(today)} className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap gap-1">
          {weekdays.map((day) => (
            <TabsTrigger
              key={day}
              value={String(day)}
              className="flex-1 min-w-fit"
            >
              <span className="hidden sm:inline">
                {t(`schedule.weekdays.${day}`)}
              </span>
              <span className="sm:hidden">
                {t(`schedule.weekdays.${day}`).slice(0, 3)}
              </span>
              {data && (
                <Badge variant="secondary" className="ml-2">
                  {data.schedule[day]?.length || 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {weekdays.map((day) => (
          <TabsContent key={day} value={String(day)}>
            {data && data.schedule[day]?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("common.noResults")}
              </p>
            ) : (
              <div className="space-y-3">
                {data?.schedule[day]?.map((item) => {
                  const title = getLocalizedTitle(item.anime.title);
                  const coverImage =
                    item.anime.coverImage.large || "/placeholder.png";

                  return (
                    <Link key={item.anime.id} href={`/anime/${item.anime.id}`}>
                      <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="flex gap-4 p-4">
                          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
                            <Image
                              src={coverImage}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-center">
                            <h3 className="font-medium line-clamp-1">{title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {t("airing.episode", { number: item.episode })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatAiringTime(item.airingAt)}
                            </p>
                          </div>
                          {item.anime.format && (
                            <Badge variant="outline" className="self-center">
                              {t(`format.${item.anime.format}`)}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
