"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { Play } from "lucide-react";

interface Trailer {
  id?: string | null;
  site?: string | null;
  thumbnail?: string | null;
}

interface AnimeTrailerCardProps {
  trailer: Trailer;
}

function getTrailerEmbedUrl(trailer: Trailer): string | null {
  if (!trailer.id || !trailer.site) return null;
  const site = trailer.site.toLowerCase();
  if (site === "youtube") return `https://www.youtube.com/embed/${trailer.id}`;
  if (site === "dailymotion") return `https://www.dailymotion.com/embed/video/${trailer.id}`;
  return null;
}

function getTrailerExternalUrl(trailer: Trailer): string {
  if (!trailer.id || !trailer.site) return "#";
  const site = trailer.site.toLowerCase();
  if (site === "youtube") return `https://www.youtube.com/watch?v=${trailer.id}`;
  if (site === "dailymotion") return `https://www.dailymotion.com/video/${trailer.id}`;
  return "#";
}

/**
 * Trailer card with embedded video player dialog
 */
export function AnimeTrailerCard({ trailer }: AnimeTrailerCardProps) {
  const t = useTranslations("anime");
  const [trailerOpen, setTrailerOpen] = useState(false);

  if (!trailer.id || !trailer.site) return null;

  const embedUrl = getTrailerEmbedUrl(trailer);
  const externalUrl = getTrailerExternalUrl(trailer);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{t("trailer")}</CardTitle>
          <Button asChild size="sm" variant="ghost" className="text-xs">
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              {t("openExternal")}
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={() => embedUrl && setTrailerOpen(true)}
          className="group border-border/60 bg-muted/40 relative block w-full overflow-hidden rounded-md border"
        >
          <div className="relative aspect-video overflow-hidden">
            <OptimizedImage
              src={trailer.thumbnail || "/placeholder.png"}
              alt={t("trailer")}
              fill
              className="object-cover transition duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
              <Play className="h-12 w-12 text-white drop-shadow" />
            </div>
          </div>
        </button>

        {embedUrl ? (
          <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
            <DialogContent className="border-border bg-background/95 max-w-5xl p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>{t("trailer")}</DialogTitle>
              </DialogHeader>
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <iframe
                  src={embedUrl}
                  title={t("trailer")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-muted-foreground mt-3 text-xs">{t("trailerUnavailableInline")}</p>
        )}
      </CardContent>
    </Card>
  );
}
