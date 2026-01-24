"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageSquarePlus, ArrowRight } from "lucide-react";
import { Card, CardContent, Typography, Flex } from "@/components/ds";

/**
 * Feedback Call-to-Action component for home page
 * Encourages users to submit suggestions, bug reports, and comments
 */
export function FeedbackCTA() {
  const t = useTranslations("feedback");

  return (
    <Link href="/feedback">
      <Card className="from-primary/10 via-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 group cursor-pointer bg-linear-to-r transition-all hover:shadow-md">
        <CardContent className="px-6 py-4">
          <Flex align="center" justify="between" gap={4}>
            <Flex align="center" gap={4}>
              <div className="bg-primary/20 rounded-full p-2.5">
                <MessageSquarePlus className="text-primary h-5 w-5" />
              </div>
              <div>
                <Typography variant="subtitle2" className="text-primary font-semibold">
                  {t("ctaTitle")}
                </Typography>
                <Typography variant="caption" colorScheme="secondary">
                  {t("ctaDescription")}
                </Typography>
              </div>
            </Flex>
            <Flex
              align="center"
              className="bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground rounded-full p-2 transition-all"
            >
              <ArrowRight className="h-4 w-4" />
            </Flex>
          </Flex>
        </CardContent>
      </Card>
    </Link>
  );
}
