import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "../atoms/Typography";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Page title
   */
  title: string;
  /**
   * Page description/subtitle
   */
  description?: string;
  /**
   * Show back button
   * @default false
   */
  showBack?: boolean;
  /**
   * Custom back URL (defaults to browser history)
   */
  backUrl?: string;
  /**
   * Back button label
   * @default "Back"
   */
  backLabel?: string;
  /**
   * Action element(s) on the right side
   */
  actions?: React.ReactNode;
  /**
   * Breadcrumb or navigation above title
   */
  breadcrumb?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      title,
      description,
      showBack,
      backUrl,
      backLabel = "Back",
      actions,
      breadcrumb,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4">
          {breadcrumb && <div className="pt-3">{breadcrumb}</div>}
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {showBack && (
                backUrl ? (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={backUrl}>
                      <ArrowLeft className="h-5 w-5" />
                      <span className="sr-only">{backLabel}</span>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">{backLabel}</span>
                  </Button>
                )
              )}
              <div className="min-w-0">
                <Typography variant="h5" truncate className="font-semibold">
                  {title}
                </Typography>
                {description && (
                  <Typography variant="caption" truncate>
                    {description}
                  </Typography>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      </header>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
