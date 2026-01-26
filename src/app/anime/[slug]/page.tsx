"use client";

import { useState, use, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink, Trash2, Play, Info, Heart } from "lucide-react";
import { CrunchyrollIcon } from "@/components/icons/CrunchyrollIcon";
import { Button, Stack, Flex, Typography } from "@/components/ds";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimeDetailSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { ErrorBanner } from "@/components/anime/ErrorBanner";
import { LibraryStatusSelect } from "@/components/anime/LibraryStatusSelect";
import {
  AnimeStatsCard,
  AnimeStudiosCard,
  AnimeTrailerCard,
  AnimeExternalLinks,
  AnimeRelations,
  AnimeRecommendations,
  AddToLibrarySection,
  AnimeInfoBadges,
  AnimeGenres,
  AnimeSynopsis,
  AnimeAiringInfo,
} from "@/components/anime-detail";
import { EpisodeList, VideoPlayer } from "@/components/streaming";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAnimeDetail,
  getAnimeIdBySlug,
  upsertLibraryEntry,
  deleteLibraryEntry,
  getLibrary,
  setAuthHeadersGetter,
} from "@/lib/api";
import { getLocalizedTitle, truncateText } from "@/lib/utils/text";
import { toast } from "sonner";
import type { LibraryStatus } from "@/lib/types";
import type { Episode } from "@/lib/types/streaming";

