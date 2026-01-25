"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, Badge, Typography, Stack, Flex } from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { CountdownBadge } from "@/components/anime/CountdownBadge";
import { CrunchyrollIcon } from "@/components/icons/CrunchyrollIcon";
import { Clock, Tv, PlayCircle, Star } from "lucide-react";
import { DateTime } from "luxon";
import { createAnimeSlug } from "@/lib/utils/text";
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
  const crunchyrollLink = streamingLinks?.find((link) => link.site.toLowerCase() === "crunchyroll");
  if (crunchyrollLink) {
    return { url: crunchyrollLink.url, isDirect: true };
  }
  return { url: getCrunchyrollSearchUrl(title), isDirect: false };
}

function formatAirTime(isoTime: string, timezone: string) {
  return DateTime.fromISO(isoTime).setZone(timezone).toFormat("HH:mm");
}

/**
 * Calendar item card for my calendar page - Enhanced design
 */
export function CalendarItemCard({ item, timezone, isUnknown = false }: CalendarItemCardProps) {
  const t = useTranslations();
  const animeTitle = item.anime?.title?.english || item.anime?.title?.romaji || "";
  const crunchyroll = getCrunchyrollLink(item.anime?.streamingLinks, animeTitle);
  const slug = item.anime?.slug || createAnimeSlug(animeTitle) || String(item.anime?.id || "");
  const coverImage = item.anime?.coverImage?.large;
  const totalEpisodes = item.anime?.episodes;
  const format = item.anime?.format;
  const genres = item.anime?.genres?.slice(0, 2);
  const airingAt = item.displayAiringAt || item.nextAiringAt;

  // Unknown state - simplified card
  if (isUnknown) {
    return (
      <Card className="group overflow-hidden opacity-70 transition-all hover:opacity-100">
        <div className="flex gap-3 p-3">
          <Link href={`/anime/${slug}`} className="shrink-0">
            <div className="relative h-20 w-14 overflow-hidden rounded-md">
              {coverImage ? (
                <OptimizedImage
                  src={coverImage}
                  alt={animeTitle}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="bg-muted h-full w-full" />
              )}
            </div>
          </Link>
          <Stack gap={1} className="min-w-0 flex-1">
            <Link href={`/anime/${slug}`}>
              <Typography
                variant="body2"
                weight="medium"
                className="hover:text-primary line-clamp-2 transition-colors"
              >
                {animeTitle}
              </Typography>
            </Link>
            <Typography variant="caption" colorScheme="secondary">
              {t("calendar.noAiringInfo")}
            </Typography>
          </Stack>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-primary/5 overflow-hidden transition-all hover:shadow-lg">
      <div className="flex">
        {/* Vertical Image Section */}
        <Link href={`/anime/${slug}`} className="relative shrink-0">
          <div className="relative h-48 w-32 overflow-hidden sm:h-56 sm:w-40">
            {coverImage ? (
              <OptimizedImage
                src={coverImage}
                alt={animeTitle}
                fill
                sizes="160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="bg-muted h-full w-full" />
            )}
            {/* Countdown Badge - On image */}
            {item.secondsToAir && item.secondsToAir > 0 && (
              <div className="absolute top-2 right-2">
                <CountdownBadge
                  statusLabel={item.statusLabel}
                  secondsToAir={item.secondsToAir}
                  size="lg"
                />
              </div>
            )}
          </div>
        </Link>

        {/* Content Section */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <Stack gap={2}>
            {/* Title */}
            <Link href={`/anime/${slug}`}>
              <Typography
                variant="body1"
                weight="semibold"
                className="hover:text-primary line-clamp-2 transition-colors"
              >
                {animeTitle}
              </Typography>
            </Link>

            {/* Episode & Air Time */}
            <Flex align="center" gap={2} className="flex-wrap">
              {item.nextEpisodeNumber && (
                <Badge className="bg-primary/90 text-primary-foreground border-0 text-sm font-semibold">
                  <PlayCircle className="mr-1 h-3.5 w-3.5" />
                  {t("anime.episode", { number: item.nextEpisodeNumber })}
                  {totalEpisodes && <span className="ml-1 opacity-70">/ {totalEpisodes}</span>}
                </Badge>
              )}
              {airingAt && (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatAirTime(airingAt, timezone)}
                </Badge>
              )}
            </Flex>

            {/* Meta Info Row */}
            <Flex align="center" gap={2} className="flex-wrap">
              {format && (
                <Badge variant="outline" className="text-xs">
                  <Tv className="mr-1 h-3 w-3" />
                  {t(`format.${format}`)}
                </Badge>
              )}
              {genres?.map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </Flex>
          </Stack>

          {/* Actions Row */}
          <Flex align="center" justify="between" className="mt-3">
            {/* Pinned indicator */}
            {item.pinned && (
              <Flex align="center" gap={1} className="text-xs text-yellow-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{t("calendar.pinned")}</span>
              </Flex>
            )}
            {!item.pinned && <div />}

            {/* Crunchyroll Link */}
            <a
              href={crunchyroll.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/20"
              title={
                crunchyroll.isDirect
                  ? t("calendar.watchOnCrunchyroll")
                  : t("calendar.searchOnCrunchyroll")
              }
            >
              <CrunchyrollIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {crunchyroll.isDirect
                  ? t("calendar.watchOnCrunchyroll")
                  : t("calendar.searchOnCrunchyroll")}
              </span>
            </a>
          </Flex>
        </div>
      </div>
    </Card>
  );
}
