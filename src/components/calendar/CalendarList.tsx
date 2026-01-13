"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar } from "lucide-react";
import { DateTime } from "luxon";
import { Typography, Flex, Grid, Stack } from "@/components/ds";
import { CalendarItemCard } from "./CalendarItemCard";
import type { CalendarAnimeItem } from "@/lib/types";

interface CalendarDateGroupProps {
  dateKey: string;
  items: CalendarAnimeItem[];
  timezone: string;
}

function formatDateHeader(
  dateKey: string,
  timezone: string,
  locale: string,
  t: ReturnType<typeof useTranslations>
) {
  const dt = DateTime.fromISO(dateKey).setZone(timezone).setLocale(locale);
  const today = DateTime.now().setZone(timezone).startOf("day");
  const tomorrow = today.plus({ days: 1 });
  const itemDate = dt.startOf("day");

  if (itemDate.equals(today)) {
    return t("calendar.today");
  } else if (itemDate.equals(tomorrow)) {
    return t("calendar.tomorrow");
  }

  return dt.toFormat(t("common.dateFormatLong"));
}

/**
 * A date group with header and list of calendar items
 */
export function CalendarDateGroup({ dateKey, items, timezone }: CalendarDateGroupProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Stack gap={4}>
      <Flex align="center" gap={2}>
        <Calendar className="h-5 w-5" />
        <Typography variant="h6">{formatDateHeader(dateKey, timezone, locale, t)}</Typography>
      </Flex>
      <Grid cols={1} mdCols={2} lgCols={2} xlCols={3} gap={4}>
        {items.map((item) => (
          <CalendarItemCard key={item.anime.id} item={item} timezone={timezone} />
        ))}
      </Grid>
    </Stack>
  );
}

interface CalendarUnknownGroupProps {
  items: CalendarAnimeItem[];
  timezone: string;
}

/**
 * Group for items with unknown airing dates
 */
export function CalendarUnknownGroup({ items, timezone }: CalendarUnknownGroupProps) {
  const t = useTranslations();

  if (!items || items.length === 0) return null;

  return (
    <Stack gap={3}>
      <Typography variant="h6" colorScheme="secondary">
        {t("calendar.unknown")}
      </Typography>
      <Grid cols={1} mdCols={2} xlCols={3} gap={3}>
        {items.map((item) => (
          <CalendarItemCard key={item.anime.id} item={item} timezone={timezone} isUnknown />
        ))}
      </Grid>
    </Stack>
  );
}

interface CalendarListProps {
  items: CalendarAnimeItem[];
  timezone: string;
}

/**
 * Full calendar list with grouped items by date
 */
export function CalendarList({ items, timezone }: CalendarListProps) {
  const groupedItems = useMemo(() => {
    if (!items) return {};

    const grouped: Record<string, CalendarAnimeItem[]> = {};

    items.forEach((item) => {
      const airingAt = item.displayAiringAt || item.nextAiringAt;

      if (!airingAt) {
        if (!grouped["unknown"]) grouped["unknown"] = [];
        grouped["unknown"].push(item);
        return;
      }

      const dt = DateTime.fromISO(airingAt).setZone(timezone);
      const dateKey = dt.toFormat("yyyy-MM-dd");

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    // Sort each group by air time
    Object.keys(grouped).forEach((key) => {
      if (key !== "unknown") {
        grouped[key].sort((a, b) => {
          const aTime = new Date(a.displayAiringAt || a.nextAiringAt || 0).getTime();
          const bTime = new Date(b.displayAiringAt || b.nextAiringAt || 0).getTime();
          return aTime - bTime;
        });
      }
    });

    return grouped;
  }, [items, timezone]);

  const sortedDates = useMemo(() => {
    const today = DateTime.now().setZone(timezone).startOf("day");

    return Object.keys(groupedItems)
      .filter((key) => {
        if (key === "unknown") return false;

        // Include today and future dates
        const itemDate = DateTime.fromISO(key).setZone(timezone).startOf("day");
        return itemDate >= today;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [groupedItems, timezone]);

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <CalendarDateGroup
          key={dateKey}
          dateKey={dateKey}
          items={groupedItems[dateKey]}
          timezone={timezone}
        />
      ))}
      <CalendarUnknownGroup items={groupedItems["unknown"] || []} timezone={timezone} />
    </div>
  );
}