export default function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>("watching");
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [streamingAvailability, setStreamingAvailability] = useState<{
    isLoading: boolean;
    hasContent: boolean;
  }>({ isLoading: true, hasContent: false });

  // Setup auth headers for API calls (only once when user changes)
  useEffect(() => {
    if (user) {
      setAuthHeadersGetter(getAuthHeaders);
    }
  }, [user, getAuthHeaders]);

  // Resolve slug to anime ID
  const {
    data: animeId,
    isLoading: isLoadingSlug,
    error: slugError,
  } = useQuery({
    queryKey: ["anime-slug", slug],
    queryFn: () => getAnimeIdBySlug(slug),
    staleTime: Infinity, // Slug mappings don't change
  });

  // Fetch anime detail
  const {
    data: anime,
    isLoading: isLoadingAnime,
    error: animeError,
    refetch,
  } = useQuery({
    queryKey: ["anime-detail", animeId],
    queryFn: () => getAnimeDetail(animeId!),
    enabled: !!animeId,
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
      await upsertLibraryEntry({ animeId: animeId!, status: selectedStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("anime.addToLibrary"));
    },
  });

  // Remove from library mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      await deleteLibraryEntry(animeId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("anime.removeFromLibrary"));
    },
  });

  // Find official streaming links (Crunchyroll only for now)
  const officialStreamingLinks = useMemo(() => {
    if (!anime?.externalLinks) return [];

    const streamingSites = [{ name: "Crunchyroll", color: "#F47521" }];

    return anime.externalLinks
      .filter((link) => {
        const siteLower = link.site.toLowerCase();
        return streamingSites.some((s) => siteLower.includes(s.name.toLowerCase()));
      })
      .map((link) => {
        const siteInfo = streamingSites.find((s) =>
          link.site.toLowerCase().includes(s.name.toLowerCase())
        );
        return {
          ...link,
          brandColor: siteInfo?.color || link.color,
        };
      });
  }, [anime?.externalLinks]);

  const isLoading = isLoadingSlug || isLoadingAnime;
  const error = slugError || animeError;

  if (isLoading) return <AnimeDetailSkeleton />;
  if (slugError || !animeId) return <ErrorBanner message={t("errors.notFound")} />;
  if (error) return <ErrorBanner onRetry={() => refetch()} />;
  if (!anime) return <ErrorBanner message={t("errors.notFound")} />;

  const title = getLocalizedTitle(anime.title);
  const shortTitle = truncateText(anime.title.english || anime.title.romaji || "", 30);
  const coverImage = anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.png";

  return (
    <Stack className="min-h-screen">
      <PageHeader title={shortTitle} showBack={true} />

      <div className="container mx-auto px-4 py-8">
        {/* Banner */}
        {anime.bannerImage && (
          <div className="relative -mx-4 mb-8 h-56 overflow-hidden md:mx-0 md:h-64 md:rounded-xl lg:h-80">
            <OptimizedImage
              src={anime.bannerImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="from-background absolute inset-0 bg-linear-to-t to-transparent" />
          </div>
        )}

        {/* Header: Cover + Title + Basic Info */}
        <Flex className="mb-8 flex-col gap-6 md:flex-row">
          {/* Cover Image */}
          <div className="relative mx-auto h-72 w-48 shrink-0 overflow-hidden rounded-lg shadow-xl md:mx-0 md:h-80 md:w-56">
            <OptimizedImage
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="224px"
            />
          </div>

          {/* Title and Basic Info */}
          <Stack gap={4} className="flex-1">
            <div>
              <Typography variant="h1" className="text-2xl md:text-3xl lg:text-4xl">
                {title}
              </Typography>
              {anime.title.english && anime.title.romaji !== anime.title.english && (
                <Typography variant="body1" colorScheme="secondary" className="mt-1">
                  {anime.title.romaji}
                </Typography>
              )}
              {anime.title.native && (
                <Typography variant="body2" colorScheme="secondary" className="mt-1">
                  {anime.title.native}
                </Typography>
              )}
            </div>

            {/* Info Badges */}
            <AnimeInfoBadges
              format={anime.format}
              status={anime.status}
              episodes={anime.episodes}
              season={anime.season}
              seasonYear={anime.seasonYear}
              startDate={anime.startDate}
              isAdult={anime.isAdult}
            />

            {/* Airing Info */}
            {anime.nextAiringAt && (
              <AnimeAiringInfo
                nextAiringAt={anime.nextAiringAt}
                nextEpisodeNumber={anime.nextEpisodeNumber}
              />
            )}

            {/* Library Actions (visible in header for quick access) */}
            {user && !libraryEntry && (
              <AddToLibrarySection
                onAdd={(status) => {
                  setSelectedStatus(status);
                  addMutation.mutate();
                }}
                isPending={addMutation.isPending}
              />
            )}

            {libraryEntry && (
              <Flex gap={2} align="center">
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
              </Flex>
            )}
          </Stack>
        </Flex>

        {/* Tabs */}
        <Tabs defaultValue="watch" className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="watch" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {t("common.watch")}
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t("common.animeInfo")}
            </TabsTrigger>
          </TabsList>

          {/* Watch Tab */}
          <TabsContent value="watch">
            {/* Official Streaming Banner - Always visible when available */}
            {officialStreamingLinks.length > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-orange-500/30 bg-linear-to-r from-orange-500/10 to-amber-500/10 px-4 py-3">
                <Heart className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t("streaming.supportOfficial")}</span>
                  {officialStreamingLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: link.brandColor || "#F47521" }}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/95">
                        <CrunchyrollIcon
                          className="h-4 w-4"
                          style={{ color: link.brandColor || "#F47521" }}
                        />
                      </span>
                      <span>{link.site}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Show streaming section only when we have content or are loading */}
            {streamingAvailability.isLoading || streamingAvailability.hasContent ? (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {/* Video Player - visible when streaming is available */}
                <div className="w-full lg:sticky lg:top-4 lg:flex-1">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                    {selectedEpisode ? (
                      <VideoPlayer
                        episode={selectedEpisode}
                        animeTitle={title}
                        onClose={() => setSelectedEpisode(null)}
                        onNextEpisode={() => {
                          const currentIndex = episodes.findIndex(
                            (ep) => ep.id === selectedEpisode.id
                          );
                          if (currentIndex < episodes.length - 1) {
                            setSelectedEpisode(episodes[currentIndex + 1]);
                          }
                        }}
                        onPreviousEpisode={() => {
                          const currentIndex = episodes.findIndex(
                            (ep) => ep.id === selectedEpisode.id
                          );
                          if (currentIndex > 0) {
                            setSelectedEpisode(episodes[currentIndex - 1]);
                          }
                        }}
                        hasNextEpisode={
                          episodes.findIndex((ep) => ep.id === selectedEpisode.id) <
                          episodes.length - 1
                        }
                        hasPreviousEpisode={
                          episodes.findIndex((ep) => ep.id === selectedEpisode.id) > 0
                        }
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-white">
                        <Play className="mb-4 h-16 w-16 opacity-50" />
                        <Typography variant="body1" colorScheme="secondary">
                          {t("streaming.selectEpisode")}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>

                {/* Episodes List */}
                <div className="lg:border-border lg:bg-card w-full lg:h-[calc(100vh-8rem)] lg:w-80 lg:shrink-0 lg:overflow-hidden lg:rounded-lg lg:border">
                  <EpisodeList
                    animeId={animeId}
                    titleRomaji={anime.title.romaji}
                    titleEnglish={anime.title.english || undefined}
                    titleNative={anime.title.native || undefined}
                    format={anime.format || undefined}
                    totalEpisodes={anime.episodes || undefined}
                    year={anime.seasonYear || anime.startDate?.year || undefined}
                    relatedSeasons={anime.relations?.edges?.filter(
                      (e) => e.relationType === "SEQUEL" || e.relationType === "PREQUEL"
                    )}
                    allRelations={anime.relations?.edges}
                    onSelectEpisode={(episode, allEpisodes) => {
                      setSelectedEpisode(episode);
                      setEpisodes(allEpisodes);
                    }}
                    selectedEpisodeId={selectedEpisode?.id}
                    onAvailabilityChange={setStreamingAvailability}
                  />
                </div>
              </div>
            ) : (
              /* No streaming available - show friendly message */
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
                <Play className="mb-4 h-16 w-16 text-gray-400" />
                <Typography variant="h4" className="mb-2 text-gray-600 dark:text-gray-400">
                  {t("streaming.notAvailable") || "Streaming not available"}
                </Typography>
                <Typography
                  variant="body2"
                  colorScheme="secondary"
                  className="max-w-md text-center"
                >
                  {t("streaming.notAvailableDescription") ||
                    "We couldn't find streaming sources for this title. Try the official streaming services above if available."}
                </Typography>
              </div>
            )}
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <Flex className="flex-col gap-8 lg:flex-row">
              {/* Left Column: Stats */}
              <Stack gap={6} className="order-2 shrink-0 lg:order-1 lg:w-80">
                {/* Stats Card */}
                <AnimeStatsCard
                  averageScore={anime.averageScore}
                  popularity={anime.popularity}
                  favourites={anime.favourites}
                  duration={anime.duration}
                />

                {/* Studios */}
                {anime.studios?.nodes && <AnimeStudiosCard studios={anime.studios.nodes} />}

                {/* Trailer */}
                {anime.trailer && <AnimeTrailerCard trailer={anime.trailer} />}

                {/* External Links */}
                {anime.externalLinks && anime.externalLinks.length > 0 && (
                  <AnimeExternalLinks links={anime.externalLinks} />
                )}
              </Stack>

              {/* Right Column: Main Content */}
              <Stack gap={6} className="order-1 flex-1 lg:order-2">
                {/* External Link to AniList */}
                {anime.siteUrl && (
                  <Button variant="outline" asChild className="w-fit">
                    <a href={anime.siteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("anime.viewOnAniList")}
                    </a>
                  </Button>
                )}

                {/* Description */}
                {anime.description && <AnimeSynopsis description={anime.description} />}

                {/* Genres & Tags */}
                {(anime.genres?.length || anime.tags?.length) && (
                  <AnimeGenres genres={anime.genres} tags={anime.tags} />
                )}

                {/* Relations */}
                {anime.relations && anime.relations.edges.length > 0 && (
                  <AnimeRelations relations={anime.relations.edges} />
                )}

                {/* Recommendations */}
                {anime.recommendations && anime.recommendations.nodes.length > 0 && (
                  <AnimeRecommendations recommendations={anime.recommendations.nodes} />
                )}
              </Stack>
            </Flex>
          </TabsContent>
        </Tabs>
      </div>
    </Stack>
  );
}
