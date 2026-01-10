import { Card, CardHeader, CardTitle, CardDescription, IconWrapper } from "@/components/ds";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Feature card for home page features section
 */
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <IconWrapper icon={Icon} size="xl" colorScheme="primary" />
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
