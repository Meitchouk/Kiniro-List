/**
 * Internationalized Date Formatting Utilities
 *
 * Provides centralized date formatting functions that respect the current locale.
 * Works with both client and server components.
 *
 * @example
 * // Client-side usage
 * import { useLocalizedDateFormat } from "@/lib/i18n/dateFormat";
 * const { formatLongDate, formatShortDate } = useLocalizedDateFormat();
 *
 * // Server-side usage
 * import { createServerDateFormatter } from "@/lib/i18n/dateFormat";
 * const formatter = await createServerDateFormatter();
 */

import { DateTime } from "luxon";

// ============================================================================
// TYPES
// ============================================================================

export type DateInput = Date | string | number | null | undefined;

export interface DateFormatOptions {
  timezone?: string;
}

export interface DateFormatter {
  /**
   * Format a date in long format (e.g., "January 16, 2026" / "16 de enero de 2026")
   */
  formatLongDate: (date: DateInput, options?: DateFormatOptions) => string;

  /**
   * Format a date in short format (e.g., "Jan 16, 2026" / "16 ene 2026")
   */
  formatShortDate: (date: DateInput, options?: DateFormatOptions) => string;

  /**
   * Format a date with day of week (e.g., "Thursday, January 16" / "Jueves, 16 de enero")
   */
  formatFullDate: (date: DateInput, options?: DateFormatOptions) => string;

  /**
   * Format a date in relative short format (e.g., "Jan 16" / "16 ene")
   */
  formatMonthDay: (date: DateInput, options?: DateFormatOptions) => string;

  /**
   * Format time only (e.g., "14:30" / "2:30 PM")
   */
  formatTime: (date: DateInput, options?: DateFormatOptions) => string;

  /**
   * Format a date range (e.g., "Jan 16 — Jan 22, 2026")
   */
  formatDateRange: (
    startDate: DateInput,
    endDate: DateInput,
    options?: DateFormatOptions
  ) => string;
}

// ============================================================================
// LOCALE MAPPING
// ============================================================================

/**
 * Maps our app locales to Luxon/Intl locale codes
 */
const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
};

function getNormalizedLocale(locale: string): string {
  return LOCALE_MAP[locale] || LOCALE_MAP.en;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function toDateTime(date: DateInput, timezone: string = "UTC"): DateTime | null {
  if (!date) return null;

  if (typeof date === "number") {
    // Unix timestamp (seconds)
    return DateTime.fromSeconds(date).setZone(timezone);
  }

  if (typeof date === "string") {
    // Try ISO format first
    const isoDate = DateTime.fromISO(date).setZone(timezone);
    if (isoDate.isValid) return isoDate;

    // Try parsing as timestamp string
    const ts = parseInt(date, 10);
    if (!isNaN(ts)) {
      return DateTime.fromSeconds(ts).setZone(timezone);
    }

    return null;
  }

  if (date instanceof Date) {
    return DateTime.fromJSDate(date).setZone(timezone);
  }

  return null;
}

// ============================================================================
// FORMATTER FACTORY
// ============================================================================

/**
 * Creates a date formatter for a specific locale
 */
export function createDateFormatter(locale: string): DateFormatter {
  const normalizedLocale = getNormalizedLocale(locale);

  const formatLongDate = (date: DateInput, options?: DateFormatOptions): string => {
    const dt = toDateTime(date, options?.timezone);
    if (!dt) return "";

    return dt.setLocale(normalizedLocale).toLocaleString({
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (date: DateInput, options?: DateFormatOptions): string => {
    const dt = toDateTime(date, options?.timezone);
    if (!dt) return "";

    return dt.setLocale(normalizedLocale).toLocaleString({
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (date: DateInput, options?: DateFormatOptions): string => {
    const dt = toDateTime(date, options?.timezone);
    if (!dt) return "";

    return dt.setLocale(normalizedLocale).toLocaleString({
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatMonthDay = (date: DateInput, options?: DateFormatOptions): string => {
    const dt = toDateTime(date, options?.timezone);
    if (!dt) return "";

    return dt.setLocale(normalizedLocale).toLocaleString({
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: DateInput, options?: DateFormatOptions): string => {
    const dt = toDateTime(date, options?.timezone);
    if (!dt) return "";

    return dt.setLocale(normalizedLocale).toLocaleString({
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateRange = (
    startDate: DateInput,
    endDate: DateInput,
    options?: DateFormatOptions
  ): string => {
    const start = toDateTime(startDate, options?.timezone);
    const end = toDateTime(endDate, options?.timezone);

    if (!start || !end) return "";

    const startFormatted = start.setLocale(normalizedLocale).toLocaleString({
      month: "short",
      day: "numeric",
    });

    const endFormatted = end.setLocale(normalizedLocale).toLocaleString({
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} — ${endFormatted}`;
  };

  return {
    formatLongDate,
    formatShortDate,
    formatFullDate,
    formatMonthDay,
    formatTime,
    formatDateRange,
  };
}

// ============================================================================
// CLIENT-SIDE HOOK
// ============================================================================

// Note: This will be imported and used with useLocale() from next-intl
// The actual hook is created in a separate file to avoid "use client" issues

// ============================================================================
// SERVER-SIDE HELPER
// ============================================================================

/**
 * Creates a date formatter for server components
 * Uses the current locale from next-intl
 *
 * @example
 * import { createServerDateFormatter } from "@/lib/i18n/dateFormat";
 *
 * export default async function Page() {
 *   const dateFormatter = await createServerDateFormatter();
 *   const formattedDate = dateFormatter.formatLongDate(new Date());
 * }
 */
export async function createServerDateFormatter(): Promise<DateFormatter> {
  const { getLocale } = await import("next-intl/server");
  const locale = await getLocale();
  return createDateFormatter(locale);
}
