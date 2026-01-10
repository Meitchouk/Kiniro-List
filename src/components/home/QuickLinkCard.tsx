import Link from "next/link";
import { Card, CardContent, Typography, Flex, IconWrapper, Stack } from "@/components/ds";
import type { LucideIcon } from "lucide-react";

interface QuickLinkCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * Quick link card for home page navigation
 */
export function QuickLinkCard({ href, icon: Icon, title, subtitle }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent>
          <Flex align="center" gap={4} className="p-6">
            <IconWrapper icon={Icon} size="lg" colorScheme="primary" />
            <Stack gap={1}>
              <Typography variant="body1" weight="semibold">
                {title}
              </Typography>
              <Typography variant="caption" colorScheme="secondary">
                {subtitle}
              </Typography>
            </Stack>
          </Flex>
        </CardContent>
      </Card>
    </Link>
  );
}
