"use client";

import { Card, CardHeader, CardTitle, CardContent, Flex } from "@/components/ds";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable section card with title and optional action
 */
export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Flex align="center" justify="between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {action}
        </Flex>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
