"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LibraryStatusSelect } from "@/components/anime/LibraryStatusSelect";
import { Trash2 } from "lucide-react";
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

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <Link href={`/anime/${item.animeId}`} className="shrink-0">
          <div className="relative w-24 h-32">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">{t("common.noImage")}</span>
              </div>
            )}
          </div>
        </Link>
        <CardContent className="flex-1 p-3">
          <Link href={`/anime/${item.animeId}`}>
            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 mb-2">
            {item.anime?.format && (
              <Badge variant="outline" className="text-xs">
                {item.anime.format}
              </Badge>
            )}
            {item.anime?.episodes && (
              <span className="text-xs text-muted-foreground">
                {item.anime.episodes} {t("anime.episodes", { count: item.anime.episodes })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LibraryStatusSelect
              value={item.status as LibraryStatus}
              onChange={(status) => onStatusChange(item.animeId, status)}
              disabled={isUpdating}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
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
