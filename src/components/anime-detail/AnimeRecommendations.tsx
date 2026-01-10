"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { getLocalizedTitle } from "@/lib/utils/text";
import type { MediaTitle, MediaCoverImage, MediaFormat } from "@/lib/types";

interface RecommendationNode {
  mediaRecommendation: {
    id: number;
    title: MediaTitle;
    coverImage: MediaCoverImage;
    format?: MediaFormat | null;
    averageScore?: number | null;
  };
}

interface AnimeRecommendationsProps {
  recommendations: RecommendationNode[];
  maxItems?: number;
}

/**
 * Recommendations card showing similar anime
 */
export function AnimeRecommendations({ recommendations, maxItems = 6 }: AnimeRecommendationsProps) {
  const t = useTranslations();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("anime.recommendations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.slice(0, maxItems).map((rec, index) => {
            const media = rec.mediaRecommendation;
            return (
              <Link
                key={`recommendation-${media.id}-${index}`}
                href={`/anime/${media.id}`}
                className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
                  <Image
                    src={media.coverImage.large || "/placeholder.png"}
                    alt={getLocalizedTitle(media.title)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="line-clamp-2 text-sm font-medium">
                    {getLocalizedTitle(media.title)}
                  </p>
                  <div className="flex items-center gap-2">
                    {media.averageScore && (
                      <Badge variant="default" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        {media.averageScore}%
                      </Badge>
                    )}
                    {media.format && (
                      <Badge variant="outline" className="text-xs">
                        {t(`format.${media.format}`)}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
