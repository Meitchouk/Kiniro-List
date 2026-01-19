"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DateTime } from "luxon";
import {
  Card,
  CardContent,
  Badge,
  Typography,
  Flex,
  Stack,
  Switch,
  InfoLabel,
} from "@/components/ds";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, PlayCircle, CheckCircle } from "lucide-react";
import { CrunchyrollIcon } from "@/components/icons/CrunchyrollIcon";
import { getLocalizedTitle } from "@/lib/utils/text";
import { useLocalizedDateFormat } from "@/lib/i18n";
import type { MyCalendarScheduleItem, StreamingLink } from "@/lib/types";

// Fixed card dimensions
const CARD_WIDTH = 160; // px
const CARD_IMAGE_HEIGHT = 200; // px

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

function getCrunchyrollSearchUrl(title: string) {
  const searchQuery = encodeURIComponent(title);
  return `https://www.crunchyroll.com/search?q=${searchQuery}`;
}

function getCrunchyrollLink(
  streamingLinks: StreamingLink[] | undefined,
  title: string
): { url: string; isDirect: boolean } {
  const crunchyrollLink = streamingLinks?.find((link) => link.site.toLowerCase() === "crunchyroll");
  if (crunchyrollLink) {
    return { url: crunchyrollLink.url, isDirect: true };
  }
  return { url: getCrunchyrollSearchUrl(title), isDirect: false };
}

interface CalendarEpisodeCardProps {
  item: MyCalendarScheduleItem;
  timezone: string;
  priority?: boolean;
}

/**
 * Fixed-size episode card for calendar view
 */
