"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Badge, Flex } from "@/components/ds";
import type { MediaTag } from "@/lib/types";

interface AnimeGenresProps {
  genres?: string[] | null;
  tags?: MediaTag[] | null;
}

/**
 * Genres and tags cards
 */
export function AnimeGenres({ genres, tags }: AnimeGenresProps) {
  const t = useTranslations("anime");

  const filteredTags = tags
    ?.filter((tag) => !tag.isMediaSpoiler && (tag.rank || 0) > 50)
    .slice(0, 15);

  return (
    <>
      {genres && genres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("genres")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Flex wrap="wrap" gap={2}>
              {genres.map((genre, index) => (
                <Badge key={`genre-${genre}-${index}`} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </Flex>
          </CardContent>
        </Card>
      )}

      {filteredTags && filteredTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("tags")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag, index) => (
                <Badge key={`tag-${tag.id}-${index}`} variant="outline" className="text-xs">
                  {tag.name} {tag.rank && `(${tag.rank}%)`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
