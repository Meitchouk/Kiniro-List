"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Typography } from "@/components/ds";

interface AnimeSynopsisProps {
  description?: string | null;
}

/**
 * Synopsis/description card
 */
export function AnimeSynopsis({ description }: AnimeSynopsisProps) {
  const t = useTranslations("anime");

  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("synopsis")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Typography
          variant="body2"
          colorScheme="secondary"
          className="leading-relaxed whitespace-pre-line"
        >
          {description.replace(/<br\s*\/?>/gi, "\n")}
        </Typography>
      </CardContent>
    </Card>
  );
}
