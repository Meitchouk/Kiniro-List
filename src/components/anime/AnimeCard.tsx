"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Typography } from "@/components/ds";
import { getLocalizedTitle } from "@/lib/utils/text";
import type { AnimeCardProps } from "@/lib/types";

export function AnimeCard({ anime, showBadges = true }: AnimeCardProps) {
  const t = useTranslations();

  const title = getLocalizedTitle(anime.title);
  const coverImage = anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.png";
  const slug = anime.slug || "";

  return (
    <Link href={`/anime/${slug}`}>
      <Card className="w-full group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-3/4 overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          {showBadges && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
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
            </div>
          )}
        </div>
        <CardContent className="p-3 h-32 flex flex-col">
          <Typography variant="body2" weight="medium" className="line-clamp-3 leading-tight flex-1">
            {title}
          </Typography>
          <Typography variant="caption" colorScheme="secondary" className="mt-1 h-4">
            {anime.episodes ? t("anime.episodes", { count: anime.episodes }) : "\u00A0"}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
