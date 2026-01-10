"use client";

import { useState, use } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnimeDetailSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { LibraryStatusSelect } from "@/components/anime/LibraryStatusSelect";
import { CountdownBadge } from "@/components/anime/CountdownBadge";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAnimeDetail, upsertLibraryEntry, deleteLibraryEntry, getLibrary } from "@/lib/api";
import { getLocalizedTitle } from "@/lib/utils/text";
import { getAiringStatusLabel, getSecondsToAir } from "@/lib/utils/date";
import { toast } from "sonner";
import type { LibraryStatus } from "@/lib/types";

export default function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const animeId = parseInt(id, 10);
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>("watching");

  // Fetch anime detail
  const { data: anime, isLoading, error, refetch } = useQuery({
    queryKey: ["anime-detail", animeId],
    queryFn: () => getAnimeDetail(animeId),
  });

  // Fetch library to check if anime is already added
  const { data: libraryData } = useQuery({
    queryKey: ["library"],
    queryFn: getLibrary,
    enabled: !!user,
  });

  const libraryEntry = libraryData?.entries.find((e) => e.animeId === animeId);

  // Add/update library mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      await upsertLibraryEntry({ animeId, status: selectedStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      setDialogOpen(false);
      toast.success(t("anime.addToLibrary"));
    },
    onError: () => {
      toast.error(t("errors.generic"));
    },
  });

  // Remove from library mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      await deleteLibraryEntry(animeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("anime.removeFromLibrary"));
    },
    onError: () => {
      toast.error(t("errors.generic"));
    },
  });

  // Setup auth headers for API calls
  if (user) {
    import("@/lib/api").then(({ setAuthHeadersGetter }) => {
      setAuthHeadersGetter(getAuthHeaders);
    });
  }

  if (isLoading) return <AnimeDetailSkeleton />;
  if (error) return <ErrorBanner onRetry={() => refetch()} />;
  if (!anime) return <ErrorBanner message={t("errors.notFound")} />;

  const title = getLocalizedTitle(anime.title);
  const coverImage = anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.png";
  const airingTimestamp = anime.nextAiringAt
    ? Math.floor(new Date(anime.nextAiringAt).getTime() / 1000)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner */}
      {anime.bannerImage && (
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-xl md:h-64">
          <Image
            src={anime.bannerImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Cover Image */}
        <div className="shrink-0">
          <div className="relative mx-auto h-100 w-70 overflow-hidden rounded-lg shadow-xl md:mx-0">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {anime.title.english && anime.title.romaji !== anime.title.english && (
              <p className="mt-1 text-lg text-muted-foreground">{anime.title.romaji}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {anime.format && (
              <Badge>{t(`format.${anime.format}`)}</Badge>
            )}
            {anime.status && (
              <Badge variant="secondary">{t(`status.${anime.status}`)}</Badge>
            )}
            {anime.episodes && (
              <Badge variant="outline">
                {t("anime.episodes", { count: anime.episodes })}
              </Badge>
            )}
            {anime.season && anime.seasonYear && (
              <Badge variant="outline">
                {t(`calendar.${anime.season}`)} {anime.seasonYear}
              </Badge>
            )}
            {anime.isAdult && (
              <Badge variant="destructive">{t("anime.adult")}</Badge>
            )}
          </div>

          {/* Airing Info */}
          {airingTimestamp && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("anime.nextEpisode")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CountdownBadge
                  statusLabel={getAiringStatusLabel(airingTimestamp)}
                  secondsToAir={getSecondsToAir(airingTimestamp)}
                  nextEpisodeNumber={anime.nextEpisodeNumber}
                />
              </CardContent>
            </Card>
          )}

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">{t("anime.genres")}</h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {anime.description && (
            <div>
              <p className="text-muted-foreground">{anime.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {user && (
              <>
                {libraryEntry ? (
                  <div className="flex items-center gap-2">
                    <LibraryStatusSelect
                      value={libraryEntry.status}
                      onChange={(status) => {
                        setSelectedStatus(status);
                        addMutation.mutate();
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeMutation.mutate()}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("anime.addToLibrary")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("anime.addToLibrary")}</DialogTitle>
                        <DialogDescription>{title}</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <LibraryStatusSelect
                          value={selectedStatus}
                          onChange={setSelectedStatus}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => addMutation.mutate()}
                          disabled={addMutation.isPending}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {t("common.add")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
            
            {anime.siteUrl && (
              <Button variant="outline" asChild>
                <a href={anime.siteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("anime.viewOnAniList")}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
