"use client";

import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertLibraryEntry } from "@/lib/api";
import type { LibraryStatus } from "@/lib/types";

interface UpdateProgressParams {
  animeId: number;
  status: LibraryStatus;
  progress: number;
  totalEpisodes?: number | null;
  episodesWatched?: number[];
}

// Global debounce map to handle multiple anime updates
const debounceTimers = new Map<number, NodeJS.Timeout>();
const pendingUpdates = new Map<number, UpdateProgressParams>();

/**
 * Hook for managing episode progress with validation and optimistic updates
 * Includes automatic debouncing for rapid updates
 */
export function useEpisodeProgress() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | number | null>(null);

  const updateProgressMutation = useMutation({
    mutationFn: async (params: UpdateProgressParams) => {
      const { animeId, status, progress, episodesWatched } = params;
      return upsertLibraryEntry({
        animeId,
        status,
        progress,
        episodesWatched,
      });
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["library"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["library"]);

      // Optimistically update
      queryClient.setQueryData(["library"], (old: unknown) => {
        if (!old || typeof old !== "object" || !("entries" in old)) return old;

        const libraryData = old as { entries: Array<{ animeId: number; [key: string]: unknown }> };

        return {
          ...libraryData,
          entries: libraryData.entries.map((entry) =>
            entry.animeId === variables.animeId
              ? {
                  ...entry,
                  progress: variables.progress,
                  episodesWatched: variables.episodesWatched,
                  updatedAt: new Date(),
                }
              : entry
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(["library"], context.previousData);
      }

      // Dismiss loading toast and show error
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      toast.error(t("errors.generic"));
    },
    onSuccess: (data, variables) => {
      // Dismiss loading toast and show success
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      toast.success(t("library.progressUpdated"));

      // Clear pending update for this anime
      pendingUpdates.delete(variables.animeId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  /**
   * Debounced update function with optimistic UI
   */
  const updateProgressDebounced = useCallback(
    (params: UpdateProgressParams) => {
      const { animeId, progress, episodesWatched } = params;

      // Store pending update
      pendingUpdates.set(animeId, params);

      // Perform optimistic update immediately
      queryClient.setQueryData(["library"], (old: unknown) => {
        if (!old || typeof old !== "object" || !("entries" in old)) return old;

        const libraryData = old as { entries: Array<{ animeId: number; [key: string]: unknown }> };

        return {
          ...libraryData,
          entries: libraryData.entries.map((entry) =>
            entry.animeId === animeId
              ? {
                  ...entry,
                  progress,
                  episodesWatched,
                  updatedAt: new Date(),
                }
              : entry
          ),
        };
      });

      // Show or update loading toast
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading(t("library.savingProgress"));
      }

      // Clear existing timer for this anime
      const existingTimer = debounceTimers.get(animeId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        const finalParams = pendingUpdates.get(animeId);
        if (finalParams) {
          updateProgressMutation.mutate(finalParams);
        }
        debounceTimers.delete(animeId);
      }, 600); // 600ms debounce

      debounceTimers.set(animeId, timer);
    },
    [queryClient, updateProgressMutation, t]
  );

  /**
   * Validate and update progress
   */
  const updateProgress = (params: UpdateProgressParams) => {
    const { progress, totalEpisodes } = params;

    // Validate progress
    if (progress < 0) {
      toast.error(t("library.invalidProgress"));
      return;
    }

    if (totalEpisodes && progress > totalEpisodes) {
      toast.error(t("library.progressExceedsTotal"));
      return;
    }

    updateProgressDebounced(params);
  };

  /**
   * Increment progress by 1
   */
  const incrementProgress = (
    animeId: number,
    status: LibraryStatus,
    currentProgress: number,
    totalEpisodes?: number | null
  ) => {
    const newProgress = currentProgress + 1;

    if (totalEpisodes && newProgress > totalEpisodes) {
      toast.info(t("library.allEpisodesWatched"));
      return;
    }

    const episodesWatched = Array.from({ length: newProgress }, (_, i) => i + 1);

    updateProgress({
      animeId,
      status: status === "planned" ? "watching" : status,
      progress: newProgress,
      totalEpisodes,
      episodesWatched,
    });
  };

  /**
   * Decrement progress by 1
   */
  const decrementProgress = (
    animeId: number,
    status: LibraryStatus,
    currentProgress: number,
    totalEpisodes?: number | null
  ) => {
    if (currentProgress <= 0) return;

    const newProgress = currentProgress - 1;
    const episodesWatched = Array.from({ length: newProgress }, (_, i) => i + 1);

    updateProgress({
      animeId,
      status,
      progress: newProgress,
      totalEpisodes,
      episodesWatched,
    });
  };

  /**
   * Calculate progress from checklist
   */
  const calculateProgressFromChecklist = (checked: number[]): number => {
    if (checked.length === 0) return 0;
    return Math.max(...checked);
  };

  /**
   * Generate checklist from progress
   */
  const generateChecklistFromProgress = (progress: number): number[] => {
    return Array.from({ length: progress }, (_, i) => i + 1);
  };

  /**
   * Update progress from checklist toggle
   */
  const updateFromChecklist = (
    animeId: number,
    status: LibraryStatus,
    episodesWatched: number[],
    totalEpisodes?: number | null
  ) => {
    const newProgress = calculateProgressFromChecklist(episodesWatched);

    updateProgress({
      animeId,
      status,
      progress: newProgress,
      totalEpisodes,
      episodesWatched,
    });
  };

  /**
   * Mark all episodes as watched
   */
  const markAllWatched = (animeId: number, status: LibraryStatus, totalEpisodes: number) => {
    // Clear any pending debounce for this anime
    const existingTimer = debounceTimers.get(animeId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      debounceTimers.delete(animeId);
    }

    const episodesWatched = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

    // Mark all should be immediate, not debounced
    updateProgressMutation.mutate({
      animeId,
      status: status === "planned" ? "watching" : status,
      progress: totalEpisodes,
      totalEpisodes,
      episodesWatched,
    });

    // Suggest completing if all episodes watched
    if (status !== "completed") {
      toast.info(t("library.suggestCompleted"), {
        duration: 5000,
      });
    }
  };

  /**
   * Reset progress to 0
   */
  const resetProgress = (animeId: number, status: LibraryStatus) => {
    // Clear any pending debounce for this anime
    const existingTimer = debounceTimers.get(animeId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      debounceTimers.delete(animeId);
    }

    // Reset should be immediate, not debounced
    updateProgressMutation.mutate({
      animeId,
      status,
      progress: 0,
      episodesWatched: [],
    });
  };

  return {
    updateProgress,
    incrementProgress,
    decrementProgress,
    calculateProgressFromChecklist,
    generateChecklistFromProgress,
    updateFromChecklist,
    markAllWatched,
    resetProgress,
    isUpdating: updateProgressMutation.isPending,
  };
}
