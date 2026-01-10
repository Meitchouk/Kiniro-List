"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ds";
import { Star, Heart, Clock, TrendingUp } from "lucide-react";

interface AnimeStatsCardProps {
  averageScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  duration?: number | null;
}

/**
 * Stats card showing score, popularity, favourites and duration
 */
export function AnimeStatsCard({
  averageScore,
  popularity,
  favourites,
  duration,
}: AnimeStatsCardProps) {
  const t = useTranslations("anime");

  const hasStats = averageScore || popularity || favourites || duration;
  if (!hasStats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("statistics")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {averageScore && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{t("score")}</span>
            </div>
            <Badge variant="default" className="font-bold">
              {averageScore}%
            </Badge>
          </div>
        )}
        {popularity && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{t("popularity")}</span>
            </div>
            <span className="font-semibold">#{popularity.toLocaleString()}</span>
          </div>
        )}
        {favourites && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>{t("favourites")}</span>
            </div>
            <span className="font-semibold">{favourites.toLocaleString()}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{t("duration")}</span>
            </div>
            <span className="font-semibold">{duration} min</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
