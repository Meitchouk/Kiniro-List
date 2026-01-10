"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, Typography, IconWrapper, Stack } from "@/components/ds";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const t = useTranslations("errors");

  return (
    <Stack align="center" justify="center" gap={4} className="py-12">
      <IconWrapper icon={AlertCircle} size="xl" colorScheme="destructive" />
      <Typography variant="h6" colorScheme="secondary">
        {message || t("generic")}
      </Typography>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("retry")}
        </Button>
      )}
    </Stack>
  );
}
