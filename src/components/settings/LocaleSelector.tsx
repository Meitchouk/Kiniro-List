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
import { LOCALES } from "@/lib/constants";
import type { Locale } from "@/lib/types";

interface LocaleSelectorProps {
  value: Locale;
  onChange: (value: Locale) => void;
}

export function LocaleSelector({ value, onChange }: LocaleSelectorProps) {
  const t = useTranslations();

  return (
    <Stack gap={2}>
      <Label htmlFor="locale">{t('settings.language')}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="locale">
          <SelectValue placeholder={t('settings.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              {locale.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Stack>
  );
}
