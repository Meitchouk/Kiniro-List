"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [timezoneSearch, setTimezoneSearch] = useState('');

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
      const matchingZones = zones.filter(tzInfo =>
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
    setTimezoneSearch('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">{t('settings.timezone')}</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder={t('settings.selectTimezone')} />
        </SelectTrigger>
        <SelectContent className="max-h-100" position="popper" sideOffset={5}>
          {/* Search input */}
          <div className="px-2 pb-2 sticky top-0 bg-popover z-10 border-b">
            <div className="flex items-center gap-2 px-2 py-1.5 border rounded-md bg-background">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder={t('settings.searchTimezone')}
                value={timezoneSearch}
                onChange={(e) => setTimezoneSearch(e.target.value)}
                className="h-7 w-full bg-transparent outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-75 overflow-y-auto">
            {/* Detected timezone shortcut */}
            {!timezoneSearch && browserTimezone !== value && (
              <SelectItem value={browserTimezone} className="font-medium text-primary">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    📍 <span className="font-semibold">{getTimezoneInfo(browserTimezone).displayName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getTimezoneInfo(browserTimezone).currentTime} • {t('settings.detected')}
                  </span>
                </div>
              </SelectItem>
            )}

            {/* Grouped timezones */}
            {Object.entries(filteredTimezones).map(([region, zones]) => (
              <div key={region}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                  {region}
                </div>
                {zones
                  .filter((tzInfo) => !(!timezoneSearch && browserTimezone !== value && tzInfo.name === browserTimezone))
                  .map((tzInfo) => (
                    <SelectItem key={tzInfo.name} value={tzInfo.name}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">{tzInfo.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {tzInfo.currentTime}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </div>
            ))}

            {Object.keys(filteredTimezones).length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t('settings.noTimezones')}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('settings.browserTimezone')}: {browserTimezone}
      </p>
    </div>
  );
}
