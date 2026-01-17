/**
 * Internationalization Module
 *
 * Central export point for i18n utilities that are safe to import
 * from both client and server components.
 *
 * IMPORTANT: Do NOT re-export server-only utilities that depend on
 * next/headers or other server-only APIs from this file, as this
 * file is imported in client components. Import those directly
 * from their modules in server code when needed.
 *
 * @example
 * // Date formatting (client-side)
 * import { useLocalizedDateFormat } from "@/lib/i18n";
 *
 * // Date formatting (server-side)
 * import { createServerDateFormatter } from "@/lib/i18n";
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
