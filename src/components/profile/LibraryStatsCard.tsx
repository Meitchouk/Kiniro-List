"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LibraryStats } from "@/lib/hooks/useProfile";

interface LibraryStatsCardProps {
  stats: LibraryStats;
}

export function LibraryStatsCard({ stats }: LibraryStatsCardProps) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("library.title")}</CardTitle>
        <CardDescription>{t("library.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            {t("library.watching")}: {stats.watching}
          </Badge>
          <Badge variant="secondary">
            {t("library.planned")}: {stats.planned}
          </Badge>
          <Badge variant="outline">
            {t("library.completed")}: {stats.completed}
          </Badge>
          <Badge variant="outline">
            {t("library.paused")}: {stats.paused}
          </Badge>
          <Badge variant="destructive">
            {t("library.dropped")}: {stats.dropped}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
