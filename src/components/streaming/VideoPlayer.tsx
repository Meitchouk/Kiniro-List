/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  Loader2,
  AlertCircle,
  X,
  Subtitles,
  Search,
  Globe,
  Palette,
  MoreVertical,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStreamingLinks, searchExternalSubtitles, getExternalSubtitleDownload } from "@/lib/api";
import type { ExternalSubtitleResult } from "@/lib/api";
import type { Episode } from "@/lib/types/streaming";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePlayerPreferences,
  usePlaybackPosition,
  SUBTITLE_PRESETS,
  type SubtitlePresetId,
} from "@/lib/hooks/usePlayerPreferences";

interface VideoPlayerProps {
  episode: Episode;
  animeTitle?: string;
  onClose?: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
}

/**
 * Build proxy URL for streaming
 */
function buildProxyUrl(url: string, referer?: string): string {
  const params = new URLSearchParams({ url });
  if (referer) {
    params.set("referer", referer);
  }
  return `/api/streaming/proxy?${params.toString()}`;
}

/**
 * Video player component for streaming anime episodes
 * Uses react-player with HLS.js for better streaming support
 */
export function VideoPlayer({
  episode,
  animeTitle,
  onClose,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
}: VideoPlayerProps) {
  const t = useTranslations("streaming");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Player preferences (localStorage)
  const {
    preferences,
    savePreferences,
    subtitleStyles,
    isLoaded: prefsLoaded,
  } = usePlayerPreferences();

  // Playback position (sessionStorage)
  const { getSavedPosition, savePosition, clearPosition } = usePlaybackPosition(episode.id);

  // Track if we've restored the saved position
  const hasRestoredPosition = useRef(false);

  // Debounced position save
  const lastSavedTime = useRef(0);

  // Track if component is mounted (for SSR safety)
  const [isMounted, setIsMounted] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => preferences.muted);
  const [volume, setVolume] = useState(() => preferences.volume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedHlsLevel, setSelectedHlsLevel] = useState<number>(-1); // -1 = auto
  const [hlsLevels, setHlsLevels] = useState<
    Array<{ height: number; width: number; bitrate: number; index: number }>
  >([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);

  // External subtitles state
  const [showExternalSubsSearch, setShowExternalSubsSearch] = useState(false);
  const [isSearchingExternalSubs, setIsSearchingExternalSubs] = useState(false);
  const [externalSubResults, setExternalSubResults] = useState<ExternalSubtitleResult[]>([]);
  const [externalSubtitles, setExternalSubtitles] = useState<
    Array<{ url: string; lang: string; label?: string }>
  >([]);
  const [externalSubLanguageFilter, setExternalSubLanguageFilter] = useState<string>("all");
  const [availableLanguages, setAvailableLanguages] = useState<
    Array<{ code: string; name: string; count: number }>
  >([]);
  const [sourceStats, setSourceStats] = useState<{ opensubtitles: number; subdl: number }>({
    opensubtitles: 0,
    subdl: 0,
  });

  const [debugInfo, setDebugInfo] = useState<{
    hlsLevel: number;
    hlsLevels: number;
    fragsLoaded: number;
    fragsErrored: number;
    lastFragUrl: string;
    lastFragStatus: string;
    bufferLength: number;
  }>({
    hlsLevel: -1,
    hlsLevels: 0,
    fragsLoaded: 0,
    fragsErrored: 0,
    lastFragUrl: "",
    lastFragStatus: "",
    bufferLength: 0,
  });

  // Mount effect for SSR safety + mobile detection
  useEffect(() => {
    setIsMounted(true);

    // Detect mobile/touch device
    const checkMobile = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    data: streamingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["streaming-links", episode.id, episode.provider],
    queryFn: () =>
      getStreamingLinks(episode.id, {
        provider: episode.provider as "hianime" | "animeflv" | undefined,
      }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  // Check if this is an embed-based provider (AnimeFLV) or direct stream (HiAnime)
  const isEmbedProvider = streamingData?.type === "embed";
  const embedServers = useMemo(
    () => (streamingData?.servers || []).filter((s) => s.type === "embed"),
    [streamingData?.servers]
  );
  const [selectedEmbedServer, setSelectedEmbedServer] = useState<number>(0);

  const sources = streamingData?.sources || [];
  const apiSubtitles = useMemo(() => streamingData?.subtitles || [], [streamingData?.subtitles]);
  const intro = streamingData?.intro;
  const outro = streamingData?.outro;

  // Combine API subtitles with external subtitles
  const subtitles = useMemo(
    () => [...apiSubtitles, ...externalSubtitles],
    [apiSubtitles, externalSubtitles]
  );

  // Check if Spanish subtitles are available from API
  const hasSpanishFromApi = apiSubtitles.some(
    (s) => s.lang?.toLowerCase().includes("spanish") || s.lang?.toLowerCase().includes("español")
  );

  // Get current source (HLS adaptive stream) - only for direct providers
  const currentSource = !isEmbedProvider ? sources[0] : null;

  // Get referer from headers
  const referer = streamingData?.headers?.Referer;

  // Build the final URL (with proxy if needed) - only for direct providers
  // Use proxy for:
  // 1. M3U8 streams (HLS)
  // 2. Any source that requires a Referer header (like Streamtape)
  const isHLSSource = currentSource
    ? currentSource.isM3U8 || currentSource.url.includes(".m3u8")
    : false;
  const needsProxy = currentSource ? isHLSSource || !!referer : false;
  const videoUrl = currentSource
    ? needsProxy
      ? buildProxyUrl(currentSource.url, referer)
      : currentSource.url
    : "";

  // Function to search for external subtitles
  const handleSearchExternalSubtitles = useCallback(
    async (filterLang?: string) => {
      if (!animeTitle) {
        toast.error(t("noAnimeTitleForSubSearch"));
        return;
      }

      setIsSearchingExternalSubs(true);
      setShowExternalSubsSearch(true);

      try {
        const result = await searchExternalSubtitles(animeTitle, episode.number, {
          languages: ["es", "en"],
          filterLanguage: filterLang && filterLang !== "all" ? filterLang : undefined,
        });

        setExternalSubResults(result.results);
        setAvailableLanguages(result.availableLanguages || []);
        setSourceStats(result.sourceStats || { opensubtitles: 0, subdl: 0 });

        if (result.results.length === 0) {
          toast.info(t("noExternalSubsFound"));
        } else {
          // const totalFromBoth = (result.sourceStats?.opensubtitles || 0) + (result.sourceStats?.subdl || 0);
          toast.success(t("externalSubsFound", { count: result.totalResults }));
        }
      } catch (err) {
        console.error("Error searching external subtitles:", err);
        toast.error(t("externalSubsSearchError"));
      } finally {
        setIsSearchingExternalSubs(false);
      }
    },
    [animeTitle, episode.number, t]
  );

  // Handle language filter change
  const handleLanguageFilterChange = useCallback(
    (lang: string) => {
      setExternalSubLanguageFilter(lang);
      handleSearchExternalSubtitles(lang);
    },
    [handleSearchExternalSubtitles]
  );

  // Function to load an external subtitle
  const handleLoadExternalSubtitle = useCallback(
    async (sub: ExternalSubtitleResult) => {
      try {
        const { downloadUrl } = await getExternalSubtitleDownload(sub);

        // Add to external subtitles list
        const sourceLabel = sub.source === "opensubtitles" ? "OpenSubs" : "Subdl";
        const newSub = {
          url: downloadUrl,
          lang: `${sub.language} (${sourceLabel})`,
          label: `${sub.language} (${sourceLabel})`,
        };

        setExternalSubtitles((prev) => [...prev, newSub]);
        setSelectedSubtitle(newSub.lang);
        setShowExternalSubsSearch(false);

        toast.success(t("externalSubLoaded"));
      } catch (err) {
        console.error("Error loading external subtitle:", err);
        toast.error(t("externalSubLoadError"));
      }
    },
    [t]
  );

  // HLS.js initialization
  const hlsRef = useRef<Hls | null>(null);
  const mediaErrorCount = useRef(0);
  const codecErrorCount = useRef(0);
  const fragParsingErrorCount = useRef(0); // Track fragment parsing errors

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || !isMounted) return;

    // Reset error counts when URL changes
    mediaErrorCount.current = 0;
    codecErrorCount.current = 0;
    fragParsingErrorCount.current = 0;
    setPlaybackError(null);
    setDebugInfo({
      hlsLevel: -1,
      hlsLevels: 0,
      fragsLoaded: 0,
      fragsErrored: 0,
      lastFragUrl: "",
      lastFragStatus: "",
      bufferLength: 0,
    });

    let bufferInterval: NodeJS.Timeout | null = null;

    // Check if URL is HLS - use the source type, not the URL pattern
    // (proxy URLs don't necessarily indicate HLS - could be MP4 that needs Referer)
    const isHLS = isHLSSource;

    console.log(`[VideoPlayer] Setting up video source:`, {
      url: videoUrl.substring(0, 100),
      isHLS,
      isHLSSource,
      needsProxy,
    });

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Retry settings - more conservative
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 64000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 4,
        // Buffer settings - balanced for adaptive streaming
        maxBufferLength: 45, // 45 seconds ahead
        maxMaxBufferLength: 90, // Max 1.5 minutes buffer
        maxBufferSize: 50 * 1000 * 1000, // 50 MB
        maxBufferHole: 1.0,
        // Back buffer to keep some watched content
        backBufferLength: 20, // Keep 20 seconds watched
        // Start settings
        startLevel: -1,
        autoStartLoad: true,
        // Force native TS demuxing (more robust for problematic streams)
        forceKeyFrameOnDiscontinuity: true,
        // Progressive download settings
        progressive: false,
        // More permissive settings for problematic streams
        stretchShortVideoTrack: true,
        // Append error max retry
        appendErrorMaxRetry: 5,
        // Debug mode for troubleshooting (disable in production)
        debug: false,
        xhrSetup: (xhr, url) => {
          if (!url.includes("/api/streaming/proxy")) {
            xhr.withCredentials = false;
          }
        },
      });

      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        // Try to auto-play when manifest is loaded
        console.log(
          `[HLS MANIFEST] Levels: ${data.levels.length}, First level: ${JSON.stringify(data.levels[0]?.attrs)}`
        );

        // Extract HLS quality levels
        const levels = data.levels
          .map((level, index) => ({
            height: level.height || 0,
            width: level.width || 0,
            bitrate: level.bitrate || 0,
            index,
          }))
          .sort((a, b) => b.height - a.height); // Sort by resolution descending

        setHlsLevels(levels);
        console.log(
          `[HLS] Available quality levels:`,
          levels.map((l) => `${l.height}p`).join(", ")
        );

        setDebugInfo((prev) => ({
          ...prev,
          hlsLevels: data.levels.length,
        }));

        // Restore saved position if available
        if (!hasRestoredPosition.current) {
          const savedPos = getSavedPosition();
          if (savedPos > 5 && video) {
            console.log(`[PLAYER] Restoring playback position to ${savedPos}s`);
            video.currentTime = savedPos;
            setCurrentTime(savedPos);
            toast.info(t("resumingPlayback"));
          }
          hasRestoredPosition.current = true;
        }

        video.play().catch(() => setIsPlaying(false));
      });

      // Add fragment loaded listener for debugging
      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        const frag = data.frag;
        // Verbose logging - commented out to reduce noise
        // console.log(
        //   `[HLS FRAG_LOADED] Level ${frag.level}, SN ${frag.sn}, Duration ${frag.duration?.toFixed(2)}s`
        // );
        // console.log(`  └─ URL: ${frag.url?.substring(0, 120)}...`);
        setDebugInfo((prev) => ({
          ...prev,
          fragsLoaded: prev.fragsLoaded + 1,
          lastFragUrl: frag.url || "",
          lastFragStatus: `✓ Loaded (L${frag.level}, SN${frag.sn})`,
        }));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        // Only log fatal errors to reduce noise
        if (data.fatal) {
          console.log(
            `[HLS ERROR] Type: ${data.type}, Details: ${data.details}, Fatal: ${data.fatal}`
          );
        }
        if (data.frag && data.fatal) {
          console.log(
            `  └─ Fragment: Level ${data.frag.level}, SN ${data.frag.sn}, URL: ${data.frag.url?.substring(0, 100)}...`
          );
          setDebugInfo((prev) => ({
            ...prev,
            fragsErrored: prev.fragsErrored + 1,
            lastFragUrl: data.frag?.url || prev.lastFragUrl,
            lastFragStatus: `✗ Error: ${data.details} (L${data.frag?.level})`,
          }));
        }
        if (data.response) {
          console.log(
            `  └─ Response: Status ${data.response.code}, Text: ${data.response.text?.substring(0, 100)}`
          );
        }
        if (data.reason) {
          console.log(`  └─ Reason: ${data.reason}`);
        }

        // Check for codec-related errors
        const isCodecError =
          data.details === "bufferAddCodecError" || data.details === "bufferAppendError";

        // Check for fragment parsing errors (corrupted/incompatible stream)
        const isFragParsingError = data.details === "fragParsingError";

        if (isCodecError) {
          codecErrorCount.current++;
          console.log(`[HLS] Codec error count: ${codecErrorCount.current}`);
        }

        if (isFragParsingError) {
          fragParsingErrorCount.current++;
          console.log(`[HLS PARSING ERROR #${fragParsingErrorCount.current}]`);

          // Try switching to a different quality level if available
          if (fragParsingErrorCount.current === 3 && hls.levels.length > 1) {
            const currentLevel = hls.currentLevel;
            const newLevel = currentLevel === 0 ? 1 : currentLevel - 1;
            console.log(
              `HLS: Switching from level ${currentLevel} to ${newLevel} due to parsing errors`
            );
            hls.currentLevel = newLevel;
            fragParsingErrorCount.current = 0; // Reset counter for new level
          }
          // If we get too many parsing errors even after switching levels, the stream is incompatible
          else if (fragParsingErrorCount.current >= 15) {
            console.error("HLS: Too many fragment parsing errors - stream format incompatible");
            setPlaybackError(t("codecError"));
            hls.destroy();
            return;
          }
        }

        if (data.fatal) {
          console.warn("HLS Fatal error:", data.type, data.details);

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover from network errors
              console.log("HLS: Attempting network recovery...");
              hls.startLoad();
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              mediaErrorCount.current++;

              // If we've hit too many codec errors, try another level first
              if (codecErrorCount.current >= 2 && hls.levels.length > 1) {
                const currentLevel = hls.currentLevel;
                const newLevel = currentLevel === 0 ? 1 : 0;
                console.log(`HLS: Switching to level ${newLevel} after codec errors`);
                hls.currentLevel = newLevel;
                codecErrorCount.current = 0;
                hls.recoverMediaError();
                return;
              }

              if (codecErrorCount.current >= 4) {
                console.error("HLS: Unsupported codec - try a different provider");
                setPlaybackError(t("codecError"));
                hls.destroy();
                return;
              }

              // If we've hit too many parsing errors, stop trying
              if (fragParsingErrorCount.current >= 15) {
                console.error("HLS: Stream format incompatible - try a different provider");
                setPlaybackError(t("codecError"));
                hls.destroy();
                return;
              }

              if (mediaErrorCount.current <= 3) {
                // Try standard recovery
                console.log(`HLS: Media error #${mediaErrorCount.current}, attempting recovery...`);
                hls.recoverMediaError();
              } else if (mediaErrorCount.current <= 5) {
                // Try swapping audio codec
                console.log("HLS: Trying swap audio codec...");
                hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                // After multiple failures, show error
                console.error("HLS: Recovery failed after multiple attempts");
                setPlaybackError(t("playerError"));
                hls.destroy();
              }
              break;

            default:
              setPlaybackError(t("playerError"));
              break;
          }
        } else {
          // Non-fatal errors - commented out to reduce noise
          // console.log("HLS non-fatal error:", data.details);
        }
      });

      // Handle level switching for quality changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        // console.log("HLS: Level switched to", data.level);
        setDebugInfo((prev) => ({
          ...prev,
          hlsLevel: data.level,
        }));
      });

      // Update buffer length periodically
      bufferInterval = setInterval(() => {
        if (video.buffered.length > 0) {
          const bufferEnd = video.buffered.end(video.buffered.length - 1);
          const bufferLength = bufferEnd - video.currentTime;
          setDebugInfo((prev) => ({
            ...prev,
            bufferLength: Math.round(bufferLength * 10) / 10,
            hlsLevel: hls.currentLevel,
          }));
        }
      }, 1000);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = videoUrl;
    } else {
      // Direct video source
      video.src = videoUrl;
    }

    return () => {
      if (bufferInterval) {
        clearInterval(bufferInterval);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, isMounted, t, getSavedPosition, isHLSSource, needsProxy]);

  // Sync video state with isPlaying
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Sync video volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Save volume/mute preferences when they change
  useEffect(() => {
    if (prefsLoaded) {
      savePreferences({ volume, muted: isMuted });
    }
  }, [volume, isMuted, prefsLoaded, savePreferences]);

  // Save playback position periodically (every 5 seconds)
  useEffect(() => {
    if (currentTime > 5 && Math.abs(currentTime - lastSavedTime.current) >= 5) {
      savePosition(currentTime);
      lastSavedTime.current = currentTime;
    }
  }, [currentTime, savePosition]);

  // Clear position when video ends (completed watching)
  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 10) {
      clearPosition();
    }
  }, [currentTime, duration, clearPosition]);

  // Auto-select Spanish subtitle if available (prioritize Latin American Spanish)
  useEffect(() => {
    if (subtitles.length > 0 && selectedSubtitle === null) {
      // Filter out subtitles without lang (like thumbnails)
      const validSubtitles = subtitles.filter(
        (s) => s.lang && typeof s.lang === "string" && !s.lang.toLowerCase().includes("thumbnail")
      );
      console.log(
        "Available subtitles:",
        validSubtitles.map((s) => s.lang)
      );

      // Priority order for subtitle selection:
      // 1. Spanish Latin America (most preferred)
      // 2. Spanish (general)
      // 3. English
      // 4. First available

      const spanishLatamSub = validSubtitles.find(
        (s) =>
          s.lang.toLowerCase().includes("latin") ||
          s.lang.toLowerCase().includes("latam") ||
          s.lang.toLowerCase().includes("latinoamerica") ||
          s.lang.toLowerCase().includes("latinoamérica")
      );

      const spanishSub = validSubtitles.find(
        (s) =>
          (s.lang.toLowerCase().includes("spanish") ||
            s.lang.toLowerCase().includes("español") ||
            s.lang.toLowerCase() === "es") &&
          !s.lang.toLowerCase().includes("latin") // Exclude latam to avoid double-matching
      );

      const englishSub = validSubtitles.find(
        (s) => s.lang.toLowerCase().includes("english") || s.lang.toLowerCase() === "en"
      );

      // Select in priority order
      let selected: string | null = null;
      if (spanishLatamSub) {
        selected = spanishLatamSub.lang;
        console.log("Auto-selecting Spanish (Latin America) subtitle:", selected);
      } else if (spanishSub) {
        selected = spanishSub.lang;
        console.log("Auto-selecting Spanish subtitle:", selected);
      } else if (englishSub) {
        selected = englishSub.lang;
        console.log("Auto-selecting English subtitle:", selected);
      } else if (validSubtitles.length > 0) {
        selected = validSubtitles[0].lang;
        console.log("Auto-selecting first available subtitle:", selected);
      }

      setSelectedSubtitle(selected);
    }
  }, [subtitles, selectedSubtitle]);

  // Subtitle cues storage
  const subtitleCuesRef = useRef<Array<{ start: number; end: number; text: string }>>([]);

  // Load and parse subtitles when selected
  useEffect(() => {
    if (!selectedSubtitle || subtitles.length === 0) {
      subtitleCuesRef.current = [];
      setCurrentSubtitleText("");
      return;
    }

    const selectedSub = subtitles.find((s) => s.lang === selectedSubtitle);
    if (!selectedSub) {
      console.warn("Selected subtitle not found:", selectedSubtitle);
      return;
    }

    console.log("Loading subtitle:", selectedSub.lang, selectedSub.url);
    const proxyUrl = buildProxyUrl(selectedSub.url, referer);

    fetch(proxyUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch subtitle: ${res.status}`);
        }
        return res.text();
      })
      .then((vttText) => {
        console.log("Subtitle loaded, parsing...", vttText.substring(0, 100));

        // Parse VTT format
        const cues: Array<{ start: number; end: number; text: string }> = [];
        const lines = vttText.split("\n");
        let i = 0;

        // Skip WEBVTT header
        while (i < lines.length && !lines[i].includes("-->")) {
          i++;
        }

        while (i < lines.length) {
          const line = lines[i].trim();

          if (line.includes("-->")) {
            // Parse timestamp line: "00:00:01.000 --> 00:00:04.000"
            const [startStr, endStr] = line.split("-->").map((s) => s.trim().split(" ")[0]);

            const parseTime = (timeStr: string): number => {
              const parts = timeStr.split(":");
              if (parts.length === 3) {
                const [h, m, s] = parts;
                return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(",", "."));
              } else if (parts.length === 2) {
                const [m, s] = parts;
                return parseFloat(m) * 60 + parseFloat(s.replace(",", "."));
              }
              return 0;
            };

            const start = parseTime(startStr);
            const end = parseTime(endStr);

            // Collect text lines until empty line or next timestamp
            const textLines: string[] = [];
            i++;
            while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
              // Remove style tags like <c.color>, </c>, etc.
              const cleanText = lines[i].replace(/<[^>]*>/g, "").trim();
              if (cleanText) {
                textLines.push(cleanText);
              }
              i++;
            }

            if (textLines.length > 0) {
              cues.push({ start, end, text: textLines.join("\n") });
            }
          } else {
            i++;
          }
        }

        console.log(`Parsed ${cues.length} subtitle cues`);
        subtitleCuesRef.current = cues;
      })
      .catch((err) => {
        console.error("Failed to load subtitles:", err);
        subtitleCuesRef.current = [];
      });
  }, [selectedSubtitle, subtitles, referer]);

  // Update current subtitle text based on video time
  useEffect(() => {
    if (!selectedSubtitle || subtitleCuesRef.current.length === 0) {
      setCurrentSubtitleText("");
      return;
    }

    const activeCue = subtitleCuesRef.current.find(
      (cue) => currentTime >= cue.start && currentTime <= cue.end
    );

    setCurrentSubtitleText(activeCue?.text || "");
  }, [currentTime, selectedSubtitle]);

  // Auto-hide controls (touch + mouse)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const showAndHide = () => {
      setShowControls(true);
      setShowMobileMenu(false);
      clearTimeout(timeout);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const handleMouseMove = () => showAndHide();
    const handleTouchStart = () => showAndHide();

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchstart", handleTouchStart);
        clearTimeout(timeout);
      };
    }
  }, [isPlaying]);

  // Fullscreen change listener (includes iOS webkit prefix)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFS);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Seek functions (defined before keyboard shortcuts)
  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const seekBy = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (video) {
        const newTime = Math.max(
          0,
          Math.min(video.duration || duration, video.currentTime + seconds)
        );
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case "m":
          setIsMuted((m) => !m);
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          seekBy(-10);
          break;
        case "ArrowRight":
          seekBy(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seekBy]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    // Check if already fullscreen
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      // Enter fullscreen - try container first, then video element for iOS
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          // Fallback for iOS Safari - use video element
          if (
            video &&
            (video as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen
          ) {
            (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
          }
        });
      } else if (
        (container as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen
      ) {
        (container as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      } else if (
        video &&
        (video as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen
      ) {
        // iOS Safari fallback
        (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (
        (document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen
      ) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
  }, []);

  // Change HLS quality level
  const changeHlsLevel = useCallback(
    (levelIndex: number) => {
      const hls = hlsRef.current;
      if (!hls) return;

      console.log(`[HLS] Changing quality level to: ${levelIndex === -1 ? "auto" : levelIndex}`);
      hls.currentLevel = levelIndex;
      setSelectedHlsLevel(levelIndex);

      const levelName =
        levelIndex === -1
          ? "Auto"
          : hlsLevels.find((l) => l.index === levelIndex)?.height + "p" || `Level ${levelIndex}`;
      toast.success(`Quality: ${levelName}`);
    },
    [hlsLevels]
  );

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const skipIntro = () => {
    if (intro) {
      seekTo(intro.end);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show skip intro button
  const showSkipIntro = intro && currentTime >= intro.start && currentTime < intro.end;

  // Show skip outro button
  const showSkipOutro =
    outro && hasNextEpisode && currentTime >= outro.start && currentTime < outro.end;

  if (isLoading) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 p-4">
          <Skeleton className="mb-2 h-4 w-48" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    );
  }

  // Check for error state:
  // - For direct providers (HiAnime): need currentSource
  // - For embed providers (AnimeFLV): need embedServers
  const hasValidSource = isEmbedProvider ? embedServers.length > 0 : !!currentSource;

  if (error || !hasValidSource) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="mb-2 text-lg">{t("playerError")}</p>
          <p className="mb-4 text-sm text-gray-400">{t("playerErrorDescription")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video overflow-hidden rounded-lg bg-black"
    >
      {/* Embed Player for AnimeFLV and similar providers */}
      {isEmbedProvider && embedServers.length > 0 ? (
        <>
          {/* Server Selection for Embed Providers */}
          <div className="absolute top-2 left-2 z-40 flex items-center gap-2">
            <Select
              value={selectedEmbedServer.toString()}
              onValueChange={(v) => setSelectedEmbedServer(parseInt(v))}
            >
              <SelectTrigger className="h-8 w-auto min-w-37.5 border-none bg-black/70 text-xs text-white">
                <SelectValue placeholder="Select Server" />
              </SelectTrigger>
              <SelectContent>
                {embedServers.map((server, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Embedded iframe player */}
          {embedServers[selectedEmbedServer]?.url && (
            <iframe
              src={embedServers[selectedEmbedServer].url}
              className="h-full w-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer"
              style={{ border: "none" }}
            />
          )}

          {/* Info banner for embed providers */}
          <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="text-xs text-gray-300">
              📺 {streamingData?.provider === "animeflv" ? "AnimeFLV" : streamingData?.provider} -{" "}
              {t("embedPlayerNote") || "Using external player"}
            </p>
          </div>
        </>
      ) : (
        /* Native Video Element with HLS.js for direct streaming providers */
        <>
          {isMounted ? (
            <video
              ref={videoRef}
              className="h-full w-full"
              crossOrigin="anonymous"
              playsInline
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onDurationChange={(e) => setDuration(e.currentTarget.duration)}
              onWaiting={() => setIsBuffering(true)}
              onCanPlay={() => setIsBuffering(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                const video = e.currentTarget;
                const error = video.error;
                console.error("Video error:", {
                  code: error?.code,
                  message: error?.message,
                  networkState: video.networkState,
                  readyState: video.readyState,
                  currentSrc: video.currentSrc,
                  videoUrl: videoUrl,
                });

                // Provide more specific error messages
                if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                  setPlaybackError(t("codecError"));
                } else if (error?.code === MediaError.MEDIA_ERR_NETWORK) {
                  setPlaybackError("Network error - please check your connection");
                } else {
                  setPlaybackError(t("playerError"));
                }
              }}
              onEnded={() => {
                if (hasNextEpisode && onNextEpisode) {
                  onNextEpisode();
                }
              }}
            ></video>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
          )}
        </>
      )}

      {/* Custom Subtitle Overlay - only for direct players */}
      {!isEmbedProvider && currentSubtitleText && (
        <div className="pointer-events-none absolute right-0 bottom-20 left-0 z-30 flex justify-center px-4">
          <div className="max-w-[90%] text-center" style={subtitleStyles}>
            <p className="whitespace-pre-line">{currentSubtitleText}</p>
          </div>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Error Overlay - only for direct players */}
      {!isEmbedProvider && playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-white">{playbackError}</p>
          <Button
            variant="outline"
            onClick={() => {
              setPlaybackError(null);
              refetch();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {/* Click to Play/Pause - only for direct players */}
      {!isEmbedProvider && (
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => setIsPlaying((p) => !p)}
        />
      )}

      {/* Skip Intro Button - only for direct players */}
      {!isEmbedProvider && showSkipIntro && (
        <Button
          className="absolute right-4 bottom-20 z-20"
          onClick={(e) => {
            e.stopPropagation();
            skipIntro();
          }}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          {t("skipIntro")}
        </Button>
      )}

      {/* Skip Outro / Next Episode Button */}
      {showSkipOutro && (
        <Button
          className="absolute right-4 bottom-20 z-20 text-xs sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onNextEpisode?.();
          }}
        >
          <SkipForward className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{t("nextEpisode")}</span>
          <span className="sm:hidden">{t("next") || "Next"}</span>
        </Button>
      )}

      {/* Close Button - only for direct players (embed has its own) */}
      {!isEmbedProvider && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 z-20 h-8 w-8 text-white transition-opacity hover:bg-white/20 sm:top-4 sm:right-4 sm:h-10 sm:w-10",
            showControls ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}

      {/* Controls Overlay - only for direct players */}
      {!isEmbedProvider && (
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/80 p-2 transition-opacity sm:p-4",
            showControls ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Title - Hidden on very small screens */}
          <div className="xs:block mb-1 hidden sm:mb-2">
            <p className="truncate text-xs font-medium text-white sm:text-sm">
              {animeTitle && `${animeTitle} - `}
              {episode.title || `${t("episode")} ${episode.number}`}
            </p>
          </div>

          {/* Progress Bar - Larger touch target on mobile */}
          <div className="mb-2 py-1 sm:mb-2 sm:py-0">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-600 sm:h-1"
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Controls - Responsive layout */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {/* Left Controls */}
            <div className="flex items-center gap-0.5 sm:gap-2">
              {/* Previous Episode - Hidden on mobile if no space */}
              {hasPreviousEpisode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 sm:h-10 sm:w-10"
                  onClick={onPreviousEpisode}
                >
                  <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}

              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 sm:h-10 sm:w-10"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>

              {/* Next Episode */}
              {hasNextEpisode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 sm:h-10 sm:w-10"
                  onClick={onNextEpisode}
                >
                  <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}

              {/* Volume Controls - Hidden on mobile (they use hardware controls) */}
              <div className="group/volume hidden items-center sm:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={() => setIsMuted((m) => !m)}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (newVol > 0) setIsMuted(false);
                  }}
                  className="accent-primary hidden h-1 w-16 cursor-pointer group-hover/volume:block"
                />
              </div>

              {/* Time - Compact on mobile */}
              <span className="text-xs text-white sm:text-sm">
                {formatTime(currentTime)}
                <span className="hidden sm:inline"> / {formatTime(duration)}</span>
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-0.5 sm:gap-2">
              {/* Desktop: Show all controls inline */}
              {/* Mobile: Show only essential controls + menu button */}

              {/* Fullscreen - Always visible */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 sm:h-10 sm:w-10"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>

              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-white hover:bg-white/20",
                    showMobileMenu && "bg-white/20"
                  )}
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}

              {/* Desktop Controls (hidden on mobile) */}
              <div className="hidden items-center gap-2 sm:flex">
                {/* Subtitle Selector */}
                {subtitles.length > 0 && (
                  <Select
                    value={selectedSubtitle || "off"}
                    onValueChange={(value) => {
                      setSelectedSubtitle(value === "off" ? null : value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-32 border-none bg-transparent text-white">
                      <Subtitles className="mr-1 h-4 w-4" />
                      <SelectValue placeholder={t("subtitles")} />
                    </SelectTrigger>
                    <SelectContent container={containerRef.current}>
                      <SelectItem value="off">{t("subtitlesOff")}</SelectItem>
                      {subtitles.map((sub) => (
                        <SelectItem key={sub.lang} value={sub.lang}>
                          {sub.label || sub.lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Subtitle Style Settings */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-white hover:bg-white/20",
                    showSubtitleSettings && "bg-white/20"
                  )}
                  onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
                  title={t("subtitleSettings")}
                >
                  <Palette className="h-5 w-5" />
                </Button>

                {/* Search External Subtitles Button - Show when no Spanish from API */}
                {!hasSpanishFromApi && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleSearchExternalSubtitles()}
                    disabled={isSearchingExternalSubs}
                    title={t("searchExternalSubs")}
                  >
                    {isSearchingExternalSubs ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Globe className="h-5 w-5" />
                    )}
                  </Button>
                )}

                {/* Quality Selector - HLS Levels */}
                {hlsLevels.length > 0 && (
                  <Select
                    value={selectedHlsLevel.toString()}
                    onValueChange={(val) => changeHlsLevel(parseInt(val, 10))}
                  >
                    <SelectTrigger className="h-8 w-auto min-w-20 gap-1 border-none bg-white/10 px-2 text-white hover:bg-white/20">
                      <Settings className="h-4 w-4 shrink-0" />
                      <SelectValue>
                        <span className="font-medium">
                          {selectedHlsLevel === -1
                            ? "Auto"
                            : `${hlsLevels.find((l) => l.index === selectedHlsLevel)?.height || "?"}p`}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-35" container={containerRef.current}>
                      {/* Auto option */}
                      <SelectItem value="-1" className="cursor-pointer">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">Auto</span>
                          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                            {t("recommended") || "REC"}
                          </span>
                        </div>
                      </SelectItem>
                      {/* Quality levels sorted by height descending */}
                      {hlsLevels.map((level) => {
                        const isHighRes = level.height >= 1080;
                        const isMedRes = level.height >= 720 && level.height < 1080;
                        const isLowRes = level.height < 480;

                        return (
                          <SelectItem
                            key={level.index}
                            value={level.index.toString()}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{level.height}p</span>
                              {isHighRes && (
                                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">
                                  HD
                                </span>
                              )}
                              {isMedRes && (
                                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-400">
                                  SD
                                </span>
                              )}
                              {isLowRes && (
                                <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
                                  FAST
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}

                {/* Debug Button - Desktop only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("text-white hover:bg-white/20", showDebugInfo && "bg-amber-500/30")}
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  title="Toggle debug info"
                >
                  <span className="font-mono text-xs">DBG</span>
                </Button>
              </div>
              {/* End desktop controls */}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Panel - Positioned to avoid cutoff */}
      {!isEmbedProvider && isMobile && showMobileMenu && (
        <div
          className="absolute right-1 bottom-14 z-40 max-h-[calc(100%-4rem)] w-44 overflow-y-auto rounded-lg bg-black/95 p-2 shadow-xl sm:right-2 sm:bottom-16 sm:w-48"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "calc(100% - 60px)" }}
        >
          <div className="space-y-1">
            {/* Subtitles */}
            {subtitles.length > 0 && (
              <div className="mb-2 border-b border-gray-700 pb-2">
                <p className="mb-1 px-2 text-[10px] tracking-wide text-gray-400 uppercase">
                  {t("subtitles")}
                </p>
                <button
                  onClick={() => {
                    setSelectedSubtitle(null);
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10",
                    !selectedSubtitle ? "text-primary font-medium" : "text-white"
                  )}
                >
                  {t("subtitlesOff")}
                </button>
                {subtitles.slice(0, 4).map((sub) => (
                  <button
                    key={sub.lang}
                    onClick={() => {
                      setSelectedSubtitle(sub.lang);
                      setShowMobileMenu(false);
                    }}
                    className={cn(
                      "w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-white/10",
                      selectedSubtitle === sub.lang ? "text-primary font-medium" : "text-white"
                    )}
                  >
                    {sub.label || sub.lang}
                  </button>
                ))}
              </div>
            )}

            {/* Quality */}
            {hlsLevels.length > 0 && (
              <div className="mb-2 border-b border-gray-700 pb-2">
                <p className="mb-1 px-2 text-[10px] tracking-wide text-gray-400 uppercase">
                  {t("quality") || "Quality"}
                </p>
                <button
                  onClick={() => {
                    changeHlsLevel(-1);
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10",
                    selectedHlsLevel === -1 ? "text-primary font-medium" : "text-white"
                  )}
                >
                  Auto
                </button>
                {hlsLevels.slice(0, 4).map((level) => (
                  <button
                    key={level.index}
                    onClick={() => {
                      changeHlsLevel(level.index);
                      setShowMobileMenu(false);
                    }}
                    className={cn(
                      "w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10",
                      selectedHlsLevel === level.index ? "text-primary font-medium" : "text-white"
                    )}
                  >
                    {level.height}p
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <button
              onClick={() => {
                setShowSubtitleSettings(true);
                setShowMobileMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white hover:bg-white/10"
            >
              <Palette className="h-3.5 w-3.5" />
              {t("subtitleSettings")}
            </button>

            {!hasSpanishFromApi && (
              <button
                onClick={() => {
                  handleSearchExternalSubtitles();
                  setShowMobileMenu(false);
                }}
                disabled={isSearchingExternalSubs}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white hover:bg-white/10"
              >
                <Globe className="h-3.5 w-3.5" />
                {t("searchExternalSubs")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debug Info Panel - only for direct players */}
      {!isEmbedProvider && showDebugInfo && (
        <div className="absolute top-12 left-2 z-50 max-w-sm rounded bg-black/90 p-3 font-mono text-xs text-white">
          <div className="mb-2 font-bold text-amber-400">🔧 Debug Info</div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">HLS Level:</span> {debugInfo.hlsLevel} /{" "}
              {debugInfo.hlsLevels - 1}
            </div>
            <div>
              <span className="text-gray-400">Buffer:</span> {debugInfo.bufferLength}s
            </div>
            <div>
              <span className="text-gray-400">Frags Loaded:</span>{" "}
              <span className="text-green-400">{debugInfo.fragsLoaded}</span>
              {" | "}
              <span className="text-gray-400">Errors:</span>{" "}
              <span className={debugInfo.fragsErrored > 0 ? "text-red-400" : "text-green-400"}>
                {debugInfo.fragsErrored}
              </span>
            </div>
            <div className="mt-2 border-t border-white/20 pt-2">
              <span className="text-gray-400">Last Frag:</span>{" "}
              <span
                className={
                  debugInfo.lastFragStatus.startsWith("✓") ? "text-green-400" : "text-red-400"
                }
              >
                {debugInfo.lastFragStatus || "N/A"}
              </span>
            </div>
            {debugInfo.lastFragUrl && (
              <div className="mt-1 text-[10px] break-all text-gray-500">
                {debugInfo.lastFragUrl.length > 100
                  ? debugInfo.lastFragUrl.substring(0, 100) + "..."
                  : debugInfo.lastFragUrl}
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-white/20 pt-2 text-[10px] text-gray-400">
            Press F12 for full logs
          </div>
        </div>
      )}

      {/* Subtitle Settings Modal - Responsive */}
      {showSubtitleSettings && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center"
          onClick={() => setShowSubtitleSettings(false)}
        >
          <div
            className="mx-0 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-gray-900 shadow-xl sm:mx-4 sm:max-h-[70vh] sm:max-w-sm sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag indicator */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-600" />
            </div>

            {/* Header - Fixed */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-400 sm:h-5 sm:w-5" />
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {t("subtitleSettings")}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white sm:h-10 sm:w-10"
                onClick={() => setShowSubtitleSettings(false)}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Presets - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <p className="mb-2 text-xs text-gray-400 sm:mb-3 sm:text-sm">
                {t("selectSubtitleStyle")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-0 sm:space-y-2">
                {(Object.keys(SUBTITLE_PRESETS) as SubtitlePresetId[]).map((presetId) => {
                  const preset = SUBTITLE_PRESETS[presetId];
                  const isSelected = preferences.subtitlePreset === presetId;

                  return (
                    <button
                      key={presetId}
                      onClick={() => {
                        savePreferences({ subtitlePreset: presetId });
                        toast.success(t("subtitleStyleChanged"));
                      }}
                      className={cn(
                        "rounded-lg border p-2 text-left transition-colors sm:w-full sm:p-3",
                        isSelected
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white sm:text-sm">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-purple-500 px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      {/* Preview - Smaller on mobile */}
                      <div
                        className="mt-1.5 inline-block rounded px-1.5 py-0.5 text-xs sm:mt-2 sm:px-2 sm:py-1 sm:text-sm"
                        style={{
                          color: preset.fontColor,
                          backgroundColor: preset.backgroundColor,
                          fontWeight: preset.fontWeight,
                          textShadow: preset.textShadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                        }}
                      >
                        {t("subtitlePreview")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Subtitles Search Modal - Responsive */}
      {showExternalSubsSearch && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center"
          onClick={() => setShowExternalSubsSearch(false)}
        >
          <div
            className="mx-0 max-h-[90vh] w-full overflow-hidden rounded-t-2xl bg-gray-900 shadow-xl sm:mx-4 sm:max-h-[80%] sm:max-w-md sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag indicator */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {t("externalSubtitles")}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white sm:h-10 sm:w-10"
                onClick={() => setShowExternalSubsSearch(false)}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Language Filter + Source Stats */}
            <div className="border-b border-gray-700 px-3 py-2 sm:px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{t("filterByLanguage")}:</span>
                  <select
                    value={externalSubLanguageFilter}
                    onChange={(e) => handleLanguageFilterChange(e.target.value)}
                    className="flex-1 rounded bg-gray-800 px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none sm:flex-none sm:py-1"
                  >
                    <option value="all">{t("allLanguages")}</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.count})
                      </option>
                    ))}
                  </select>
                </div>
                {!isSearchingExternalSubs && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-blue-400">OpenSubs: {sourceStats.opensubtitles}</span>
                    <span className="text-purple-400">Subdl: {sourceStats.subdl}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[50vh] overflow-y-auto p-3 sm:max-h-80 sm:p-4">
              {isSearchingExternalSubs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400 sm:h-8 sm:w-8" />
                </div>
              ) : externalSubResults.length === 0 ? (
                <div className="py-6 text-center text-gray-400 sm:py-8">
                  <Search className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
                  <p className="text-sm">{t("noExternalSubsFound")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {externalSubResults.map((sub, index) => (
                    <button
                      key={sub.id}
                      onClick={() => handleLoadExternalSubtitle(sub)}
                      className={cn(
                        "w-full rounded-lg border p-2 text-left transition-colors hover:bg-gray-800 sm:p-3",
                        index === 0 && sub.matchScore && sub.matchScore >= 70
                          ? "border-green-500/50 bg-green-900/10"
                          : "border-gray-700 hover:border-blue-500"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-sm font-medium text-white sm:text-base">
                            {sub.language}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1 py-0.5 text-[10px] sm:px-1.5 sm:text-xs",
                              sub.source === "opensubtitles"
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-purple-600/20 text-purple-400"
                            )}
                          >
                            {sub.source === "opensubtitles" ? "OpenSubs" : "Subdl"}
                          </span>
                          {/* Best match badge - Only on larger screens */}
                          {index === 0 && sub.matchScore && sub.matchScore >= 70 && (
                            <span className="hidden rounded bg-green-600/30 px-1.5 py-0.5 text-xs font-medium text-green-400 sm:inline">
                              ✓ {t("bestMatch")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {sub.isTrusted && (
                            <span className="hidden rounded bg-green-600/20 px-1.5 py-0.5 text-xs text-green-400 sm:inline">
                              Trusted
                            </span>
                          )}
                          {sub.isAiTranslated && (
                            <span className="rounded bg-yellow-600/20 px-1 py-0.5 text-[10px] text-yellow-400 sm:px-1.5 sm:text-xs">
                              AI
                            </span>
                          )}
                          {/* Match score indicator */}
                          {sub.matchScore !== undefined && (
                            <span
                              className={cn(
                                "rounded px-1 py-0.5 text-[10px] font-medium sm:px-1.5 sm:text-xs",
                                sub.matchScore >= 70
                                  ? "bg-green-600/20 text-green-400"
                                  : sub.matchScore >= 50
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-gray-600/20 text-gray-400"
                              )}
                            >
                              {sub.matchScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400 sm:gap-3 sm:text-xs">
                        {sub.downloadCount > 0 && (
                          <span>⬇ {sub.downloadCount.toLocaleString()}</span>
                        )}
                        {sub.rating > 0 && <span>★ {sub.rating.toFixed(1)}</span>}
                        {sub.release && (
                          <span className="max-w-37.5 truncate sm:max-w-none">{sub.release}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700 px-3 py-2 text-center text-[10px] text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
              {t("parallelSearch")} • OpenSubtitles + Subdl
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
