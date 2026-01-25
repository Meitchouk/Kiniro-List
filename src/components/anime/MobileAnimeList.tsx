"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, Badge, Typography, Stack, Flex } from "@/components/ds";
import { Skeleton } from "@/components/ui/skeleton";
import { createAnimeSlug, getLocalizedTitle } from "@/lib/utils/text";
import { cn } from "@/lib/utils";
import type { AnimeCache } from "@/lib/types";

interface MobileAnimeCardProps {
  anime: AnimeCache;
  priority?: boolean;
}

/**
 * Compact horizontal card for mobile anime lists
 * Shows cover image on left, details on right
 */
function MobileAnimeCard({ anime, priority = false }: MobileAnimeCardProps) {
  const t = useTranslations();

  const title = getLocalizedTitle(anime.title);
  const coverImage = anime.coverImage.large || anime.coverImage.extraLarge || "/placeholder.png";
  const slug = anime.slug || createAnimeSlug(title) || String(anime.id);

  return (
    <Link href={`/anime/${slug}`} className="block">
      <Card className="hover:bg-muted/50 overflow-hidden transition-colors">
        <div className="flex">
          {/* Cover image */}
          <div className="relative h-28 w-20 shrink-0">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
              priority={priority}
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
            {/* Title */}
            <Typography variant="body2" weight="medium" className="line-clamp-2 leading-tight">
              {title}
            </Typography>

            {/* Badges and info */}
            <Flex align="center" gap={2} className="mt-2 flex-wrap">
              {anime.format && (
                <Badge variant="secondary" className="text-xs">
                  {t(`format.${anime.format}`)}
                </Badge>
              )}
              {anime.isAdult && (
                <Badge variant="destructive" className="text-xs">
                  {t("anime.adult")}
                </Badge>
              )}
            </Flex>

            {/* Episodes / Status */}
            <Flex align="center" gap={2} className="mt-1">
              {anime.episodes && (
                <Typography variant="caption" colorScheme="secondary">
                  {t("anime.episodes", { count: anime.episodes })}
                </Typography>
              )}
              {anime.status && (
                <Typography variant="caption" colorScheme="secondary">
                  • {t(`status.${anime.status}`)}
                </Typography>
              )}
            </Flex>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Skeleton for a single mobile anime card
 */
function MobileAnimeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Cover skeleton */}
        <Skeleton className="h-28 w-20 shrink-0 rounded-none" />

        {/* Content skeleton */}
        <div className="flex flex-1 flex-col justify-between p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MobileAnimeListProps {
  anime: AnimeCache[];
  className?: string;
}

/**
 * Mobile-optimized anime list with compact horizontal cards
 * Uses full width efficiently without wasting space
 */
export function MobileAnimeList({ anime, className }: MobileAnimeListProps) {
  return (
    <Stack gap={3} className={cn("md:hidden", className)}>
      {anime.map((item, index) => (
        <MobileAnimeCard key={item.id} anime={item} priority={index < 3} />
      ))}
    </Stack>
  );
}

interface MobileAnimeListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader for MobileAnimeList
 */
export function MobileAnimeListSkeleton({ count = 8, className }: MobileAnimeListSkeletonProps) {
  return (
    <Stack gap={3} className={cn("md:hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MobileAnimeCardSkeleton key={i} />
      ))}
    </Stack>
  );
}

// Export individual components for flexibility
export { MobileAnimeCard, MobileAnimeCardSkeleton };
