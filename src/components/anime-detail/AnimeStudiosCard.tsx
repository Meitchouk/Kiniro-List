"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="space-y-2">
          {animationStudios.map((studio, index) => (
            <div key={`studio-${studio.id}-${index}`} className="text-sm font-medium">
              {studio.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
