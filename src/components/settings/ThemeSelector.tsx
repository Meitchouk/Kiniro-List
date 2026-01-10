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
import type { ThemePreference } from "@/lib/types";

interface ThemeSelectorProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
];

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const t = useTranslations();

  return (
    <Stack gap={2}>
      <Label htmlFor="theme">{t('settings.theme')}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="theme">
          <SelectValue placeholder={t('settings.selectTheme')} />
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Stack>
  );
}
