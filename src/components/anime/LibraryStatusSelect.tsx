"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBRARY_STATUSES } from "@/lib/constants";
import type { LibraryStatusSelectProps } from "@/lib/types";

export function LibraryStatusSelect({
  value,
  onChange,
  disabled,
}: LibraryStatusSelectProps) {
  const t = useTranslations("libraryStatus");

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-45">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LIBRARY_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
