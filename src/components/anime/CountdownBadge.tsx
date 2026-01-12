"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Badge, Flex } from "@/components/ds";
import { formatCountdown } from "@/lib/utils/date";
import { getAiringBadgeVariant, getAiringLabelText } from "@/lib/utils/components";
import type { CountdownBadgeProps } from "@/lib/types";

export function CountdownBadge({
  statusLabel,
  secondsToAir,
  nextEpisodeNumber,
  size = "default",
}: CountdownBadgeProps & { size?: "default" | "lg" }) {
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

  const sizeClasses = {
    default: "",
    lg: "px-3 py-1.5 text-sm font-semibold shadow-lg",
  };

  const iconClasses = {
    default: "mr-1 h-3 w-3",
    lg: "mr-1.5 h-4 w-4",
  };

  return (
    <Flex align="center" gap={2}>
      <Badge variant={getBadgeVariant()} className={sizeClasses[size]}>
        <Clock className={iconClasses[size]} />
        {getLabel()}
      </Badge>
      {nextEpisodeNumber && (
        <Badge variant="outline">{t("anime.episode", { number: nextEpisodeNumber })}</Badge>
      )}
    </Flex>
  );
}
