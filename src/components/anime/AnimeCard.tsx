"use client";

import { useTranslations } from "next-intl";
import { PosterCard } from "@/components/ds";
import { createAnimeSlug, getLocalizedTitle } from "@/lib/utils/text";
import type { AnimeCardProps } from "@/lib/types";

export function AnimeCard({ anime, showBadges = true, rank }: AnimeCardProps) {
  const t = useTranslations();

  const title = getLocalizedTitle(anime.title);
  const coverImage = anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.png";
  const slug = anime.slug || createAnimeSlug(title) || String(anime.id);

  return (
    <PosterCard
      href={`/anime/${slug}`}
      title={title}
      coverImage={coverImage}
      rank={rank}
      badges={
        showBadges
          ? [
              ...(anime.format
                ? [{ text: t(`format.${anime.format}`), variant: "secondary" as const }]
                : []),
              ...(anime.isAdult
                ? [{ text: t("anime.adult"), variant: "destructive" as const }]
                : []),
            ]
          : []
      }
      subtitle={anime.episodes ? t("anime.episodes", { count: anime.episodes }) : undefined}
    />
  );
}
