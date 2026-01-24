"use client";

import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ds";

export default function PasswordResetCompletePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-2xl font-bold">{t("auth.passwordResetComplete")}</h1>
        <p className="text-muted-foreground mt-2">{t("auth.passwordResetCompleteDescription")}</p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">{t("auth.goToLogin")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
