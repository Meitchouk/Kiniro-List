"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Button, Grid } from "@/components/ds";
import type { LibraryStatus } from "@/lib/types";

interface AddToLibrarySectionProps {
  onAdd: (status: LibraryStatus) => void;
  isPending: boolean;
}

const LIBRARY_BUTTON_STYLES = {
  watching: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600/10",
  planned: "border-2 border-amber-600 text-amber-600 hover:bg-amber-600/10",
  completed: "border-2 border-green-600 text-green-600 hover:bg-green-600/10",
  paused: "border-2 border-gray-600 text-gray-600 hover:bg-gray-600/10",
  dropped: "border-2 border-red-600 text-red-600 hover:bg-red-600/10",
} as const;

const STATUSES: LibraryStatus[] = ["watching", "planned", "completed", "paused", "dropped"];

/**
 * Add to library section with status buttons
 */
export function AddToLibrarySection({ onAdd, isPending }: AddToLibrarySectionProps) {
  const t = useTranslations();

  return (
    <Card className="border-primary/30 border-2">
      <CardHeader>
        <CardTitle className="text-base">{t("anime.addToLibrary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Grid cols={3} mdCols={5} gap={2}>
          {STATUSES.map((status) => (
            <Button
              key={status}
              variant="outline"
              onClick={() => onAdd(status)}
              disabled={isPending}
              className={LIBRARY_BUTTON_STYLES[status]}
            >
              {t(`library.${status}`)}
            </Button>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
