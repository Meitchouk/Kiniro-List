"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { setTranslationGetter } from "@/lib/api";

/**
 * Provider that sets up the translation getter for API client
 * This allows API utilities to access translations without being React components
 */
export function TranslationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();

  useEffect(() => {
    // Set up translation getter for API client
    setTranslationGetter((key: string, params?: Record<string, string | number>) => {
      return t(key, params);
    });
  }, [t]);

  return <>{children}</>;
}
