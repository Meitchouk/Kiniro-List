"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Button, Typography, Flex, Container } from "@/components/ds";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function PageHeader({ title, showBack = true }: PageHeaderProps) {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="border-border/40 bg-background/50 border-b backdrop-blur-sm">
      <Container>
        <Flex align="center" gap={4} className="py-4">
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
            <Typography variant="h4" as="h1" truncate className="flex-1">
              {title}
            </Typography>
          )}
        </Flex>
      </Container>
    </div>
  );
}
