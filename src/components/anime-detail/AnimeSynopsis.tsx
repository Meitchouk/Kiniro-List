"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
          {description.replace(/<br\s*\/?>/gi, "\n")}
        </p>
      </CardContent>
    </Card>
  );
}
