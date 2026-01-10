"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LibraryItemCard } from "./LibraryItemCard";
import type { LibraryStatus, LibraryEntryWithAnime } from "@/lib/types";

const STATUSES: LibraryStatus[] = ["watching", "planned", "completed", "paused", "dropped"];

interface LibraryTabsProps {
  items: LibraryEntryWithAnime[];
  onStatusChange: (animeId: number, status: LibraryStatus) => void;
  onRemove: (animeId: number) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  defaultStatus?: LibraryStatus;
}

/**
 * Tabbed library view with status filters
 */
export function LibraryTabs({
  items,
  onStatusChange,
  onRemove,
  isUpdating = false,
  isDeleting = false,
  defaultStatus = "watching",
}: LibraryTabsProps) {
  const t = useTranslations();

  const getItemsByStatus = (status: string) =>
    items.filter((item) => item.status === status);

  return (
    <Tabs defaultValue={defaultStatus}>
      <TabsList className="mb-6 flex-wrap h-auto gap-2 bg-transparent p-0">
        {STATUSES.map((status) => (
          <TabsTrigger
            key={status}
            value={status}
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted border border-border rounded-md px-4 py-2"
          >
            {t(`library.${status}`)}
            <Badge variant="secondary" className="ml-1">
              {getItemsByStatus(status).length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {STATUSES.map((status) => (
        <TabsContent key={status} value={status}>
          {getItemsByStatus(status).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {t("library.emptyStatus", { status: t(`library.${status}`) })}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getItemsByStatus(status).map((item) => (
                <LibraryItemCard
                  key={item.animeId}
                  item={item}
                  onStatusChange={onStatusChange}
                  onRemove={onRemove}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
