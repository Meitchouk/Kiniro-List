"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";
import { LOCALES } from "@/lib/constants";

export function LanguageSwitcher() {
  const router = useRouter();
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  const handleLocaleChange = async (locale: string) => {
    // Set cookie
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;

    // If logged in, persist to Firestore
    if (user) {
      try {
        const headers = await getAuthHeaders();
        await fetch("/api/me/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ locale }),
        });
      } catch (error) {
        console.error("Failed to save locale preference:", error);
        toast.error(t("common.languageSaveError"));
      }
    }

    // Refresh the page to apply new locale
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("language.select")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
          >
            {locale.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
