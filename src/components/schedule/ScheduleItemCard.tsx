"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Typography, Flex, Stack } from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { Clock } from "lucide-react";
import { getLocalizedTitle } from "@/lib/utils/text";
import { formatAiringTime } from "@/lib/utils/date";
import type { MediaTitle, MediaCoverImage, MediaFormat } from "@/lib/types";

interface ScheduleItemCardProps {
  title: MediaTitle;
  coverImage: MediaCoverImage;
  format?: MediaFormat | null;
  airingAt: number;
  episode: number;
  slug: string;
}

/**
 * Schedule item card for weekly schedule
 */
export function ScheduleItemCard({
  title,
  coverImage,
  format,
  airingAt,
  episode,
  slug,
}: ScheduleItemCardProps) {
  const t = useTranslations();
  const displayTitle = getLocalizedTitle(title);
  const cover = coverImage.large || "/placeholder.png";

  return (
    <Link href={`/anime/${slug}`} className="group">
      <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="flex gap-3 p-4">
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded">
            <OptimizedImage
              src={cover}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <Stack justify="between" className="flex min-w-0 flex-1">
            <div>
              <Typography
                variant="body2"
                weight="medium"
                className="group-hover:text-primary line-clamp-2"
              >
                {displayTitle}
              </Typography>
            </div>
            <Stack gap={1}>
              <Flex align="center" gap={2}>
                <Clock className="text-muted-foreground h-3 w-3" />
                <Typography variant="caption" colorScheme="secondary">
                  {formatAiringTime(airingAt)}
                </Typography>
              </Flex>
              <Flex align="center" gap={2}>
                <Badge variant="secondary" className="text-xs">
                  {t("airing.episode", { number: episode })}
                </Badge>
                {format && (
                  <Badge variant="outline" className="text-xs">
                    {t(`format.${format}`)}
                  </Badge>
                )}
              </Flex>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Link>
  );
}
