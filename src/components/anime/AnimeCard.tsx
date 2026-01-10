"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnimeCache } from "@/lib/types";
import { getLocalizedTitle } from "@/lib/utils/text";

interface AnimeCardProps {
  anime: AnimeCache;
  showBadges?: boolean;
}

export function AnimeCard({ anime, showBadges = true }: AnimeCardProps) {
  const t = useTranslations();

  const title = getLocalizedTitle(anime.title);
  const coverImage = anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.png";

  return (
    <Link href={`/anime/${anime.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
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
        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
            {title}
          </h3>
          {anime.episodes && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("anime.episodes", { count: anime.episodes })}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
