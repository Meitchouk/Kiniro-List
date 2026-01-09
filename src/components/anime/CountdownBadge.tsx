"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/utils/date";
import type { AiringStatusLabel } from "@/lib/types";

interface CountdownBadgeProps {
  statusLabel: AiringStatusLabel;
  secondsToAir?: number;
  nextEpisodeNumber?: number | null;
}

export function CountdownBadge({
  statusLabel,
  secondsToAir,
  nextEpisodeNumber,
}: CountdownBadgeProps) {
  const t = useTranslations("airing");
  const [countdown, setCountdown] = useState(secondsToAir || 0);

  useEffect(() => {
    if (statusLabel !== "airs_in" || !secondsToAir) return;

    setCountdown(secondsToAir);

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsToAir, statusLabel]);

  const getBadgeVariant = () => {
    switch (statusLabel) {
      case "airs_today":
        return "success";
      case "airs_in":
        return "default";
      case "aired":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getLabel = () => {
    switch (statusLabel) {
      case "airs_today":
        return t("airs_today");
      case "airs_in":
        return t("airs_in", { time: formatCountdown(countdown) });
      case "aired":
        return t("aired");
      default:
        return t("unknown");
    }
  };

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
