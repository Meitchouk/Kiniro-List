"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/utils/date";
import { getAiringBadgeVariant, getAiringLabelText } from "@/lib/utils/components";
import type { CountdownBadgeProps } from "@/lib/types";

export function CountdownBadge({
  statusLabel,
  secondsToAir,
  nextEpisodeNumber,
}: CountdownBadgeProps) {
  const t = useTranslations();
  const [countdown, setCountdown] = useState(secondsToAir || 0);

  useEffect(() => {
    if (statusLabel !== "airs_in" || !secondsToAir) return;

    setCountdown(secondsToAir);

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsToAir, statusLabel]);

  const getBadgeVariant = () => getAiringBadgeVariant(statusLabel);
  const getLabel = () => getAiringLabelText(statusLabel, countdown, t, formatCountdown);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getBadgeVariant()}>
        <Clock className="mr-1 h-3 w-3" />
        {getLabel()}
      </Badge>
      {nextEpisodeNumber && (
        <Badge variant="outline">
          {t("episode", { number: nextEpisodeNumber })}
        </Badge>
      )}
    </div>
  );
}
