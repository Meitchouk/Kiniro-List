"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Button, Typography, Flex } from "@/components/ds";
import { LibraryStatusSelect } from "@/components/anime/LibraryStatusSelect";
import { CrunchyrollIcon } from "@/components/icons/CrunchyrollIcon";
import { Trash2 } from "lucide-react";
import { createAnimeSlug } from "@/lib/utils/text";
import type { LibraryStatus, LibraryEntryWithAnime, StreamingLink } from "@/lib/types";

function getCrunchyrollLink(
  streamingLinks: StreamingLink[] | undefined
): { url: string; isDirect: boolean } | null {
  const crunchyrollLink = streamingLinks?.find((link) => link.site.toLowerCase() === "crunchyroll");
  if (crunchyrollLink) {
    return { url: crunchyrollLink.url, isDirect: true };
  }
  // Return null if no direct link - we don't want to show search for library
  return null;
}

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
  const crunchyroll = getCrunchyrollLink(item.anime?.streamingLinks);

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <Link href={`/anime/${slug}`} className="shrink-0">
          <div className="relative h-36 w-24">
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
          <Flex align="center" gap={2} className="mt-1 mb-2 flex-wrap">
            {item.anime?.format && (
              <Badge variant="outline" className="text-xs">
                {t(`format.${item.anime.format}`)}
              </Badge>
            )}
            {item.anime?.episodes && (
              <Typography variant="caption" colorScheme="secondary">
                {item.anime.episodes} {t("anime.episodes", { count: item.anime.episodes })}
              </Typography>
            )}
          </Flex>
          <Flex align="center" gap={2} wrap="wrap">
            <LibraryStatusSelect
              value={item.status as LibraryStatus}
              onChange={(status) => onStatusChange(item.animeId, status)}
              disabled={isUpdating}
            />
            {crunchyroll && (
              <a
                href={crunchyroll.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1.5 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/20"
                title={t("anime.watchOnCrunchyroll")}
              >
                <CrunchyrollIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.watch")}</span>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-8 w-8"
              onClick={() => onRemove(item.animeId)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Flex>
        </CardContent>
      </div>
    </Card>
  );
}
