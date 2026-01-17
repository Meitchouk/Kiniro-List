/**
 * Internationalization Module
 *
 * Central export point for all i18n utilities.
 *
 * @example
 * // Date formatting (client-side)
 * import { useLocalizedDateFormat } from "@/lib/i18n";
 *
 * // Date formatting (server-side)
 * import { createServerDateFormatter } from "@/lib/i18n";
 *
 * // Locale configuration
 * import { locales, defaultLocale } from "@/lib/i18n";
 */

// Date formatting
export {
  createDateFormatter,
  createServerDateFormatter,
  type DateInput,
  type DateFormatOptions,
  type DateFormatter,
} from "./dateFormat";

// Date formatting hook (client-side)
export { useLocalizedDateFormat } from "./useDateFormat";

// Locale configuration
export { locales, defaultLocale, type Locale } from "./request";
