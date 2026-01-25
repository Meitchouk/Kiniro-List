"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Server, AlertTriangle, CheckCircle, Layers } from "lucide-react";
import { Button, Badge, Skeleton } from "@/components/ds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  /** Related anime (prequels/sequels) for season navigation */
  relatedSeasons?: RelationEdge[];
}

const EPISODES_PER_PAGE = 24;

/** Maximum depth to search for related seasons */
const MAX_SEASON_DEPTH = 10;

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
  relatedSeasons,
}: EpisodeListProps) {
  const t = useTranslations("streaming");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [visibleEpisodes, setVisibleEpisodes] = useState(EPISODES_PER_PAGE);

  // Seasons state (loaded async)
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  // Track selected season (default to current anime)
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(animeId);

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

  // Reset state when season changes
  const handleSeasonChange = (seasonId: string) => {
    const newSeasonId = parseInt(seasonId, 10);
    setSelectedSeasonId(newSeasonId);
    setSelectedProvider(null);
    setVisibleEpisodes(EPISODES_PER_PAGE);
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

  // Season selector (only show if there are multiple seasons or still loading)
  const seasonSelector = (loadingSeasons || seasons.length > 1) && (
    <div className="flex items-center gap-2">
      <Layers className="text-muted-foreground h-4 w-4" />
      {loadingSeasons ? (
        <Skeleton className="h-8 w-[100px]" />
      ) : (
        <Select value={selectedSeasonId.toString()} onValueChange={handleSeasonChange}>
          <SelectTrigger className="h-8 w-auto max-w-[140px]">
            <SelectValue>
              <span className="truncate">
                {t("season")} {selectedSeason?.seasonNumber || 1}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-[250px]">
            {seasons.map((season) => (
              <SelectItem key={season.id} value={season.id.toString()}>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-medium">S{season.seasonNumber}</span>
                  <span className="text-muted-foreground truncate text-xs">{season.title}</span>
                  {season.isCurrent && (
                    <Badge variant="secondary" className="shrink-0 px-1 py-0 text-[10px]">
                      {t("current") || "NOW"}
                    </Badge>
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

  // Error state or no providers available
  if (error || availableProviders.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border flex items-center justify-between border-b p-3">
          <span className="font-semibold">{t("episodes")}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <AlertTriangle className="mb-3 h-8 w-8 text-orange-500" />
          <p className="text-muted-foreground mb-2 text-center text-sm">
            {t("noProvidersAvailable") || "No streaming sources available"}
          </p>
          {failedProviders.length > 0 && (
            <div className="text-muted-foreground mb-4 text-center text-xs">
              <p className="mb-1">{t("failedProviders") || "Failed providers"}:</p>
              <ul className="space-y-1">
                {failedProviders.map((fp) => (
                  <li key={fp.provider} className="text-red-400">
                    {fp.provider}: {fp.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Season Selector (if multiple seasons) */}
      {seasons.length > 1 && (
        <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
          {seasonSelector}
          {selectedSeason && !selectedSeason.isCurrent && (
            <span className="text-muted-foreground flex-1 truncate text-xs">
              {selectedSeason.title}
            </span>
          )}
        </div>
      )}

      {/* Header with provider info */}
      <div className="border-border flex items-center justify-between border-b p-3">
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
            <div className="p-1">
              {episodes.slice(0, visibleEpisodes).map((episode) => (
                <button
                  key={episode.id}
                  className={cn(
                    "hover:bg-muted/50 flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors",
                    episode.isFiller && "border-l-2 border-orange-500",
                    selectedEpisodeId === episode.id &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => onSelectEpisode(episode, episodes)}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-medium",
                      selectedEpisodeId === episode.id ? "bg-primary-foreground/20" : "bg-muted"
                    )}
                  >
                    {episode.number}
                  </span>
                  <span className="flex-1 truncate">
                    {episode.title || `${t("episode")} ${episode.number}`}
                  </span>
                  {episode.isFiller && (
                    <span className="shrink-0 text-xs text-orange-500">{t("filler")}</span>
                  )}
                </button>
              ))}

              {(hasMoreEpisodes || visibleEpisodes > EPISODES_PER_PAGE) && (
                <div className="border-border flex justify-center gap-2 border-t p-2">
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
