"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function PageHeader({ title, showBack = true }: PageHeaderProps) {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="flex items-center gap-4 border-b border-border/40 bg-background/50 px-4 py-4 backdrop-blur-sm">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {title && (
        <h1 className="flex-1 truncate text-xl font-bold md:text-2xl">
          {title}
        </h1>
      )}
    </div>
  );
}
