"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Reusable empty state component for lists
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        {icon && (
          <div className="mx-auto mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <CardTitle className="mb-2">{title}</CardTitle>
        {description && (
          <CardDescription className="mb-6 max-w-md mx-auto">
            {description}
          </CardDescription>
        )}
        {action && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
