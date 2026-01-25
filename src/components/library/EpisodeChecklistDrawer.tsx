"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, Typography, Stack, Flex } from "@/components/ds";
import { CheckCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EpisodeChecklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  totalEpisodes: number;
  episodesWatched: number[];
  onUpdateChecklist: (episodes: number[]) => void;
  onMarkAllWatched: () => void;
  onResetProgress: () => void;
  isUpdating?: boolean;
}

/**
 * Dialog for episode checklist with mark all and reset options
 * Uses custom checkbox implementation
 */
export function EpisodeChecklistDrawer({
  isOpen,
  onClose,
  animeTitle,
  totalEpisodes,
  episodesWatched,
  onUpdateChecklist,
  onMarkAllWatched,
  onResetProgress,
  isUpdating = false,
}: EpisodeChecklistDrawerProps) {
  const t = useTranslations();
  const [localChecked, setLocalChecked] = useState<Set<number>>(new Set(episodesWatched));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change
  useMemo(() => {
    setLocalChecked(new Set(episodesWatched));
    setHasUnsavedChanges(false);
  }, [episodesWatched]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    (episodes: number[]) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onUpdateChecklist(episodes);
        setHasUnsavedChanges(false);
      }, 800); // Wait 800ms after last change
    },
    [onUpdateChecklist]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Save changes when dialog closes if there are unsaved changes
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && debounceTimerRef.current) {
      // Clear the timer and save immediately
      clearTimeout(debounceTimerRef.current);
      const episodes = Array.from(localChecked).sort((a, b) => a - b);
      onUpdateChecklist(episodes);
      setHasUnsavedChanges(false);
    }
    onClose();
  }, [hasUnsavedChanges, localChecked, onUpdateChecklist, onClose]);

  const handleToggle = useCallback(
    (episode: number) => {
      const newChecked = new Set(localChecked);
      if (newChecked.has(episode)) {
        newChecked.delete(episode);
      } else {
        newChecked.add(episode);
      }
      setLocalChecked(newChecked);
      setHasUnsavedChanges(true);

      // Debounced update instead of immediate
      const episodes = Array.from(newChecked).sort((a, b) => a - b);
      debouncedUpdate(episodes);
    },
    [localChecked, debouncedUpdate]
  );

  const handleMarkAll = useCallback(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const allEpisodes = new Set(Array.from({ length: totalEpisodes }, (_, i) => i + 1));
    setLocalChecked(allEpisodes);
    setHasUnsavedChanges(false);
    onMarkAllWatched();
  }, [totalEpisodes, onMarkAllWatched]);

  const handleReset = useCallback(() => {
    if (confirm(t("library.resetConfirm"))) {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setLocalChecked(new Set());
      setHasUnsavedChanges(false);
      onResetProgress();
    }
  }, [onResetProgress, t]);

  const checkedCount = localChecked.size;
  const allChecked = checkedCount === totalEpisodes;

  // Group episodes for better UX on long series
  const shouldGroup = totalEpisodes > 50;
  const episodeGroups = useMemo(() => {
    if (!shouldGroup) return null;

    const groups: Array<{ start: number; end: number; episodes: number[] }> = [];
    const groupSize = 50;

    for (let i = 0; i < totalEpisodes; i += groupSize) {
      const start = i + 1;
      const end = Math.min(i + groupSize, totalEpisodes);
      const episodes = Array.from({ length: end - start + 1 }, (_, j) => start + j);
      groups.push({ start, end, episodes });
    }

    return groups;
  }, [totalEpisodes, shouldGroup]);

  const renderEpisodeItem = (episode: number) => {
    const isChecked = localChecked.has(episode);

    return (
      <button
        key={episode}
        onClick={() => handleToggle(episode)}
        disabled={isUpdating}
        className={cn(
          "border-border hover:bg-muted flex items-center gap-2 rounded-md border p-3 transition-colors",
          isChecked && "bg-primary/5 border-primary/20",
          isUpdating && "cursor-not-allowed opacity-50"
        )}
      >
        {/* Custom checkbox */}
        <div
          className={cn(
            "border-primary flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            isChecked && "bg-primary border-primary"
          )}
        >
          {isChecked && (
            <svg
              className="text-primary-foreground h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={cn("flex-1 text-left text-sm font-medium", isChecked && "text-primary")}>
          {t("library.episodeNumber", { number: episode })}
        </span>
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{t("library.episodeProgress")}</DialogTitle>
          <DialogDescription className="line-clamp-2">{animeTitle}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted mx-6 mb-4 shrink-0 rounded-lg p-4">
          <Flex align="center" justify="between">
            <Typography variant="body2" colorScheme="secondary">
              {t("library.progress")}
            </Typography>
            <Flex align="center" gap={2}>
              <Typography variant="h6" weight="bold">
                {checkedCount} / {totalEpisodes}
              </Typography>
              {hasUnsavedChanges && (
                <span className="flex animate-pulse items-center gap-1 text-xs font-medium text-orange-500">
                  <svg
                    className="h-3 w-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("library.savingProgress")}
                </span>
              )}
            </Flex>
          </Flex>
        </div>

        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Stack gap={2}>
            {shouldGroup && episodeGroups ? (
              // Grouped view for long series
              episodeGroups.map((group) => {
                const groupChecked = group.episodes.filter((ep) => localChecked.has(ep)).length;

                return (
                  <div key={`group-${group.start}`} className="space-y-2">
                    <Typography
                      variant="caption"
                      colorScheme="secondary"
                      weight="medium"
                      className="bg-background sticky top-0 py-1"
                    >
                      {t("library.episodeRange", {
                        start: group.start,
                        end: group.end,
                      })}{" "}
                      ({groupChecked}/{group.episodes.length})
                    </Typography>
                    <div className="grid grid-cols-2 gap-2">
                      {group.episodes.map(renderEpisodeItem)}
                    </div>
                  </div>
                );
              })
            ) : (
              // Regular grid view
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map(renderEpisodeItem)}
              </div>
            )}
          </Stack>
        </div>

        <DialogFooter className="bg-background shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-col">
          <Button
            onClick={handleMarkAll}
            disabled={isUpdating || allChecked}
            className="w-full"
            variant="default"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {t("library.markAllWatched")}
          </Button>
          <Button
            onClick={handleReset}
            disabled={isUpdating || checkedCount === 0}
            className="w-full"
            variant="outline"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("library.resetProgress")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
