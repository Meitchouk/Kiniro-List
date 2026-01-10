/**
 * Hook for managing profile data
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCurrentUser, getLibrary, setAuthHeadersGetter } from "@/lib/api";

export interface LibraryStats {
  watching: number;
  planned: number;
  completed: number;
  paused: number;
  dropped: number;
}

export function useProfile() {
  const { user, getAuthHeaders } = useAuth();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getCurrentUser(),
    enabled: !!user,
  });

  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: () => getLibrary(),
    enabled: !!user,
  });

  // Calculate library stats
  const libraryItems = libraryQuery.data?.items || libraryQuery.data?.entries || [];
  const libraryStats: LibraryStats = libraryItems.reduce(
    (acc: LibraryStats, item: { status: string }) => {
      const status = item.status as keyof LibraryStats;
      if (status in acc) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    },
    { watching: 0, planned: 0, completed: 0, paused: 0, dropped: 0 }
  );

  return {
    user,
    userData: userQuery.data,
    libraryStats,
    isLoading: userQuery.isLoading,
    isLibraryLoading: libraryQuery.isLoading,
  };
}
