"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocalizedTitle } from "@/lib/utils/text";
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
        <div className="grid gap-4 sm:grid-cols-2">
          {relations.slice(0, maxItems).map((edge, index) => (
            <Link
              key={`relation-${edge.node.id}-${index}`}
              href={`/anime/${edge.node.id}`}
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
                <p className="text-xs text-muted-foreground">
                  {edge.relationType && t(`relationType.${edge.relationType}`)}
                </p>
                <p className="line-clamp-2 text-sm font-medium">
                  {getLocalizedTitle(edge.node.title)}
                </p>
                {edge.node.format && (
                  <Badge variant="outline" className="text-xs">
                    {t(`format.${edge.node.format}`)}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