function CalendarEpisodeCard({ item, timezone, priority = false }: CalendarEpisodeCardProps) {
  const t = useTranslations();
  const title = getLocalizedTitle(item.anime.title);
  const cover = item.anime.coverImage.large || "/placeholder.png";
  const slug = item.anime.slug || String(item.anime.id);
  const crunchyroll = getCrunchyrollLink(item.anime.streamingLinks, title);

  return (
    <Card
      className={`group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${
        item.isAired ? "opacity-70" : ""
      }`}
      style={{ width: CARD_WIDTH }}
    >
      <Link href={`/anime/${slug}`} className="block">
        <div className="relative overflow-hidden" style={{ height: CARD_IMAGE_HEIGHT }}>
          <Image
            src={cover}
            alt={title}
            fill
            priority={priority}
            className={`object-cover transition-transform group-hover:scale-105 ${
              item.isAired ? "grayscale-30" : ""
            }`}
            sizes={`${CARD_WIDTH}px`}
          />
          {/* Aired overlay */}
          {item.isAired && (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <CheckCircle className="text-primary h-10 w-10" />
            </div>
          )}
          {/* Episode badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge
              className={`gap-1 text-sm font-semibold shadow-md ${
                item.isAired
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {t("anime.episode", { number: item.episode })}
            </Badge>
          </div>
          {/* Time badge */}
          <div className="absolute right-2 bottom-2">
            <Badge variant="secondary" className="gap-1 text-xs shadow-md">
              <Clock className="h-3 w-3" />
              {DateTime.fromSeconds(item.airingAt).setZone(timezone).toFormat("HH:mm")}
            </Badge>
          </div>
        </div>
      </Link>
      <CardContent className="space-y-2 p-2">
        <Link href={`/anime/${slug}`}>
          <Typography
            variant="caption"
            weight="medium"
            lineClamp={2}
            className="group-hover:text-primary min-h-10 leading-tight transition-colors"
          >
            {title}
          </Typography>
        </Link>
        <Flex align="center" justify="between" gap={1}>
          {item.anime.format && (
            <Badge variant="outline" className="text-[10px]">
              {t(`format.${item.anime.format}`)}
            </Badge>
          )}
          {/* Crunchyroll button */}
          <a
            href={crunchyroll.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/20"
            title={
              crunchyroll.isDirect
                ? t("calendar.watchOnCrunchyroll")
                : t("calendar.searchOnCrunchyroll")
            }
            onClick={(e) => e.stopPropagation()}
          >
            <CrunchyrollIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {crunchyroll.isDirect ? t("common.watch") : t("common.search")}
            </span>
          </a>
        </Flex>
      </CardContent>
    </Card>
  );
}

interface DayColumnProps {
  date: DateTime;
  items: MyCalendarScheduleItem[];
  timezone: string;
  isToday: boolean;
}

/**
 * Single day column in the calendar
 */
function DayColumn({ date, items, timezone, isToday }: DayColumnProps) {
  const t = useTranslations();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const { formatMonthDay } = useLocalizedDateFormat();

  // Luxon weekday: 1=Monday...7=Sunday -> convert to 0=Sunday, 1=Monday...6=Saturday
  const weekdayKey = date.weekday === 7 ? 0 : date.weekday;

  // 2 items on mobile, 4 on desktop
  const ITEMS_PER_DAY = isMobile ? 2 : 4;
  const displayedItems = expanded ? items : items.slice(0, ITEMS_PER_DAY);
  const hasMore = items.length > ITEMS_PER_DAY;

  // Format month using the localized formatter
  const monthLabel = formatMonthDay(date.toJSDate(), { timezone }).split(" ")[0];

  return (
    <div className="flex min-w-0 flex-col items-center">
      {/* Day header */}
      <div
        className={`mb-3 w-full rounded-lg p-3 text-center ${
          isToday ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <Typography variant="body2" weight="semibold">
          {t(`schedule.weekdays.${weekdayKey}`)}
        </Typography>
        <Typography variant="h6" weight="bold">
          {date.day}
        </Typography>
        <Typography variant="caption" className={isToday ? "opacity-80" : "text-muted-foreground"}>
          {monthLabel}
        </Typography>
      </div>

      {/* Episodes */}
      <Stack gap={3} className="w-full items-center">
        {items.length === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-center text-sm">
            —
          </div>
        ) : (
          <>
            {displayedItems.map((item, idx) => (
              <CalendarEpisodeCard
                key={`${item.anime.id}-${item.episode}`}
                item={item}
                timezone={timezone}
                priority={idx === 0}
              />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 w-full text-xs"
              >
                {expanded
                  ? t("common.showLess")
                  : t("common.showMore", { count: items.length - ITEMS_PER_DAY })}
              </Button>
            )}
          </>
        )}
      </Stack>
    </div>
  );
}

interface MyCalendarGridProps {
  schedule: Record<number, MyCalendarScheduleItem[]>;
  timezone: string;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  onlyWatching?: boolean;
  onFilterChange?: (checked: boolean) => void;
  filterLoading?: boolean;
}

/**
 * Calendar grid with week navigation
 */
export function MyCalendarGrid({
  schedule,
  timezone,
  weekOffset,
  onWeekChange,
  onlyWatching = true,
  onFilterChange,
  filterLoading = false,
}: MyCalendarGridProps) {
  const t = useTranslations();
  const { formatDateRange } = useLocalizedDateFormat();

  const now = DateTime.now().setZone(timezone);

  // Calculate week start (Sunday) based on offset
  // Must match the server-side calculation in api/me/calendar/route.ts
  // If today is Sunday, week starts today; otherwise, go back to previous Sunday
  const weekStart = useMemo(() => {
    const currentWeekStart =
      now.weekday === 7
        ? now.startOf("day") // Today is Sunday, start here
        : now.startOf("week").minus({ days: 1 }).startOf("day"); // Go to previous Sunday
    return currentWeekStart.plus({ weeks: weekOffset });
  }, [now, weekOffset]);

  const weekEnd = weekStart.plus({ days: 6 }).endOf("day");
  const weekEndDisplay = weekStart.plus({ days: 6 }); // For display purposes (date range header)

  // Generate days for the week
  const days = useMemo(() => {
    const result: DateTime[] = [];
    for (let i = 0; i < 7; i++) {
      result.push(weekStart.plus({ days: i }));
    }
    return result;
  }, [weekStart]);

  // Group schedule items by actual date
  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, MyCalendarScheduleItem[]>();

    // Initialize all days of the week
    days.forEach((day) => {
      grouped.set(day.toFormat("yyyy-MM-dd"), []);
    });

    // Populate with items from schedule
    Object.values(schedule)
      .flat()
      .forEach((item) => {
        const itemDate = DateTime.fromSeconds(item.airingAt).setZone(timezone);
        const dateKey = itemDate.toFormat("yyyy-MM-dd");

        // Only include items within current week view
        if (itemDate >= weekStart && itemDate <= weekEnd) {
          const existing = grouped.get(dateKey) || [];
          existing.push(item);
          grouped.set(dateKey, existing);
        }
      });

    // Sort items by time within each day
    grouped.forEach((items, key) => {
      items.sort((a, b) => a.airingAt - b.airingAt);
      grouped.set(key, items);
    });

    return grouped;
  }, [schedule, days, weekStart, weekEnd, timezone]);

  // Count episodes this week
  const episodeCount = useMemo(() => {
    return Array.from(itemsByDate.values()).reduce((sum, items) => sum + items.length, 0);
  }, [itemsByDate]);

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <Flex align="center" justify="between" className="flex-wrap gap-4">
        <Flex align="center" gap={3}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(weekOffset - 1)}
            disabled={weekOffset <= -4}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <Typography variant="h6" weight="semibold">
              {formatDateRange(weekStart.toJSDate(), weekEndDisplay.toJSDate(), { timezone })}
            </Typography>
            <Typography variant="caption" colorScheme="secondary">
              {episodeCount} {t("myCalendar.episodesThisWeek", { count: episodeCount })}
            </Typography>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(weekOffset + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Flex>

        <Flex align="center" gap={3}>
          {onFilterChange && (
            <Flex align="center" gap={2}>
              <InfoLabel
                info={t("settings.onlyWatchingDescription")}
                htmlFor="calendarFilter"
                asLabel
                className="text-sm whitespace-nowrap"
              >
                {t("myCalendar.onlyWatchingShort")}
              </InfoLabel>
              <Switch
                id="calendarFilter"
                checked={onlyWatching}
                onCheckedChange={onFilterChange}
                disabled={filterLoading}
              />
            </Flex>
          )}
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => onWeekChange(0)}>
              {t("myCalendar.goToToday")}
            </Button>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {timezone}
          </Badge>
        </Flex>
      </Flex>

      {/* Calendar grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const dateKey = day.toFormat("yyyy-MM-dd");
          const isToday = day.hasSame(now, "day");
          const items = itemsByDate.get(dateKey) || [];

          return (
            <DayColumn
              key={dateKey}
              date={day}
              items={items}
              timezone={timezone}
              isToday={isToday}
            />
          );
        })}
      </div>
    </div>
  );
}
