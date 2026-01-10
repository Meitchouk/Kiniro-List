/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { signInWithGoogleIdToken } from "@/lib/auth/clientAuth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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

function setCooldown(msFromNow: number) {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now() + msFromNow));
}

function clearCooldown() {
    localStorage.removeItem(COOLDOWN_KEY);
}

export function GoogleOneTap() {
    const { user } = useAuth();
    const t = useTranslations("errors");
    const initialized = useRef(false);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

    useEffect(() => {
        if (user) {
            // Ya logueado: por si acaso
            try {
                window.google?.accounts?.id?.cancel();
            } catch { }
            clearCooldown();
            return;
        }

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
                    use_fedcm_for_prompt: false,
                    callback: async (response: { credential: string }) => {
                        try {
                            await signInWithGoogleIdToken(response.credential);
                            clearCooldown(); // éxito
                        } catch (err: unknown) {
                            const code = (err as any)?.code || "unknown";
                            if (code === "auth/configuration-not-found") {
                                toast.error(t("authConfigNotFound"));
                            } else if (code === "auth/operation-not-allowed") {
                                toast.error(t("authProviderDisabled"));
                            }
                        }
                    },
                });

                // Detecta cuando el usuario lo cierra / ignora y aplica cooldown
                window.google.accounts.id.prompt((notification: any) => {
                    if (cancelled) return;

                    // Si no se mostró, usualmente conviene enfriar un rato para no insistir.
                    if (notification.isNotDisplayed?.()) {
                        // 24h
                        setCooldown(24 * 60 * 60 * 1000);
                        return;
                    }

                    if (notification.isSkippedMoment?.()) {
                        // El usuario lo ignoró/pospuso: 24h
                        setCooldown(24 * 60 * 60 * 1000);
                        return;
                    }

                    if (notification.isDismissedMoment?.()) {
                        // Cerró el modal: 7 días (ajústalo a tu gusto)
                        setCooldown(7 * 24 * 60 * 60 * 1000);
                        return;
                    }
                });
            } catch (e) {
                initialized.current = false;
                console.error("Google One Tap initialization error", e);
            }
        })();

        return () => {
            cancelled = true;
            try {
                window.google?.accounts?.id?.cancel();
            } catch { }
        };
    }, [user, clientId, t]);

    return null;
}
