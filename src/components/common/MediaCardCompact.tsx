"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, Badge, Typography } from "@/components/ds";
import { getLocalizedTitle, createAnimeSlug } from "@/lib/utils/text";
import type { MediaTitle, MediaCoverImage, MediaFormat } from "@/lib/types";

interface MediaCardCompactProps {
  title: MediaTitle;
  coverImage: MediaCoverImage;
  format?: MediaFormat | null;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  };
  subtitle?: string;
  rightContent?: React.ReactNode;
}

/**
 * Compact media card for lists (library, relations, recommendations, etc.)
 */
export function MediaCardCompact({
  title,
  coverImage,
  format,
  badge,
  subtitle,
  rightContent,
}: MediaCardCompactProps) {
  const displayTitle = getLocalizedTitle(title);
  const cover = coverImage.large || "/placeholder.png";
  const slug = createAnimeSlug(displayTitle);

  return (
    <Link href={`/anime/${slug}`} className="group">
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="flex">
          <div className="relative w-16 h-24 shrink-0">
            <Image
              src={cover}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <CardContent className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
              <Typography variant="body2" weight="medium" className="line-clamp-2 group-hover:text-primary transition-colors">
                {displayTitle}
              </Typography>
              {subtitle && (
                <Typography variant="caption" colorScheme="secondary" className="mt-0.5">{subtitle}</Typography>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="text-xs">
                  {badge.text}
                </Badge>
              )}
              {format && (
                <Badge variant="outline" className="text-xs">
                  {format}
                </Badge>
              )}
              {rightContent}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
