/**
 * React hook for secure storage operations
 *
 * Provides a convenient way to use encrypted localStorage in React components
 * with automatic state synchronization.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { secureStorage } from "@/lib/utils/secureStorage";

interface UseSecureStorageOptions<T> {
  /** Default value if nothing is stored */
  defaultValue: T;
  /** Whether to sync across tabs */
  syncTabs?: boolean;
}

/**
 * Hook for managing encrypted localStorage values
 *
 * @example
 * ```tsx
 * const [settings, setSettings, loading] = useSecureStorage('userSettings', {
 *   defaultValue: { theme: 'dark' }
 * });
 * ```
 */
export function useSecureStorage<T>(
  key: string,
  options: UseSecureStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const { defaultValue, syncTabs = false } = options;

  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        const value = await secureStorage.getItem<T>(key);
        if (mounted) {
          setStoredValue(value ?? defaultValue);
        }
      } catch (error) {
        console.error(`[useSecureStorage] Failed to load ${key}:`, error);
        if (mounted) {
          setStoredValue(defaultValue);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue]);

  // Handle cross-tab synchronization
  useEffect(() => {
    if (!syncTabs) return;

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === `ks_${key}`) {
        try {
          const value = await secureStorage.getItem<T>(key);
          setStoredValue(value ?? defaultValue);
        } catch (error) {
          console.error(`[useSecureStorage] Failed to sync ${key}:`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, defaultValue, syncTabs]);

  // Setter function
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await secureStorage.setItem(key, valueToStore);
      } catch (error) {
        console.error(`[useSecureStorage] Failed to save ${key}:`, error);
        throw error;
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, loading];
}

/**
 * Hook for managing sensitive session data
 * Automatically clears on logout
 */
export function useSecureSession<T extends Record<string, unknown>>(
  defaultValue: T
): {
  data: T;
  setData: (value: Partial<T>) => Promise<void>;
  clearData: () => void;
  loading: boolean;
} {
  const [data, setStoredData, loading] = useSecureStorage<T>("session", {
    defaultValue,
    syncTabs: true,
  });

  const setData = useCallback(
    async (value: Partial<T>) => {
      await setStoredData((prev) => ({ ...prev, ...value }));
    },
    [setStoredData]
  );

  const clearData = useCallback(() => {
    secureStorage.removeItem("session");
    setStoredData(() => defaultValue);
  }, [defaultValue, setStoredData]);

  return { data, setData, clearData, loading };
}

export default useSecureStorage;
