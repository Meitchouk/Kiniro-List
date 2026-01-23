"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ds";
import { useAuth } from "@/components/providers/AuthProvider";

export default function EmailVerifiedPage() {
  const t = useTranslations();
  const { user, refetchUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    // Refresh user data to get updated emailVerified status
    const refresh = async () => {
      try {
        if (user) {
          await refetchUser();
        }
      } finally {
        setIsRefreshing(false);
      }
    };

    // Small delay to ensure Firebase has processed the verification
    const timer = setTimeout(refresh, 1500);
    return () => clearTimeout(timer);
  }, [user, refetchUser]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {isRefreshing ? (
          <>
            <Loader2 className="text-primary mx-auto h-16 w-16 animate-spin" />
            <h1 className="mt-6 text-2xl font-bold">{t("auth.verifying")}</h1>
            <p className="text-muted-foreground mt-2">{t("auth.verifyingDescription")}</p>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-6 text-2xl font-bold">{t("auth.emailVerified")}</h1>
            <p className="text-muted-foreground mt-2">{t("auth.emailVerifiedDescription")}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild>
                <Link href="/">{t("auth.goToHome")}</Link>
              </Button>
              {!user && (
                <Button variant="outline" asChild>
                  <Link href="/">{t("common.login")}</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
