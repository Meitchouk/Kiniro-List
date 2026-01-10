"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          className="group relative block w-full overflow-hidden rounded-md border border-border/60 bg-muted/40"
        >
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={trailer.thumbnail || "/placeholder.png"}
              alt="Trailer"
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
            <DialogContent className="max-w-5xl border-border bg-background/95 p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>{t("trailer")}</DialogTitle>
              </DialogHeader>
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <iframe
                  src={embedUrl}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("trailerUnavailableInline")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
