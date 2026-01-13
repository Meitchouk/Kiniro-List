"use client";

import { useTranslations } from "next-intl";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Card,
  CardContent,
  Typography,
  Flex,
} from "@/components/ds";
import { Calendar, Clock } from "lucide-react";
import { MyCalendarItemCard } from "./MyCalendarItemCard";
import type { MyCalendarScheduleItem } from "@/lib/types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface MyCalendarWeeklyTabsProps {
  schedule: Record<number, MyCalendarScheduleItem[]>;
  timezone: string;
}

/**
 * Weekly calendar tabs for personal anime calendar
 */
export function MyCalendarWeeklyTabs({ schedule, timezone }: MyCalendarWeeklyTabsProps) {
  const t = useTranslations();
  const today = new Date().getDay();

  // Count total items and aired items
  const getTotalCount = () => {
    return Object.values(schedule).reduce((sum, items) => sum + items.length, 0);
  };

  const getAiredCount = () => {
    return Object.values(schedule).reduce(
      (sum, items) => sum + items.filter((i) => i.isAired).length,
      0
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <Flex align="center" justify="between" className="flex-wrap gap-2">
        <Flex align="center" gap={2}>
          <Calendar className="text-primary h-5 w-5" />
          <Typography variant="body2" colorScheme="secondary">
            {t("myCalendar.weekSummary", {
              total: getTotalCount(),
              aired: getAiredCount(),
            })}
          </Typography>
        </Flex>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {timezone}
        </Badge>
      </Flex>

      <Tabs defaultValue={String(today)} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => {
            const isToday = day === today;
            const items = schedule[day] || [];
            const animeCount = items.length;
            const airedCount = items.filter((i) => i.isAired).length;
            const pendingCount = animeCount - airedCount;

            return (
              <TabsTrigger
                key={day}
                value={String(day)}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-2"
              >
                <Typography variant="body2" weight="medium" className="hidden sm:inline">
                  {t(`schedule.weekdays.${day}`)}
                </Typography>
                <Typography variant="body2" weight="medium" className="sm:hidden">
                  {t(`schedule.weekdays.${day}`).slice(0, 3)}
                </Typography>
                <Flex gap={1}>
                  {pendingCount > 0 && (
                    <Badge variant={isToday ? "secondary" : "outline"} className="text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                  {airedCount > 0 && (
                    <Badge variant="default" className="bg-primary/60 text-xs">
                      {airedCount}
                    </Badge>
                  )}
                  {animeCount === 0 && (
                    <Badge variant="outline" className="text-xs">
                      0
                    </Badge>
                  )}
                </Flex>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {WEEKDAYS.map((day) => {
          const isToday = day === today;
          const items = schedule[day] || [];
          const animeCount = items.length;
          const airedCount = items.filter((i) => i.isAired).length;

          return (
            <TabsContent key={day} value={String(day)} className="pt-10">
              <Flex align="center" gap={2} className="mb-4">
                {isToday && <Calendar className="text-primary h-5 w-5" />}
                <Typography variant="h5">{t(`schedule.weekdays.${day}`)}</Typography>
                <Badge variant={isToday ? "default" : "secondary"}>{animeCount}</Badge>
                {airedCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {t("myCalendar.airedCount", { count: airedCount })}
                  </Badge>
                )}
              </Flex>

              {animeCount === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <Typography variant="body2" colorScheme="secondary" align="center">
                      {t("myCalendar.noEpisodes")}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <MyCalendarItemCard
                      key={`${item.anime.id}-${item.episode}`}
                      item={item}
                      timezone={timezone}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
