/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Server,
  AlertTriangle,
  CheckCircle,
  Layers,
  Film,
  Tv,
  Play,
  Sparkles,
} from "lucide-react";
import { Button, Badge, Skeleton } from "@/components/ds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { getAnimeEpisodes, getAnimeDetail } from "@/lib/api";
import type { Episode, ProviderResult } from "@/lib/types/streaming";
import type { RelationEdge } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLocalizedTitle } from "@/lib/utils/text";

/** Season info for the selector */
interface SeasonInfo {
  id: number;
  title: string;
  titleRomaji?: string;
  titleEnglish?: string;
  titleNative?: string;
  seasonNumber: number;
  isCurrent: boolean;
  format?: string | null;
  coverImage?: string | null;
}

/** Related anime that we can play (anime and movies only) */
interface RelatedAnimeInfo {
  id: number;
  title: string;
  coverImage?: string | null;
  format?: string | null;
  relationType: string;
}

interface EpisodeListProps {
  animeId: number;
  onSelectEpisode: (episode: Episode, allEpisodes: Episode[]) => void;
  selectedEpisodeId?: string | null;
  /** Anime title in romaji for HiAnime search */
  titleRomaji?: string;
  /** Anime title in english for HiAnime search */
  titleEnglish?: string;
  /** Anime title in native language for HiAnime search */
  titleNative?: string;
  /** Anime format (TV, MOVIE, OVA, etc.) for better matching */
  format?: string;
  /** Total episodes count for better matching */
  totalEpisodes?: number;
  /** Air date year for better matching */
  year?: number;
  /** Related anime (prequels/sequels) for season navigation */
  relatedSeasons?: RelationEdge[];
  /** All related anime for the related section */
  allRelations?: RelationEdge[];
  /** Callback when availability changes (loading, hasContent, error) */
  onAvailabilityChange?: (state: { isLoading: boolean; hasContent: boolean }) => void;
}

const EPISODES_PER_PAGE = 24;

/** Maximum depth to search for related seasons */
const MAX_SEASON_DEPTH = 10;

/** Relation types we support (anime only, no manga/music) */
const SUPPORTED_RELATION_TYPES = [
  "PREQUEL",
  "SEQUEL",
  "SIDE_STORY",
  "SPIN_OFF",
  "ALTERNATIVE",
  "PARENT",
  "CHARACTER",
];

/** Format types we support */
const SUPPORTED_FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA"];

/**
 * Recursively fetch all seasons in a franchise by following PREQUEL/SEQUEL relations
 */
async function fetchAllSeasons(
  startId: number,
  startTitle: string,
  startTitleRomaji?: string,
  startTitleEnglish?: string,
  startTitleNative?: string,
  initialRelations?: RelationEdge[]
): Promise<SeasonInfo[]> {
  const visited = new Set<number>();
  const allSeasons: SeasonInfo[] = [];

  // Helper to add a season
  const addSeason = (
    id: number,
    title: string,
    titleRomaji?: string,
    titleEnglish?: string,
    titleNative?: string,
    isCurrent: boolean = false
  ) => {
    if (!visited.has(id)) {
      visited.add(id);
      allSeasons.push({
        id,
        title,
        titleRomaji,
        titleEnglish,
        titleNative,
        seasonNumber: 0, // Will be assigned later
        isCurrent,
      });
    }
  };

  // Add the starting anime
  addSeason(startId, startTitle, startTitleRomaji, startTitleEnglish, startTitleNative, true);

  // Process initial relations
  const prequelsToFetch: number[] = [];

  if (initialRelations) {
    for (const rel of initialRelations) {
      if (rel.node.type !== "ANIME") continue;

      const relTitle = getLocalizedTitle(rel.node.title);
      addSeason(
        rel.node.id,
        relTitle,
        rel.node.title.romaji || undefined,
        rel.node.title.english || undefined,
        rel.node.title.native || undefined
      );

      // Only need to fetch prequels recursively to find season 1
      // Sequels are already added above and don't need recursive expansion
      if (rel.relationType === "PREQUEL") {
        prequelsToFetch.push(rel.node.id);
      }
    }
  }

  // Recursively fetch prequels (go backwards to find season 1)
  let depth = 0;
  let currentPrequels = [...prequelsToFetch];

  while (currentPrequels.length > 0 && depth < MAX_SEASON_DEPTH) {
    const nextPrequels: number[] = [];

    for (const prequelId of currentPrequels) {
      if (visited.has(prequelId)) continue;

      try {
        const animeData = await getAnimeDetail(prequelId);
        if (!animeData) continue;

        const title = getLocalizedTitle(animeData.title);
        addSeason(
          animeData.id,
          title,
          animeData.title.romaji || undefined,
          animeData.title.english || undefined,
          animeData.title.native || undefined
        );

        // Find this anime's prequel
        const prequel = animeData.relations?.edges?.find(
          (e) => e.relationType === "PREQUEL" && e.node.type === "ANIME"
        );

        if (prequel && !visited.has(prequel.node.id)) {
          const prequelTitle = getLocalizedTitle(prequel.node.title);
          addSeason(
            prequel.node.id,
            prequelTitle,
            prequel.node.title.romaji || undefined,
            prequel.node.title.english || undefined,
            prequel.node.title.native || undefined
          );
          nextPrequels.push(prequel.node.id);
        }
      } catch (error) {
        console.warn(`[Seasons] Failed to fetch prequel ${prequelId}:`, error);
      }
    }

    currentPrequels = nextPrequels;
    depth++;
  }

  // Sort seasons: we need to determine order based on prequel/sequel chain
  // The one with no prequel is season 1
  // For now, sort by ID (older anime typically have lower IDs)
  allSeasons.sort((a, b) => a.id - b.id);

  // Assign season numbers
  allSeasons.forEach((s, idx) => {
    s.seasonNumber = idx + 1;
  });

  return allSeasons;
}

