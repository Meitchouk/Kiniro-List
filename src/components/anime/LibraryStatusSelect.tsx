"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LibraryStatus } from "@/lib/types";

interface LibraryStatusSelectProps {
  value: LibraryStatus;
  onChange: (value: LibraryStatus) => void;
  disabled?: boolean;
}

const statuses: LibraryStatus[] = [
  "watching",
  "planned",
  "completed",
  "paused",
  "dropped",
];

export function LibraryStatusSelect({
  value,
  onChange,
  disabled,
}: LibraryStatusSelectProps) {
  const t = useTranslations("libraryStatus");

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
