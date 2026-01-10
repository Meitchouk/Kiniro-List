"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export function GoogleButton({ className }: { className?: string }) {
    const { signIn } = useAuth();
    const t = useTranslations();

    const handleGoogleSignIn = async () => {
        try {
            await signIn();
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code || "unknown";
            if (code === "auth/configuration-not-found") {
                toast.error(t("errors.authConfigNotFound"));
            } else if (code === "auth/operation-not-allowed") {
                toast.error(t("errors.authProviderDisabled"));
            } else {
                toast.error(t("common.error"));
            }
            throw err;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className={`min-w-32 justify-between ${className ?? ""}`}>
                    <LogIn className="h-4 w-4" />
                    <span>{t("common.login")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>{t("common.loginWith")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGoogleSignIn}>
                    <Image
                        src="/google.svg"
                        alt="Google"
                        width={16}
                        height={16}
                        className="mr-2"
                    />
                    Google
                </DropdownMenuItem>
                {/* Future providers can be added here */}
                {/* <DropdownMenuItem onClick={handleEmailSignIn}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </DropdownMenuItem> */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
