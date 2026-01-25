"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button, Stack, Flex, Typography } from "@/components/ds";
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
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAnimeDetail,
  getAnimeIdBySlug,
  upsertLibraryEntry,
  deleteLibraryEntry,
  getLibrary,
} from "@/lib/api";
import { getLocalizedTitle, truncateText } from "@/lib/utils/text";
import { toast } from "sonner";
import type { LibraryStatus } from "@/lib/types";

export default function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>("watching");

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

  // Setup auth headers for API calls
  if (user) {
    import("@/lib/api").then(({ setAuthHeadersGetter }) => {
      setAuthHeadersGetter(getAuthHeaders);
    });
  }

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
          <div className="relative -mx-4 mb-8 h-56 w-screen overflow-hidden md:mx-0 md:h-64 md:rounded-xl lg:h-80">
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

        <Flex className="flex-col gap-8 lg:flex-row">
          {/* Left Column: Cover + Stats */}
          <Stack gap={6} className="order-2 shrink-0 lg:order-1 lg:w-80">
            {/* Cover Image */}
            <div className="relative mx-auto h-105 w-75 overflow-hidden rounded-lg shadow-xl">
              <OptimizedImage
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                priority
                sizes="300px"
              />
            </div>

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
            {/* Title */}
            <div>
              <Typography variant="h1" className="text-3xl md:text-4xl">
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

            {/* Add to Library Section */}
            {user && !libraryEntry && (
              <AddToLibrarySection
                onAdd={(status) => {
                  setSelectedStatus(status);
                  addMutation.mutate();
                }}
                isPending={addMutation.isPending}
              />
            )}

            {/* Library Actions */}
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
      </div>
    </Stack>
  );
}
