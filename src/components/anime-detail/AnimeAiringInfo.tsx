"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ds";
import { CountdownBadge } from "@/components/anime/CountdownBadge";
import { getAiringStatusLabel, getSecondsToAir } from "@/lib/utils/date";

interface AnimeAiringInfoProps {
  nextAiringAt: string;
  nextEpisodeNumber?: number | null;
}

/**
 * Next episode airing info with countdown
 */
export function AnimeAiringInfo({ nextAiringAt, nextEpisodeNumber }: AnimeAiringInfoProps) {
  const t = useTranslations("anime");

  const airingTimestamp = Math.floor(new Date(nextAiringAt).getTime() / 1000);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t("nextEpisode")}</CardTitle>
      </CardHeader>
      <CardContent>
        <CountdownBadge
          statusLabel={getAiringStatusLabel(airingTimestamp)}
          secondsToAir={getSecondsToAir(airingTimestamp)}
          nextEpisodeNumber={nextEpisodeNumber}
        />
      </CardContent>
    </Card>
  );
}
