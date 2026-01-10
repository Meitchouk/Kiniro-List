"use client";

import { Card, CardContent, Typography, Flex } from "@/components/ds";
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
        {icon && <div className="text-muted-foreground mx-auto mb-4">{icon}</div>}
        <Typography variant="h5" className="mb-2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" colorScheme="secondary" className="mx-auto mb-6 max-w-md">
            {description}
          </Typography>
        )}
        {action && (
          <Flex direction="column" gap={3} justify="center" className="sm:flex-row">
            {action}
          </Flex>
        )}
      </CardContent>
    </Card>
  );
}
