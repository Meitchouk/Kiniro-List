"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { UserFilters } from "@/lib/types";

interface FilterSettingsProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
}

export function FilterSettings({ filters, onChange }: FilterSettingsProps) {
  const t = useTranslations();

  const handleHideAdultChange = (checked: boolean) => {
    onChange({ ...filters, hideAdult: checked });
  };

  const handleOnlyWatchingChange = (checked: boolean) => {
    onChange({ ...filters, onlyWatching: checked });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="hideAdult">{t('settings.hideAdult')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('settings.hideAdultDescription')}
          </p>
        </div>
        <Switch
          id="hideAdult"
          checked={filters.hideAdult}
          onCheckedChange={handleHideAdultChange}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="onlyWatching">{t('settings.onlyWatching')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('settings.onlyWatchingDescription')}
          </p>
        </div>
        <Switch
          id="onlyWatching"
          checked={filters.onlyWatching}
          onCheckedChange={handleOnlyWatchingChange}
        />
      </div>
    </div>
  );
}
