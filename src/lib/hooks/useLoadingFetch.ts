import { useCallback } from "react";
import { useLoading } from "@/components/providers/LoadingProvider";

interface UseLoadingFetchOptions {
  key?: string;
}

export function useLoadingFetch(options: UseLoadingFetchOptions = {}) {
  const { startLoading, stopLoading } = useLoading();
  const { key = "fetch" } = options;

  const loadingFetch = useCallback(
    async <T>(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<T> => {
      const loadingKey = `${key}-${Date.now()}`;
      try {
        startLoading(loadingKey);
        const response = await fetch(input, init);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } finally {
        stopLoading(loadingKey);
      }
    },
    [key, startLoading, stopLoading]
  );

  const loadingFetchRaw = useCallback(
    async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const loadingKey = `${key}-${Date.now()}`;
      try {
        startLoading(loadingKey);
        return await fetch(input, init);
      } finally {
        stopLoading(loadingKey);
      }
    },
    [key, startLoading, stopLoading]
  );

  return { loadingFetch, loadingFetchRaw };
}
