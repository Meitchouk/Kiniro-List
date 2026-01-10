"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getLocalizedTitle } from "@/lib/utils/text";
import { formatAiringTime } from "@/lib/utils/date";
import type { MediaTitle, MediaCoverImage, MediaFormat } from "@/lib/types";

interface ScheduleItemCardProps {
  id: number;
  title: MediaTitle;
  coverImage: MediaCoverImage;
  format?: MediaFormat | null;
  airingAt: number;
  episode: number;
}

/**
 * Schedule item card for weekly schedule
 */
export function ScheduleItemCard({
  id,
  title,
  coverImage,
  format,
  airingAt,
  episode,
}: ScheduleItemCardProps) {
  const t = useTranslations();
  const displayTitle = getLocalizedTitle(title);
  const cover = coverImage.large || "/placeholder.png";

  return (
    <Link href={`/anime/${id}`} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="flex gap-3 p-4">
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded">
            <Image
              src={cover}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                {displayTitle}
              </h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatAiringTime(airingAt)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t("airing.episode", { number: episode })}
                </Badge>
                {format && (
                  <Badge variant="outline" className="text-xs">
                    {t(`format.${format}`)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
