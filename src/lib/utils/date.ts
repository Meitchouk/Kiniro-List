import { DateTime } from "luxon";
import type { AiringStatusLabel } from "@/lib/types";

export function getTimezone(): string {
  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
}

export function formatAiringTime(
  timestamp: number | string | null | undefined,
  timezone: string = "UTC"
): string {
  if (!timestamp) return "";

  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  const dt = DateTime.fromSeconds(ts).setZone(timezone);

  return dt.toFormat("EEE, MMM d 'at' h:mm a");
}

export function formatDate(
  date: Date | string | null | undefined,
  timezone: string = "UTC"
): string {
  if (!date) return "";

  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date).setZone(timezone)
      : DateTime.fromJSDate(date).setZone(timezone);

  return dt.toFormat("MMM d, yyyy");
}

export function getSecondsToAir(airingAtTimestamp: number): number {
  const now = DateTime.now().toSeconds();
  return Math.max(0, airingAtTimestamp - now);
}

export function getAiringStatusLabel(
  airingAtTimestamp: number | null | undefined
): AiringStatusLabel {
  if (!airingAtTimestamp) return "unknown";

  const now = DateTime.now();
  const airingTime = DateTime.fromSeconds(airingAtTimestamp);

  if (airingTime < now) {
    return "aired";
  }

  const startOfToday = now.startOf("day");
  const endOfToday = now.endOf("day");

  if (airingTime >= startOfToday && airingTime <= endOfToday) {
    return "airs_today";
  }

  return "airs_in";
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Aired";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getWeekday(timestamp: number): number {
  return DateTime.fromSeconds(timestamp, { zone: "UTC" }).weekday % 7;
}

export function getCurrentSeason(): {
  year: number;
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
} {
  const now = DateTime.now();
  const month = now.month;
  const year = now.year;

  let season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  if (month >= 1 && month <= 3) {
    season = "WINTER";
  } else if (month >= 4 && month <= 6) {
    season = "SPRING";
  } else if (month >= 7 && month <= 9) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

  return { year, season };
}

export function getNextSeason(): { year: number; season: "WINTER" | "SPRING" | "SUMMER" | "FALL" } {
  const { year, season } = getCurrentSeason();

  const seasons: Array<"WINTER" | "SPRING" | "SUMMER" | "FALL"> = [
    "WINTER",
    "SPRING",
    "SUMMER",
    "FALL",
  ];
  const currentIndex = seasons.indexOf(season);
  const nextIndex = (currentIndex + 1) % 4;

  return {
    year: nextIndex === 0 ? year + 1 : year,
    season: seasons[nextIndex],
  };
}
