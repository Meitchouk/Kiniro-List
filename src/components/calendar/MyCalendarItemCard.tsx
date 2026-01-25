"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Typography, Flex, Stack } from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { Clock, CheckCircle } from "lucide-react";
import { getLocalizedTitle } from "@/lib/utils/text";
import { formatAiringTime } from "@/lib/utils/date";
import type { MyCalendarScheduleItem } from "@/lib/types";

interface MyCalendarItemCardProps {
  item: MyCalendarScheduleItem;
  timezone: string;
}

/**
 * Calendar item card for my calendar page - shows aired status
 */
export function MyCalendarItemCard({ item, timezone }: MyCalendarItemCardProps) {
  const t = useTranslations();
  const displayTitle = getLocalizedTitle(item.anime.title);
  const cover = item.anime.coverImage.large || "/placeholder.png";
  const slug = item.anime.slug || String(item.anime.id);

  return (
    <Link href={`/anime/${slug}`} className="group">
      <Card
        className={`h-full transition-all hover:-translate-y-1 hover:shadow-lg ${
          item.isAired ? "opacity-75" : ""
        }`}
      >
        <CardContent className="flex gap-3 p-4">
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded">
            <OptimizedImage
              src={cover}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
            {item.isAired && (
              <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
                <CheckCircle className="text-primary h-6 w-6" />
              </div>
            )}
          </div>
          <Stack justify="between" className="flex min-w-0 flex-1">
            <div>
              <Typography
                variant="body2"
                weight="medium"
                className={`group-hover:text-primary line-clamp-2 ${
                  item.isAired ? "text-muted-foreground" : ""
                }`}
              >
                {displayTitle}
              </Typography>
            </div>
            <Stack gap={1}>
              <Flex align="center" gap={2}>
                <Clock className="text-muted-foreground h-3 w-3" />
                <Typography variant="caption" colorScheme="secondary">
                  {formatAiringTime(item.airingAt, timezone)}
                </Typography>
              </Flex>
              <Flex align="center" gap={2} className="flex-wrap">
                <Badge variant={item.isAired ? "outline" : "secondary"} className="text-xs">
                  {t("airing.episode", { number: item.episode })}
                </Badge>
                {item.isAired ? (
                  <Badge variant="default" className="bg-primary/80 text-xs">
                    {t("calendar.aired")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {t(`library.status.${item.libraryStatus}`)}
                  </Badge>
                )}
                {item.pinned && (
                  <Badge variant="outline" className="text-xs">
                    📌
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
