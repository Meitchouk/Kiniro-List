"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { 
  ExternalLink, 
  Plus, 
  Check, 
  Trash2, 
  Star,
  Heart,
  Clock,
  TrendingUp,
  Calendar,
  Play,
  Link as LinkIcon
} from "lucide-react";
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

  // Get animation studios
  const animationStudios = anime.studios?.nodes.filter((s) => s.isAnimationStudio) || [];

  // Format dates
  const startDate = anime.startDate && anime.startDate.year
    ? new Date(anime.startDate.year, (anime.startDate.month || 1) - 1, anime.startDate.day || 1)
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

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left Column: Cover + Stats */}
        <div className="shrink-0 space-y-6 lg:w-80">
          {/* Cover Image */}
          <div className="relative mx-auto h-105 w-75 overflow-hidden rounded-lg shadow-xl">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("anime.statistics")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {anime.averageScore && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>{t("anime.score")}</span>
                  </div>
                  <Badge variant="default" className="font-bold">
                    {anime.averageScore}%
                  </Badge>
                </div>
              )}
              {anime.popularity && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{t("anime.popularity")}</span>
                  </div>
                  <span className="font-semibold">#{anime.popularity.toLocaleString()}</span>
                </div>
              )}
              {anime.favourites && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{t("anime.favourites")}</span>
                  </div>
                  <span className="font-semibold">{anime.favourites.toLocaleString()}</span>
                </div>
              )}
              {anime.duration && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t("anime.duration")}</span>
                  </div>
                  <span className="font-semibold">{anime.duration} min</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Studios */}
          {animationStudios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("anime.studios")}</CardTitle>
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
          )}

          {/* Trailer */}
          {anime.trailer && anime.trailer.site && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("anime.trailer")}</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={
                    anime.trailer.site === "youtube"
                      ? `https://www.youtube.com/watch?v=${anime.trailer.id}`
                      : anime.trailer.site === "dailymotion"
                      ? `https://www.dailymotion.com/video/${anime.trailer.id}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-video overflow-hidden rounded-md">
                    <Image
                      src={anime.trailer.thumbnail || "/placeholder.png"}
                      alt="Trailer"
                      fill
                      className="object-cover transition-opacity hover:opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-90" />
                    </div>
                  </div>
                </a>
              </CardContent>
            </Card>
          )}

          {/* External Links */}
          {anime.externalLinks && anime.externalLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("anime.externalLinks")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {anime.externalLinks.slice(0, 8).map((link, index) => (
                  <a
                    key={`link-${link.id}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {link.site}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Main Content */}
        <div className="flex-1 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
            {anime.title.english && anime.title.romaji !== anime.title.english && (
              <p className="mt-1 text-lg text-muted-foreground">{anime.title.romaji}</p>
            )}
            {anime.title.native && (
              <p className="mt-1 text-base text-muted-foreground">{anime.title.native}</p>
            )}
          </div>

          {/* Info Badges */}
          <div className="flex flex-wrap gap-2">
            {anime.format && <Badge>{t(`format.${anime.format}`)}</Badge>}
            {anime.status && <Badge variant="secondary">{t(`status.${anime.status}`)}</Badge>}
            {anime.episodes && (
              <Badge variant="outline">{t("anime.episodes", { count: anime.episodes })}</Badge>
            )}
            {anime.season && anime.seasonYear && (
              <Badge variant="outline">
                {t(`calendar.${anime.season}`)} {anime.seasonYear}
              </Badge>
            )}
            {startDate && (
              <Badge variant="outline">
                <Calendar className="mr-1 h-3 w-3" />
                {startDate.toLocaleDateString()}
              </Badge>
            )}
            {anime.isAdult && <Badge variant="destructive">{t("anime.adult")}</Badge>}
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
                        <LibraryStatusSelect value={selectedStatus} onChange={setSelectedStatus} />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
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

          {/* Description */}
          {anime.description && (
            <Card>
              <CardHeader>
                <CardTitle>{t("anime.synopsis")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {anime.description.replace(/<br\s*\/?>/gi, "\n")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("anime.genres")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre, index) => (
                    <Badge key={`genre-${genre}-${index}`} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {anime.tags && anime.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("anime.tags")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {anime.tags
                    .filter((tag) => !tag.isMediaSpoiler && (tag.rank || 0) > 50)
                    .slice(0, 15)
                    .map((tag, index) => (
                      <Badge key={`tag-${tag.id}-${index}`} variant="outline" className="text-xs">
                        {tag.name} {tag.rank && `(${tag.rank}%)`}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relations */}
          {anime.relations && anime.relations.edges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("anime.relations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {anime.relations.edges.slice(0, 6).map((edge, index) => (
                    <Link
                      key={`relation-${edge.node.id}-${index}`}
                      href={`/anime/${edge.node.id}`}
                      className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
                        <Image
                          src={edge.node.coverImage.large || "/placeholder.png"}
                          alt={getLocalizedTitle(edge.node.title)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {edge.relationType && t(`relationType.${edge.relationType}`)}
                        </p>
                        <p className="line-clamp-2 text-sm font-medium">
                          {getLocalizedTitle(edge.node.title)}
                        </p>
                        {edge.node.format && (
                          <Badge variant="outline" className="text-xs">
                            {t(`format.${edge.node.format}`)}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {anime.recommendations && anime.recommendations.nodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("anime.recommendations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {anime.recommendations.nodes.slice(0, 6).map((rec, index) => {
                    const media = rec.mediaRecommendation;
                    return (
                      <Link
                        key={`recommendation-${media.id}-${index}`}
                        href={`/anime/${media.id}`}
                        className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
                          <Image
                            src={media.coverImage.large || "/placeholder.png"}
                            alt={getLocalizedTitle(media.title)}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="line-clamp-2 text-sm font-medium">
                            {getLocalizedTitle(media.title)}
                          </p>
                          <div className="flex items-center gap-2">
                            {media.averageScore && (
                              <Badge variant="default" className="text-xs">
                                <Star className="mr-1 h-3 w-3" />
                                {media.averageScore}%
                              </Badge>
                            )}
                            {media.format && (
                              <Badge variant="outline" className="text-xs">
                                {t(`format.${media.format}`)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

