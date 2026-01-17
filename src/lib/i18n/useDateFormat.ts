"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import { createDateFormatter, type DateFormatter } from "./dateFormat";

/**
 * Hook for client-side localized date formatting
 *
 * @example
 * function MyComponent() {
 *   const { formatLongDate, formatShortDate } = useLocalizedDateFormat();
 *
 *   return (
 *     <div>
 *       <p>Long: {formatLongDate(new Date())}</p>
 *       <p>Short: {formatShortDate(new Date())}</p>
 *     </div>
 *   );
 * }
 */
export function useLocalizedDateFormat(): DateFormatter {
  const locale = useLocale();

  return useMemo(() => createDateFormatter(locale), [locale]);
}
