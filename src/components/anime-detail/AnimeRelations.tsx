"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Badge, Grid, Typography } from "@/components/ds";
import { getLocalizedTitle, createAnimeSlug } from "@/lib/utils/text";
import type { RelationEdge } from "@/lib/types";

interface AnimeRelationsProps {
  relations: RelationEdge[];
  maxItems?: number;
}

/**
 * Related anime card showing prequels, sequels, side stories, etc.
 */
export function AnimeRelations({ relations, maxItems = 6 }: AnimeRelationsProps) {
  const t = useTranslations();

  if (!relations || relations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("anime.relations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Grid cols={1} smCols={2} gap={4}>
          {relations.slice(0, maxItems).map((edge, index) => {
            const relTitle = getLocalizedTitle(edge.node.title);
            const relSlug = createAnimeSlug(relTitle);
            return (
              <Link
                key={`relation-${edge.node.id}-${index}`}
                href={`/anime/${relSlug}`}
                className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
                  <Image
                    src={edge.node.coverImage.large || "/placeholder.png"}
                    alt={getLocalizedTitle(edge.node.title)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Typography variant="caption" colorScheme="secondary">
                    {edge.relationType && t(`relationType.${edge.relationType}`)}
                  </Typography>
                  <Typography variant="body2" weight="medium" className="line-clamp-2">
                    {getLocalizedTitle(edge.node.title)}
                  </Typography>
                  {edge.node.format && (
                    <Badge variant="outline" className="text-xs">
                      {t(`format.${edge.node.format}`)}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