/**
 * Episode list component with provider support
 * Loads episodes from HiAnime with season navigation
 */
export function EpisodeList({
  animeId,
  onSelectEpisode,
  selectedEpisodeId,
  titleRomaji,
  titleEnglish,
  titleNative,
  format,
  totalEpisodes: expectedEpisodes,
  year,
  relatedSeasons,
  allRelations,
  onAvailabilityChange,
}: EpisodeListProps) {
  const t = useTranslations("streaming");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [visibleEpisodes, setVisibleEpisodes] = useState(EPISODES_PER_PAGE);
  const [showRelated, setShowRelated] = useState(false);

  // Seasons state (loaded async)
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  // Track selected season (default to current anime)
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(animeId);

  // Filter related anime to only supported types (anime/movies, not manga/music)
  const supportedRelatedAnime = useMemo<RelatedAnimeInfo[]>(() => {
    if (!allRelations) return [];

    return allRelations
      .filter((rel) => {
        // Only ANIME type
        if (rel.node.type !== "ANIME") return false;
        // Only supported relation types
        if (!rel.relationType || !SUPPORTED_RELATION_TYPES.includes(rel.relationType)) return false;
        // Only supported formats (exclude music, manga adaptations etc)
        if (rel.node.format && !SUPPORTED_FORMATS.includes(rel.node.format)) return false;
        // Exclude prequels/sequels as they're in the season selector
        if (rel.relationType === "PREQUEL" || rel.relationType === "SEQUEL") return false;
        return true;
      })
      .map((rel) => ({
        id: rel.node.id,
        title: getLocalizedTitle(rel.node.title),
        coverImage: rel.node.coverImage.large || rel.node.coverImage.extraLarge,
        format: rel.node.format,
        relationType: rel.relationType || "RELATED",
      }));
  }, [allRelations]);

  // Load all seasons recursively
  useEffect(() => {
    let cancelled = false;

    async function loadSeasons() {
      setLoadingSeasons(true);
      try {
        const allSeasons = await fetchAllSeasons(
          animeId,
          titleEnglish || titleRomaji || "Current Season",
          titleRomaji,
          titleEnglish,
          titleNative,
          relatedSeasons
        );

        if (!cancelled) {
          setSeasons(allSeasons);
        }
      } catch (error) {
        console.error("[Seasons] Failed to load seasons:", error);
        // Fallback to just current anime
        if (!cancelled) {
          setSeasons([
            {
              id: animeId,
              title: titleEnglish || titleRomaji || "Current Season",
              titleRomaji,
              titleEnglish,
              titleNative,
              seasonNumber: 1,
              isCurrent: true,
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSeasons(false);
        }
      }
    }

    loadSeasons();

    return () => {
      cancelled = true;
    };
  }, [animeId, titleRomaji, titleEnglish, titleNative, relatedSeasons]);

  // Get the selected season info
  const selectedSeason =
    seasons.find((s) => s.id === selectedSeasonId) || seasons.find((s) => s.isCurrent);

  // Use the selected season's data for episode fetching
  const effectiveAnimeId = selectedSeason?.id || animeId;
  const effectiveTitleRomaji = selectedSeason?.titleRomaji || titleRomaji;
  const effectiveTitleEnglish = selectedSeason?.titleEnglish || titleEnglish;
  const effectiveTitleNative = selectedSeason?.titleNative || titleNative;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "anime-episodes-multi",
      effectiveAnimeId,
      effectiveTitleRomaji,
      effectiveTitleEnglish,
      effectiveTitleNative,
    ],
    queryFn: () =>
      getAnimeEpisodes(effectiveAnimeId, {
        titleRomaji: effectiveTitleRomaji,
        titleEnglish: effectiveTitleEnglish,
        titleNative: effectiveTitleNative,
        format,
        totalEpisodes: expectedEpisodes,
        year,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes (matches backend cache)
    retry: 1,
  });

  // Auto-select first available provider when data loads
  useEffect(() => {
    if (data?.availableProviders?.length && !selectedProvider) {
      setSelectedProvider(data.availableProviders[0].provider);
    }
  }, [data, selectedProvider]);

  // Notify parent about availability changes
  useEffect(() => {
    if (onAvailabilityChange) {
      const hasContent = (data?.availableProviders?.length ?? 0) > 0;
      onAvailabilityChange({ isLoading, hasContent });
    }
  }, [isLoading, data?.availableProviders?.length, onAvailabilityChange]);

  // Reset state when season changes
  const handleSeasonChange = (seasonId: string) => {
    const newSeasonId = parseInt(seasonId, 10);
    setSelectedSeasonId(newSeasonId);
    setSelectedProvider(null);
    setVisibleEpisodes(EPISODES_PER_PAGE);
  };

  // Navigate to related anime (opens in same tab via URL change)
  const handleNavigateToRelated = (relatedId: number) => {
    // Navigate using the router - this will be handled by the parent component
    window.location.href = `/anime/${relatedId}`;
  };

  // Get current provider data
  const currentProviderData: ProviderResult | undefined = data?.availableProviders?.find(
    (p) => p.provider === selectedProvider
  );

  const episodes = currentProviderData?.episodes || [];
  const totalEpisodes = currentProviderData?.totalEpisodes || episodes.length;
  const hasMoreEpisodes = visibleEpisodes < episodes.length;
  const availableProviders = data?.availableProviders || [];
  const failedProviders = data?.failedProviders || [];

  const handleShowMore = () => {
    setVisibleEpisodes((prev) => Math.min(prev + EPISODES_PER_PAGE, episodes.length));
  };

  const handleShowLess = () => {
    setVisibleEpisodes(EPISODES_PER_PAGE);
  };

  // Reset visible episodes when provider changes
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setVisibleEpisodes(EPISODES_PER_PAGE);
  };

  // Get format icon
  const getFormatIcon = (format?: string | null) => {
    switch (format) {
      case "MOVIE":
        return <Film className="h-3 w-3" />;
      case "TV":
      case "TV_SHORT":
        return <Tv className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  // Get relation type label
  const getRelationLabel = (relationType: string) => {
    const labels: Record<string, string> = {
      SIDE_STORY: t("sideStory") || "Side Story",
      SPIN_OFF: t("spinOff") || "Spin-off",
      ALTERNATIVE: t("alternative") || "Alternative",
      PARENT: t("parent") || "Parent",
      CHARACTER: t("character") || "Character",
      PREQUEL: t("prequel") || "Prequel",
      SEQUEL: t("sequel") || "Sequel",
    };
    return labels[relationType] || relationType;
  };

  // Season selector (only show if there are multiple seasons or still loading)
  const seasonSelector = (loadingSeasons || seasons.length > 1) && (
    <div className="flex items-center gap-2">
      <Layers className="text-muted-foreground h-4 w-4 shrink-0" />
      {loadingSeasons ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <Select value={selectedSeasonId.toString()} onValueChange={handleSeasonChange}>
          <SelectTrigger className="h-8 w-auto max-w-65 min-w-30">
            <SelectValue>
              <span className="truncate text-sm">{selectedSeason?.title || t("season")}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-100" align="start">
            {seasons.map((season, index) => (
              <SelectItem key={season.id} value={season.id.toString()} className="py-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-medium">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm">{season.title}</span>
                  </div>
                  {season.isCurrent && (
                    <CheckCircle className="text-primary h-3.5 w-3.5 shrink-0" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  // Provider selector that only shows working providers
  const providerSelector = availableProviders.length > 0 && (
    <div className="flex items-center gap-2">
      <Server className="text-muted-foreground h-4 w-4" />
      <Select value={selectedProvider || ""} onValueChange={(v) => handleProviderChange(v)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder={t("selectProvider")} />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((p) => (
            <SelectItem key={p.provider} value={p.provider}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{p.displayName}</span>
                <span className="text-muted-foreground text-xs">({p.totalEpisodes})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border flex items-center justify-between border-b p-3">
          <span className="font-semibold">{t("episodes")}</span>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Server className="h-4 w-4 animate-pulse" />
            <span>{t("loadingProviders") || "Loading providers..."}</span>
          </div>
        </div>
        <div className="p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-1 h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // No providers available - return null, parent will handle visibility
  if (error || availableProviders.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Season Selector (if multiple seasons) */}
      {seasons.length > 1 && (
        <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
          {seasonSelector}
        </div>
      )}

      {/* Related Anime Section (collapsible) */}
      {supportedRelatedAnime.length > 0 && (
        <div className="border-border border-b">
          <button
            className="hover:bg-muted/30 flex w-full items-center justify-between px-3 py-2 text-left transition-colors"
            onClick={() => setShowRelated(!showRelated)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" />
              <span className="text-sm font-medium">{t("relatedAnime") || "Related"}</span>
              <Badge variant="outline" className="text-[10px]">
                {supportedRelatedAnime.length}
              </Badge>
            </div>
            {showRelated ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showRelated && (
            <div className="border-border max-h-48 overflow-y-auto border-t bg-black/5 p-2 dark:bg-white/5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                {supportedRelatedAnime.map((related) => (
                  <button
                    key={related.id}
                    onClick={() => handleNavigateToRelated(related.id)}
                    className="hover:bg-muted/50 flex items-center gap-2 rounded-lg p-2 text-left transition-colors"
                  >
                    {/* Cover Image */}
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
                      {related.coverImage ? (
                        <OptimizedImage
                          src={related.coverImage}
                          alt={related.title}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {getFormatIcon(related.format)}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{related.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                          {getFormatIcon(related.format)}
                          {related.format || "ANIME"}
                        </span>
                        <span className="text-primary text-[10px]">
                          {getRelationLabel(related.relationType)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header with provider info */}
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <button
          className="flex items-center gap-2 text-sm font-semibold"
          onClick={() => setExpanded(!expanded)}
        >
          {t("episodes")}
          {totalEpisodes > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalEpisodes}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {providerSelector}
      </div>

      {/* Provider status summary */}
      {failedProviders.length > 0 && (
        <div className="border-border border-b bg-orange-500/10 px-3 py-1.5 text-xs text-orange-400">
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {failedProviders.length} {t("providersFailed") || "provider(s) unavailable"}
          </span>
        </div>
      )}

      {/* Episodes List */}
      {expanded && (
        <div className="flex-1 overflow-y-auto">
          {episodes.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <p className="text-muted-foreground text-sm">{t("noEpisodes")}</p>
            </div>
          ) : (
            <div className="p-1.5">
              {episodes.slice(0, visibleEpisodes).map((episode) => (
                <button
                  key={episode.id}
                  className={cn(
                    "hover:bg-muted/50 mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    episode.isFiller && "border-l-2 border-orange-500",
                    selectedEpisodeId === episode.id &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => onSelectEpisode(episode, episodes)}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      selectedEpisodeId === episode.id
                        ? "bg-primary-foreground/20"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {episode.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {episode.title || `${t("episode")} ${episode.number}`}
                    </span>
                    {episode.isFiller && (
                      <span className="text-[10px] text-orange-500">{t("filler")}</span>
                    )}
                  </div>
                  {selectedEpisodeId === episode.id && (
                    <Play className="h-4 w-4 shrink-0 animate-pulse" />
                  )}
                </button>
              ))}

              {(hasMoreEpisodes || visibleEpisodes > EPISODES_PER_PAGE) && (
                <div className="border-border mt-2 flex justify-center gap-2 border-t pt-2">
                  {hasMoreEpisodes && (
                    <Button variant="ghost" size="sm" onClick={handleShowMore}>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      {t("showMore")} ({episodes.length - visibleEpisodes})
                    </Button>
                  )}
                  {visibleEpisodes > EPISODES_PER_PAGE && (
                    <Button variant="ghost" size="sm" onClick={handleShowLess}>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      {t("showLess")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
