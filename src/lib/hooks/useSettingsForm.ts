import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { settingsSchema } from "@/lib/schemas";
import { updateSettings } from "@/lib/api";
import { getBrowserTimezone } from "@/lib/utils/timezone";
import { deepEqual } from "@/lib/utils/common";
import type { SettingsFormData, UserResponse } from "@/lib/types";

interface UseSettingsFormOptions {
  userData?: UserResponse;
  onLocaleChange?: () => void;
}

export function useSettingsForm({ userData, onLocaleChange }: UseSettingsFormOptions = {}) {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const router = useRouter();
  const lastAppliedSettings = useRef<SettingsFormData | null>(null);

  const browserTimezone = getBrowserTimezone();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: browserTimezone,
      locale: "en",
      theme: "system",
      calendarView: "weekly",
      filters: {
        hideAdult: true,
        onlyWatching: true,
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormData) => updateSettings(data),
    onSuccess: async (_, variables) => {
      // Apply theme immediately
      if (variables.theme) {
        setTheme(variables.theme);
      }

      // Show success toast
      toast.success("Settings saved");

      // Invalidate and wait for refetch
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      // If locale changed, refresh the page to apply new language
      if (variables.locale && variables.locale !== userData?.locale) {
        // Small delay to show toast before refresh
        setTimeout(() => {
          router.refresh();
          onLocaleChange?.();
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Settings update error:", error);
      toast.error("Failed to save settings");
    },
  });

  // Sync form with user data
  useEffect(() => {
    if (!userData) return;

    const nextValues: SettingsFormData = {
      timezone: userData.timezone || browserTimezone,
      locale: userData.locale || "en",
      theme: userData.theme || "system",
      calendarView: userData.calendarView || "weekly",
      filters: userData.filters || { hideAdult: true, onlyWatching: true },
    };

    // Avoid overwriting user input while they are editing or while a save is pending
    if (form.formState.isDirty || updateMutation.isPending) return;

    // Skip reset if values are identical to the last applied set
    if (lastAppliedSettings.current && deepEqual(lastAppliedSettings.current, nextValues)) {
      return;
    }

    form.reset(nextValues);
    lastAppliedSettings.current = nextValues;
  }, [userData, form, browserTimezone, updateMutation.isPending]);

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  return {
    form,
    onSubmit,
    isPending: updateMutation.isPending,
    isSuccess: updateMutation.isSuccess,
    isError: updateMutation.isError,
  };
}
