"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, CardContent, Typography, Flex } from "@/components/ds";
import { Calendar } from "lucide-react";
import { ScheduleItemCard } from "./ScheduleItemCard";
import type { WeeklyScheduleItem } from "@/lib/types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface WeeklyScheduleTabsProps {
  schedule: Record<number, WeeklyScheduleItem[]>;
}

/**
 * Weekly schedule with day tabs
 */
export function WeeklyScheduleTabs({ schedule }: WeeklyScheduleTabsProps) {
  const t = useTranslations();
  const today = new Date().getDay();

  return (
    <Tabs defaultValue={String(today)} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => {
          const isToday = day === today;
          const animeCount = schedule[day]?.length || 0;

          return (
            <TabsTrigger
              key={day}
              value={String(day)}
              className="flex flex-col gap-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Typography variant="body2" weight="medium" className="hidden sm:inline">
                {t(`schedule.weekdays.${day}`)}
              </Typography>
              <Typography variant="body2" weight="medium" className="sm:hidden">
                {t(`schedule.weekdays.${day}`).slice(0, 3)}
              </Typography>
              <Badge variant={isToday ? "secondary" : "outline"} className="text-xs">
                {animeCount}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {WEEKDAYS.map((day) => {
        const isToday = day === today;
        const items = schedule[day] || [];
        const animeCount = items.length;

        return (
          <TabsContent key={day} value={String(day)} className="pt-10">
            <Flex align="center" gap={2} className="mb-4">
              {isToday && <Calendar className="h-5 w-5 text-primary" />}
              <Typography variant="h5">
                {t(`schedule.weekdays.${day}`)}
              </Typography>
              <Badge variant={isToday ? "default" : "secondary"}>
                {animeCount}
              </Badge>
            </Flex>

            {animeCount === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <Typography variant="body2" colorScheme="secondary" align="center">
                    {t("schedule.noEpisodes")}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ScheduleItemCard
                    key={item.anime.id}
                    id={item.anime.id}
                    title={item.anime.title}
                    coverImage={item.anime.coverImage}
                    format={item.anime.format}
                    airingAt={item.airingAt}
                    episode={item.episode}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
