"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ds";
import { Minus, Plus, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface EpisodeControlsProps {
  current: number;
  total?: number | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onOpenChecklist: () => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Quick controls for episode progress: -1, +1, and open checklist
 */
export function EpisodeControls({
  current,
  total,
  onIncrement,
  onDecrement,
  onOpenChecklist,
  disabled = false,
  compact = false,
  className,
}: EpisodeControlsProps) {
  const t = useTranslations();

  const canIncrement = !total || current < total;
  const canDecrement = current > 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Decrement button */}
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn("h-8 w-8 p-0", compact && "h-7 w-7")}
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        aria-label={t("library.decreaseProgress")}
        title={t("library.decreaseProgress")}
      >
        <Minus className={cn("h-4 w-4", compact && "h-3 w-3")} />
      </Button>

      {/* Increment button */}
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn("h-8 w-8 p-0", compact && "h-7 w-7")}
        onClick={onIncrement}
        disabled={disabled || !canIncrement}
        aria-label={t("library.increaseProgress")}
        title={t("library.increaseProgress")}
      >
        <Plus className={cn("h-4 w-4", compact && "h-3 w-3")} />
      </Button>

      {/* Open checklist button */}
      {total && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn("h-8 gap-1.5 px-2", compact && "h-7 px-1.5")}
          onClick={onOpenChecklist}
          disabled={disabled}
          aria-label={t("library.openEpisodeList")}
          title={t("library.openEpisodeList")}
        >
          <ListChecks className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
          <span className={cn("text-xs", compact && "hidden sm:inline")}>
            {t("library.episodes")}
          </span>
        </Button>
      )}
    </div>
  );
}
