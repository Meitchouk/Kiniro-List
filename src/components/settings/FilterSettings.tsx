"use client";

import { useTranslations } from "next-intl";
import { Stack, Flex, Label, Switch, Typography } from "@/components/ds";
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
    <Stack gap={4}>
      <Flex align="center" justify="between">
        <Stack gap={1}>
          <Label htmlFor="hideAdult">{t("settings.hideAdult")}</Label>
          <Typography variant="caption" colorScheme="secondary">
            {t("settings.hideAdultDescription")}
          </Typography>
        </Stack>
        <Switch
          id="hideAdult"
          checked={filters.hideAdult}
          onCheckedChange={handleHideAdultChange}
        />
      </Flex>

      <Flex align="center" justify="between">
        <Stack gap={1}>
          <Label htmlFor="onlyWatching">{t("settings.onlyWatching")}</Label>
          <Typography variant="caption" colorScheme="secondary">
            {t("settings.onlyWatchingDescription")}
          </Typography>
        </Stack>
        <Switch
          id="onlyWatching"
          checked={filters.onlyWatching}
          onCheckedChange={handleOnlyWatchingChange}
        />
      </Flex>
    </Stack>
  );
}
