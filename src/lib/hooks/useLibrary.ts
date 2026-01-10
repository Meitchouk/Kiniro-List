"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getLibrary,
  upsertLibraryEntry,
  deleteLibraryEntry,
  setAuthHeadersGetter,
} from "@/lib/api";
import { toast } from "sonner";
import type { LibraryStatus } from "@/lib/types";

export function useLibrary() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  // Set up auth headers for API
  if (user) {
    setAuthHeadersGetter(getAuthHeaders);
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["library"],
    queryFn: () => getLibrary(),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (params: { animeId: number; status: LibraryStatus }) => upsertLibraryEntry(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("library.updated"));
    },
    onError: () => {
      toast.error(t("errors.generic"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (animeId: number) => deleteLibraryEntry(animeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("library.removed"));
    },
    onError: () => {
      toast.error(t("errors.generic"));
    },
  });

  const handleStatusChange = (animeId: number, status: LibraryStatus) => {
    updateMutation.mutate({ animeId, status });
  };

  const handleRemove = (animeId: number) => {
    deleteMutation.mutate(animeId);
  };

  const items = data?.items || data?.entries || [];

  return {
    items,
    isLoading,
    error,
    refetch,
    user,
    updateMutation,
    deleteMutation,
    handleStatusChange,
    handleRemove,
  };
}
