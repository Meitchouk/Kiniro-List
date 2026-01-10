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
  
  // Filter animation studios and remove duplicates by ID
  const animationStudios = studios
    .filter((s) => s.isAnimationStudio)
    .filter((studio, index, self) => 
      index === self.findIndex((s) => s.id === studio.id)
    );
    
  if (animationStudios.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("studios")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap={2}>
          {animationStudios.map((studio) => (
            <Typography key={`studio-${studio.id}`} variant="body2" weight="medium">
              {studio.name}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
