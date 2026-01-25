/**
 * Player Preferences Hook
 * Manages user preferences for the video player using localStorage
 * and playback position using sessionStorage
 */

import { useState, useEffect, useCallback } from "react";

// Subtitle style presets
export const SUBTITLE_PRESETS = {
  default: {
    id: "default",
    name: "Default",
    nameEs: "Predeterminado",
    fontSize: "medium", // small, medium, large, xlarge
    fontColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    fontWeight: "normal",
    textShadow: true,
  },
  cinema: {
    id: "cinema",
    name: "Cinema",
    nameEs: "Cine",
    fontSize: "large",
    fontColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    fontWeight: "bold",
    textShadow: true,
  },
  highContrast: {
    id: "highContrast",
    name: "High Contrast",
    nameEs: "Alto Contraste",
    fontSize: "large",
    fontColor: "#FFFF00",
    backgroundColor: "rgba(0, 0, 0, 1)",
    fontWeight: "bold",
    textShadow: false,
  },
  subtle: {
    id: "subtle",
    name: "Subtle",
    nameEs: "Sutil",
    fontSize: "small",
    fontColor: "#CCCCCC",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    fontWeight: "normal",
    textShadow: true,
  },
  anime: {
    id: "anime",
    name: "Anime Style",
    nameEs: "Estilo Anime",
    fontSize: "medium",
    fontColor: "#FFFFFF",
    backgroundColor: "transparent",
    fontWeight: "bold",
    textShadow: true, // Heavy shadow for readability without bg
  },
  netflix: {
    id: "netflix",
    name: "Netflix Style",
    nameEs: "Estilo Netflix",
    fontSize: "medium",
    fontColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    fontWeight: "600",
    textShadow: false,
  },
} as const;

export type SubtitlePresetId = keyof typeof SUBTITLE_PRESETS;
export type SubtitlePreset = (typeof SUBTITLE_PRESETS)[SubtitlePresetId];

// Font size mappings (in pixels for different screen sizes)
export const FONT_SIZE_MAP = {
  small: { base: 14, md: 16, lg: 18 },
  medium: { base: 16, md: 20, lg: 24 },
  large: { base: 20, md: 26, lg: 32 },
  xlarge: { base: 24, md: 32, lg: 40 },
} as const;

export type FontSize = keyof typeof FONT_SIZE_MAP;

// Player preferences stored in localStorage
export interface PlayerPreferences {
  volume: number;
  muted: boolean;
  subtitlePreset: SubtitlePresetId;
  autoplay: boolean;
  autoSkipIntro: boolean;
  autoNextEpisode: boolean;
  playbackSpeed: number;
}

const DEFAULT_PREFERENCES: PlayerPreferences = {
  volume: 0.8,
  muted: false,
  subtitlePreset: "default",
  autoplay: true,
  autoSkipIntro: false,
  autoNextEpisode: true,
  playbackSpeed: 1.0,
};

const PREFERENCES_KEY = "kiniro-player-preferences";
const POSITION_PREFIX = "kiniro-playback-";

/**
 * Get CSS styles for a subtitle preset
 */
export function getSubtitleStyles(preset: SubtitlePreset): React.CSSProperties {
  const sizes = FONT_SIZE_MAP[preset.fontSize as FontSize] || FONT_SIZE_MAP.medium;

  return {
    fontSize: `clamp(${sizes.base}px, 2.5vw, ${sizes.lg}px)`,
    color: preset.fontColor,
    backgroundColor: preset.backgroundColor,
    fontWeight: preset.fontWeight,
    textShadow: preset.textShadow
      ? "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7), 1px -1px 2px rgba(0,0,0,0.7), -1px 1px 2px rgba(0,0,0,0.7)"
      : "none",
    padding: preset.backgroundColor === "transparent" ? "0" : "4px 12px",
    borderRadius: preset.backgroundColor === "transparent" ? "0" : "4px",
    lineHeight: 1.4,
  };
}

/**
 * Hook for managing player preferences
 */
export function usePlayerPreferences() {
  const [preferences, setPreferences] = useState<PlayerPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Error loading player preferences:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPrefs: Partial<PlayerPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving player preferences:", error);
      }
      return updated;
    });
  }, []);

  // Get current subtitle preset
  const currentSubtitlePreset =
    SUBTITLE_PRESETS[preferences.subtitlePreset] || SUBTITLE_PRESETS.default;

  return {
    preferences,
    savePreferences,
    isLoaded,
    currentSubtitlePreset,
    subtitleStyles: getSubtitleStyles(currentSubtitlePreset),
  };
}

/**
 * Hook for managing playback position
 * Uses sessionStorage to persist position during the session
 */
export function usePlaybackPosition(episodeId: string) {
  const storageKey = `${POSITION_PREFIX}${episodeId}`;

  // Get saved position
  const getSavedPosition = useCallback((): number => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const position = parseFloat(stored);
        return isNaN(position) ? 0 : position;
      }
    } catch (error) {
      console.error("Error reading playback position:", error);
    }
    return 0;
  }, [storageKey]);

  // Save position (debounced in the component)
  const savePosition = useCallback(
    (position: number) => {
      try {
        // Only save if position is meaningful (> 5 seconds)
        if (position > 5) {
          sessionStorage.setItem(storageKey, position.toString());
        }
      } catch (error) {
        console.error("Error saving playback position:", error);
      }
    },
    [storageKey]
  );

  // Clear position (when episode is completed)
  const clearPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing playback position:", error);
    }
  }, [storageKey]);

  return {
    getSavedPosition,
    savePosition,
    clearPosition,
  };
}

/**
 * Clean up old playback positions (optional - call periodically)
 */
export function cleanupOldPositions(maxEntries = 50) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(POSITION_PREFIX)) {
        keys.push(key);
      }
    }

    // If we have too many entries, remove the oldest ones
    if (keys.length > maxEntries) {
      const toRemove = keys.slice(0, keys.length - maxEntries);
      toRemove.forEach((key) => sessionStorage.removeItem(key));
    }
  } catch (error) {
    console.error("Error cleaning up playback positions:", error);
  }
}
