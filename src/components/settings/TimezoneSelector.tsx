"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import {
  Stack,
  Typography,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  IconWrapper,
  Flex,
} from "@/components/ds";
import {
  getAllTimezones,
  groupTimezones,
  getTimezoneInfo,
  getBrowserTimezone,
  type TimezoneInfo,
} from "@/lib/utils/timezone";

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const t = useTranslations();
  const [timezoneSearch, setTimezoneSearch] = useState("");

  const browserTimezone = useMemo(() => getBrowserTimezone(), []);
  const allTimezones = useMemo(() => getAllTimezones(), []);
  const groupedTimezones = useMemo(() => groupTimezones(allTimezones), [allTimezones]);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) {
      return groupedTimezones;
    }
    const search = timezoneSearch.toLowerCase();
    const filtered: Record<string, TimezoneInfo[]> = {};

    for (const [region, zones] of Object.entries(groupedTimezones)) {
      const matchingZones = zones.filter(
        (tzInfo) =>
          tzInfo.name.toLowerCase().includes(search) ||
          tzInfo.displayName.toLowerCase().includes(search) ||
          region.toLowerCase().includes(search)
      );
      if (matchingZones.length > 0) {
        filtered[region] = matchingZones;
      }
    }
    return filtered;
  }, [groupedTimezones, timezoneSearch]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setTimezoneSearch("");
  };

  return (
    <Stack gap={2}>
      <Label htmlFor="timezone">{t("settings.timezone")}</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder={t("settings.selectTimezone")} />
        </SelectTrigger>
        <SelectContent className="max-h-100" position="popper" sideOffset={5}>
          {/* Search input */}
          <div className="bg-popover sticky top-0 z-10 border-b px-2 pb-2">
            <Flex align="center" gap={2} className="bg-background rounded-md border px-2 py-1.5">
              <IconWrapper icon={Search} size="sm" colorScheme="secondary" className="shrink-0" />
              <input
                type="text"
                placeholder={t("settings.searchTimezone")}
                value={timezoneSearch}
                onChange={(e) => setTimezoneSearch(e.target.value)}
                className="h-7 w-full bg-transparent text-sm outline-none"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </Flex>
          </div>

          <div className="max-h-75 overflow-y-auto">
            {/* Detected timezone shortcut */}
            {!timezoneSearch && browserTimezone !== value && (
              <SelectItem value={browserTimezone} className="text-primary font-medium">
                <Stack>
                  <Flex align="center" gap={2}>
                    📍{" "}
                    <Typography variant="body2" className="font-semibold">
                      {getTimezoneInfo(browserTimezone).displayName}
                    </Typography>
                  </Flex>
                  <Typography variant="caption" colorScheme="secondary">
                    {getTimezoneInfo(browserTimezone).currentTime} • {t("settings.detected")}
                  </Typography>
                </Stack>
              </SelectItem>
            )}

            {/* Grouped timezones */}
            {Object.entries(filteredTimezones).map(([region, zones]) => (
              <div key={region}>
                <Typography
                  variant="caption"
                  className="text-muted-foreground bg-muted/50 sticky top-0 block px-2 py-1.5 font-semibold"
                >
                  {region}
                </Typography>
                {zones
                  .filter(
                    (tzInfo) =>
                      !(
                        !timezoneSearch &&
                        browserTimezone !== value &&
                        tzInfo.name === browserTimezone
                      )
                  )
                  .map((tzInfo) => (
                    <SelectItem key={tzInfo.name} value={tzInfo.name}>
                      <Stack className="py-0.5">
                        <Typography variant="body2" className="font-medium">
                          {tzInfo.displayName}
                        </Typography>
                        <Typography variant="caption" colorScheme="secondary">
                          {tzInfo.currentTime}
                        </Typography>
                      </Stack>
                    </SelectItem>
                  ))}
              </div>
            ))}

            {Object.keys(filteredTimezones).length === 0 && (
              <Typography
                variant="body2"
                colorScheme="secondary"
                align="center"
                className="px-4 py-8"
              >
                {t("settings.noTimezones")}
              </Typography>
            )}
          </div>
        </SelectContent>
      </Select>
      <Typography variant="caption" colorScheme="secondary">
        {t("settings.browserTimezone")}: {browserTimezone}
      </Typography>
    </Stack>
  );
}
