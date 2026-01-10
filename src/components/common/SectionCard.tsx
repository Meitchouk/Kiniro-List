"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      <CardHeader className={action ? "flex flex-row items-center justify-between" : undefined}>
        <CardTitle className="text-lg">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
