"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Button, Typography, Flex } from "@/components/ds";
import { LibraryStatusSelect } from "@/components/anime/LibraryStatusSelect";
import { Trash2 } from "lucide-react";
import { createAnimeSlug } from "@/lib/utils/text";
import type { LibraryStatus, LibraryEntryWithAnime } from "@/lib/types";

interface LibraryItemCardProps {
  item: LibraryEntryWithAnime;
  onStatusChange: (animeId: number, status: LibraryStatus) => void;
  onRemove: (animeId: number) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

/**
 * Library item card showing anime with status controls
 */
export function LibraryItemCard({
  item,
  onStatusChange,
  onRemove,
  isUpdating = false,
  isDeleting = false,
}: LibraryItemCardProps) {
  const t = useTranslations();

  const title = item.anime?.title?.english || item.anime?.title?.romaji || `Anime #${item.animeId}`;
  const coverImage = item.anime?.coverImage?.large;
  const slug = item.anime?.slug || createAnimeSlug(title) || String(item.anime?.id || item.animeId);

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <Link href={`/anime/${slug}`} className="shrink-0">
          <div className="relative h-32 w-24">
            {coverImage ? (
              <Image src={coverImage} alt={title} fill className="object-cover" />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground text-xs">{t("common.noImage")}</span>
              </div>
            )}
          </div>
        </Link>
        <CardContent className="flex-1 p-3">
          <Link href={`/anime/${slug}`}>
            <Typography
              variant="body2"
              weight="medium"
              className="hover:text-primary line-clamp-2 transition-colors"
            >
              {title}
            </Typography>
          </Link>
          <Flex align="center" gap={2} className="mt-1 mb-2">
            {item.anime?.format && (
              <Badge variant="outline" className="text-xs">
                {item.anime.format}
              </Badge>
            )}
            {item.anime?.episodes && (
              <Typography variant="caption" colorScheme="secondary">
                {item.anime.episodes} {t("anime.episodes", { count: item.anime.episodes })}
              </Typography>
            )}
          </Flex>
          <div className="flex items-center gap-2">
            <LibraryStatusSelect
              value={item.status as LibraryStatus}
              onChange={(status) => onStatusChange(item.animeId, status)}
              disabled={isUpdating}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-8 w-8"
              onClick={() => onRemove(item.animeId)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
