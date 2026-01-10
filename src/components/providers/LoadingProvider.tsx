"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { setLoadingCallbacks, clearLoadingCallbacks } from "@/lib/fetchInterceptor";

interface LoadingContextType {
  isLoading: boolean;
  isInitialLoading: boolean;
  loadingCount: number;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  setInitialLoading: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

// Hook opcional que no lanza error si no hay provider
export function useLoadingOptional() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const startLoading = useCallback((key: string = "default") => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const stopLoading = useCallback((key: string = "default") => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const setInitialLoading = useCallback((value: boolean) => {
    setIsInitialLoading(value);
  }, []);

  // Connect to fetch interceptor
  useEffect(() => {
    setLoadingCallbacks(startLoading, stopLoading);
    return () => clearLoadingCallbacks();
  }, [startLoading, stopLoading]);

  const value = useMemo(
    () => ({
      isLoading: loadingKeys.size > 0,
      isInitialLoading,
      loadingCount: loadingKeys.size,
      startLoading,
      stopLoading,
      setInitialLoading,
    }),
    [loadingKeys.size, isInitialLoading, startLoading, stopLoading, setInitialLoading]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}
