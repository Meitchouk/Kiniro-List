"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Typography } from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { cn } from "@/lib/utils";

export interface PosterCardProps {
  href: string;
  title: string;
  coverImage: string;
  rank?: number;
  badges?: Array<{ text: string; variant?: "default" | "secondary" | "outline" | "destructive" }>;
  subtitle?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Design System PosterCard: standardized vertical media card used across lists/carousels.
 * Uses fixed dimensions to ensure consistent sizing regardless of content.
 * Image adapts to container via object-cover.
 */
export function PosterCard({
  href,
  title,
  coverImage,
  rank,
  badges,
  subtitle,
  className,
  priority = false,
}: PosterCardProps) {
  const t = useTranslations();
  const cover = coverImage || "/placeholder.png";

  return (
    <Link href={href} className="group block">
      <Card
        className={cn(
          // Fixed dimensions - width and height never change
          "h-85 w-50 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg",
          className
        )}
      >
        {/* Image area - fixed height, image adapts via object-cover */}
        <div className="relative h-62 w-full overflow-hidden">
          <OptimizedImage
            src={cover}
            alt={title}
            fill
            priority={priority}
            className="object-cover transition-transform group-hover:scale-105"
            sizes="200px"
          />

          {typeof rank === "number" && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shadow-md"
              style={{
                background:
                  rank === 1
                    ? "linear-gradient(135deg,#f59e0b,#fcd34d)"
                    : rank === 2
                      ? "linear-gradient(135deg,#9ca3af,#e5e7eb)"
                      : rank === 3
                        ? "linear-gradient(135deg,#b45309,#f59e0b)"
                        : "rgba(0,0,0,0.6)",
                color: rank === 1 || rank === 2 ? "#111827" : "#fff",
              }}
            >
              <span>{t("common.topRank", { rank })}</span>
            </div>
          )}

          {badges && badges.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {badges.map((b, i) => (
                <Badge key={i} variant={b.variant || "secondary"} className="text-xs">
                  {b.text}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content area - fixed height with clamped title */}
        <CardContent className="h-23 p-3">
          <Typography
            variant="body2"
            weight="medium"
            lineClamp={2}
            className="min-w-0 leading-tight wrap-break-word"
          >
            {title}
          </Typography>
          <Typography variant="caption" colorScheme="secondary" className="mt-1 truncate">
            {subtitle || "\u00A0"}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
