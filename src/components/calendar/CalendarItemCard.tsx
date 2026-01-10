"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Typography } from "@/components/ds";
import { CountdownBadge } from "@/components/anime/CountdownBadge";
import { CrunchyrollIcon } from "@/components/icons/CrunchyrollIcon";
import { Clock } from "lucide-react";
import { DateTime } from "luxon";
import type { CalendarAnimeItem, StreamingLink } from "@/lib/types";

interface CalendarItemCardProps {
  item: CalendarAnimeItem;
  timezone: string;
  isUnknown?: boolean;
}

function getCrunchyrollSearchUrl(title: string) {
  const searchQuery = encodeURIComponent(title);
  return `https://www.crunchyroll.com/search?q=${searchQuery}`;
}

function getCrunchyrollLink(
  streamingLinks: StreamingLink[] | undefined,
  title: string
): { url: string; isDirect: boolean } {
  const crunchyrollLink = streamingLinks?.find(
    (link) => link.site.toLowerCase() === "crunchyroll"
  );
  if (crunchyrollLink) {
    return { url: crunchyrollLink.url, isDirect: true };
  }
  return { url: getCrunchyrollSearchUrl(title), isDirect: false };
}

function formatAirTime(isoTime: string, timezone: string) {
  return DateTime.fromISO(isoTime).setZone(timezone).toFormat("HH:mm");
}

/**
 * Calendar item card for my calendar page
 */
export function CalendarItemCard({ item, timezone, isUnknown = false }: CalendarItemCardProps) {
  const t = useTranslations();
  const animeTitle = item.anime?.title?.english || item.anime?.title?.romaji || "";
  const crunchyroll = getCrunchyrollLink(item.anime?.streamingLinks, animeTitle);
  const slug = item.anime?.slug || "";

  return (
    <Card className={`overflow-hidden hover:bg-accent/50 transition-colors ${isUnknown ? "opacity-60" : ""}`}>
      <div className="flex h-full">
        <Link href={`/anime/${slug}`} className="shrink-0">
          <div className="relative w-16 h-24 md:w-14 md:h-20">
            {item.anime?.coverImage?.large ? (
              <Image
                src={item.anime.coverImage.large}
                alt={animeTitle}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
        </Link>
        <CardContent className="flex-1 p-2 md:p-2.5 flex flex-col justify-between min-w-0">
          {isUnknown ? (
            <>
              <Link href={`/anime/${slug}`} className="min-w-0">
                <Typography variant="body2" weight="medium" className="line-clamp-1 hover:text-primary transition-colors">
                  {animeTitle}
                </Typography>
              </Link>
              <Typography variant="caption" colorScheme="secondary" className="mt-1">
                {t("calendar.noAiringInfo")}
              </Typography>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/anime/${slug}`} className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                    {animeTitle}
                  </h3>
                </Link>
                {item.secondsToAir && item.secondsToAir > 0 && (
                  <CountdownBadge
                    statusLabel={item.statusLabel}
                    secondsToAir={item.secondsToAir}
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.nextAiringAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatAirTime(item.nextAiringAt, timezone)}
                    </span>
                  )}
                  {item.nextEpisodeNumber && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {t("anime.episode", { number: item.nextEpisodeNumber })}
                    </Badge>
                  )}
                </div>
                <a
                  href={crunchyroll.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 transition-colors"
                  title={crunchyroll.isDirect ? t("calendar.watchOnCrunchyroll") : t("calendar.searchOnCrunchyroll")}
                >
                  <CrunchyrollIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {crunchyroll.isDirect ? t("calendar.watchOnCrunchyroll") : t("calendar.searchOnCrunchyroll")}
                  </span>
                </a>
              </div>
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
