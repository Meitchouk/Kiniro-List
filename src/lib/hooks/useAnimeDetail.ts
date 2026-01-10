"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAnimeDetail,
  upsertLibraryEntry,
  deleteLibraryEntry,
  getLibrary,
  setAuthHeadersGetter,
} from "@/lib/api";
import { toast } from "sonner";
import type { LibraryStatus } from "@/lib/types";

export function useAnimeDetail(animeId: number) {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>("watching");

  // Setup auth headers for API calls
  useEffect(() => {
    if (user) {
      setAuthHeadersGetter(getAuthHeaders);
    }
  }, [user, getAuthHeaders]);

  // Fetch anime detail
  const {
    data: anime,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["anime-detail", animeId],
    queryFn: () => getAnimeDetail(animeId),
  });

  // Fetch library to check if anime is already added
  const { data: libraryData } = useQuery({
    queryKey: ["library"],
    queryFn: getLibrary,
    enabled: !!user,
  });

  const libraryEntry = libraryData?.entries.find((e) => e.animeId === animeId);

  // Add/update library mutation
  const addMutation = useMutation({
    mutationFn: async (status: LibraryStatus) => {
      await upsertLibraryEntry({ animeId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("anime.addToLibrary"));
    },
  });

  // Remove from library mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      await deleteLibraryEntry(animeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("anime.removeFromLibrary"));
    },
  });

  const handleAddToLibrary = (status: LibraryStatus) => {
    setSelectedStatus(status);
    addMutation.mutate(status);
  };

  const handleUpdateStatus = (status: LibraryStatus) => {
    setSelectedStatus(status);
    addMutation.mutate(status);
  };

  const handleRemoveFromLibrary = () => {
    removeMutation.mutate();
  };

  return {
    anime,
    isLoading,
    error,
    refetch,
    user,
    libraryEntry,
    selectedStatus,
    addMutation,
    removeMutation,
    handleAddToLibrary,
    handleUpdateStatus,
    handleRemoveFromLibrary,
  };
}
