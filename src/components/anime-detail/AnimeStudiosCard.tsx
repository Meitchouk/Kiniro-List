"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Typography, Stack } from "@/components/ds";

interface Studio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

interface AnimeStudiosCardProps {
  studios: Studio[];
}

/**
 * Card showing animation studios
 */
export function AnimeStudiosCard({ studios }: AnimeStudiosCardProps) {
  const t = useTranslations("anime");
  
  const animationStudios = studios.filter((s) => s.isAnimationStudio);
  if (animationStudios.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("studios")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap={2}>
          {animationStudios.map((studio, index) => (
            <Typography key={`studio-${studio.id}-${index}`} variant="body2" weight="medium">
              {studio.name}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
