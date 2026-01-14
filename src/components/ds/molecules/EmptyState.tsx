"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "../atoms/Typography";
import type { LucideIcon } from "lucide-react";

const emptyStateVariants = cva("text-center py-12", {
  variants: {
    size: {
      sm: "py-8",
      md: "py-12",
      lg: "py-16",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyStateVariants> {
  /**
   * Icon to display
   */
  icon?: LucideIcon;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button(s)
   */
  action?: React.ReactNode;
  /**
   * Whether to render inside a Card
   * @default true
   */
  withCard?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon: Icon, title, description, action, withCard = true, ...props }, ref) => {
    const content = (
      <>
        {Icon && (
          <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Icon className="text-muted-foreground h-6 w-6" />
          </div>
        )}
        <Typography variant="h5" className="mb-2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" colorScheme="secondary" className="mx-auto mb-6 max-w-md">
            {description}
          </Typography>
        )}
        {action && <div className="flex flex-col justify-center gap-3 sm:flex-row">{action}</div>}
      </>
    );

    if (withCard) {
      return (
        <Card ref={ref} className={className} {...props}>
          <CardContent className={cn(emptyStateVariants({ size }))}>{content}</CardContent>
        </Card>
      );
    }

    return (
      <div ref={ref} className={cn(emptyStateVariants({ size }), className)} {...props}>
        {content}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

// Specific empty state variants
export interface NoResultsProps extends Omit<EmptyStateProps, "title"> {
  title?: string;
  searchTerm?: string;
}

function NoResults({ title, searchTerm, description, ...props }: NoResultsProps) {
  const t = useTranslations("common");
  const defaultTitle = title || t("noResultsFound");
  const desc =
    description || (searchTerm ? t("noResultsFor", { searchTerm }) : t("tryAdjustingFilters"));

  return <EmptyState title={defaultTitle} description={desc} {...props} />;
}

export interface NoDataProps extends Omit<EmptyStateProps, "title"> {
  title?: string;
}

function NoData({ title, description, ...props }: NoDataProps) {
  const t = useTranslations("common");
  const defaultTitle = title || t("noDataAvailable");
  const defaultDesc = description || t("nothingToDisplay");

  return <EmptyState title={defaultTitle} description={defaultDesc} {...props} />;
}

export { EmptyState, NoResults, NoData, emptyStateVariants };
