"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, Badge, Typography } from "@/components/ds";
import { getLocalizedTitle } from "@/lib/utils/text";
import type { MediaTitle, MediaCoverImage, MediaFormat } from "@/lib/types";

interface MediaCardCompactProps {
  title: MediaTitle;
  coverImage: MediaCoverImage;
  format?: MediaFormat | null;
  slug: string;
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
  slug,
  badge,
  subtitle,
  rightContent,
}: MediaCardCompactProps) {
  const displayTitle = getLocalizedTitle(title);
  const cover = coverImage.large || "/placeholder.png";

  return (
    <Link href={`/anime/${slug}`} className="group">
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="flex">
          <div className="relative h-24 w-16 shrink-0">
            <Image src={cover} alt={displayTitle} fill className="object-cover" sizes="64px" />
          </div>
          <CardContent className="flex min-w-0 flex-1 flex-col justify-between p-3">
            <div>
              <Typography
                variant="body2"
                weight="medium"
                className="group-hover:text-primary line-clamp-2 transition-colors"
              >
                {displayTitle}
              </Typography>
              {subtitle && (
                <Typography variant="caption" colorScheme="secondary" className="mt-0.5">
                  {subtitle}
                </Typography>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
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
