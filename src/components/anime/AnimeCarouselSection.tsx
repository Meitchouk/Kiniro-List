"use client";

import type { ReactNode } from "react";
import { Section, Carousel, Flex, Badge, Typography } from "@/components/ds";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { AnimeCache } from "@/lib/types";

interface AnimeCarouselSectionProps {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  icon?: ReactNode;
  items: AnimeCache[];
  autoIntervalMs?: number;
}

/**
 * Anime Carousel Section - Uses DS Section + Carousel organisms
 * Displays a carousel of AnimeCards with optional title, subtitle, icon, and badge.
 */
export function AnimeCarouselSection({
  title,
  subtitle,
  badgeLabel,
  icon,
  items,
  autoIntervalMs = 5000,
}: AnimeCarouselSectionProps) {
  if (!items.length) return null;

  // Custom title with icon and badge
  const headerContent = (
    <Flex align="center" gap={2}>
      {icon}
      <Typography variant="h4">{title}</Typography>
      {badgeLabel && <Badge variant="secondary">{badgeLabel}</Badge>}
    </Flex>
  );

  return (
    <Section spacing="lg">
      {/* Header */}
      <div className="mb-4">{headerContent}</div>
      {subtitle && (
        <Typography variant="body2" colorScheme="secondary" className="mb-6">
          {subtitle}
        </Typography>
      )}

      {/* Carousel from DS */}
      <Carousel<AnimeCache>
        items={items}
        getKey={(anime) => anime.id}
        renderItem={(anime, idx) => <AnimeCard anime={anime} rank={idx + 1} />}
        autoIntervalMs={autoIntervalMs}
        maxPerSlide={6}
        gap={4}
      />
    </Section>
  );
}
