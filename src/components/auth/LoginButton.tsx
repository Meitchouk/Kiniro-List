"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ds";
import { AuthModal } from "./AuthModal";

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoginButton({ className, variant = "default", size = "sm" }: LoginButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const t = useTranslations();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`min-w-32 justify-center gap-2 ${className ?? ""}`}
        onClick={() => setShowAuthModal(true)}
      >
        <LogIn className="h-4 w-4" />
        <span>{t("common.login")}</span>
      </Button>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
