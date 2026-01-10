"use client";

import { useTranslations } from "next-intl";
import {
  Stack,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ds";
import type { CalendarView } from "@/lib/types";

interface CalendarViewSelectorProps {
  value: CalendarView;
  onChange: (value: CalendarView) => void;
}

const CALENDAR_VIEW_OPTIONS: { value: CalendarView; labelKey: string }[] = [
  { value: "weekly", labelKey: "settings.viewWeekly" },
  { value: "season", labelKey: "settings.viewSeason" },
];

export function CalendarViewSelector({ value, onChange }: CalendarViewSelectorProps) {
  const t = useTranslations();

  return (
    <Stack gap={2}>
      <Label htmlFor="calendarView">{t("settings.calendarView")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="calendarView">
          <SelectValue placeholder={t("settings.selectCalendarView")} />
        </SelectTrigger>
        <SelectContent>
          {CALENDAR_VIEW_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Stack>
  );
}
