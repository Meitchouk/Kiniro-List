/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { signInWithGoogleIdToken } from "@/lib/auth/clientAuth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { googleOAuth } from "@/lib/config";

declare global {
  interface Window {
    google?: any;
  }
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) return resolve();

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

const COOLDOWN_KEY = "gsi_one_tap_cooldown_until";

function isCooldownActive() {
  const raw = localStorage.getItem(COOLDOWN_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

function clearCooldown() {
  localStorage.removeItem(COOLDOWN_KEY);
}

export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const t = useTranslations("errors");
  const initialized = useRef(false);
  const clientId = googleOAuth.clientId;

  // Don't render anything if user is logged in or still loading
  // This prevents the Google One Tap from even initializing
  if (user || loading) {
    // Clear cooldown when user logs in successfully
    if (user && typeof window !== "undefined") {
      clearCooldown();
    }
    return null;
  }

  return <GoogleOneTapInner clientId={clientId} initialized={initialized} t={t} />;
}

interface GoogleOneTapInnerProps {
  clientId: string | undefined;
  initialized: React.MutableRefObject<boolean>;
  t: ReturnType<typeof useTranslations<"errors">>;
}

function GoogleOneTapInner({ clientId, initialized, t }: GoogleOneTapInnerProps) {
  useEffect(() => {
    if (initialized.current) return;
    if (!clientId) return;

    // Evita mostrarlo si el usuario lo ignoró recientemente
    if (typeof window !== "undefined" && isCooldownActive()) return;

    let cancelled = false;

    (async () => {
      try {
        await loadGsiScript();
        if (cancelled) return;

        initialized.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: false,
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async (response: { credential: string }) => {
            try {
              await signInWithGoogleIdToken(response.credential);
              clearCooldown();
            } catch (err: unknown) {
              const error = err as any;
              const code = error?.code || "unknown";
              const message = error?.message || "";

              console.error("One Tap sign in error:", code, message, err);

              if (code === "auth/configuration-not-found") {
                toast.error(t("authConfigNotFound"));
              } else if (code === "auth/operation-not-allowed") {
                toast.error(t("authProviderDisabled"));
              } else if (message.includes("Failed to fetch user data")) {
                toast.error(t("loadUserDataFailed"));
              } else if (message) {
                toast.error(t("errorWithMessage", { message }));
              } else {
                toast.error(t("signInFailed"));
              }
            }
          },
        });

        if (!cancelled) {
          // Use prompt with notification callback to handle FedCM errors gracefully
          window.google.accounts.id.prompt((notification: any) => {
            // Handle prompt status - these are informational, not errors
            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason();
              // These are expected scenarios, log but don't show error to user
              console.log("[GoogleOneTap] Not displayed:", reason);
            } else if (notification.isSkippedMoment()) {
              const reason = notification.getSkippedReason();
              console.log("[GoogleOneTap] Skipped:", reason);
            } else if (notification.isDismissedMoment()) {
              const reason = notification.getDismissedReason();
              console.log("[GoogleOneTap] Dismissed:", reason);
            }
          });
        }
      } catch (e: any) {
        // FedCM NetworkError is expected when user cancels or browser blocks
        // Don't show error to user for these cases
        if (e?.message?.includes("NetworkError") || e?.name === "NetworkError") {
          console.log("[GoogleOneTap] FedCM request cancelled or blocked by browser");
        } else {
          console.error("Google One Tap initialization error", e);
        }
        initialized.current = false;
      }
    })();

    return () => {
      cancelled = true;
      initialized.current = false;
    };
  }, [clientId, initialized, t]);

  return null;
}
