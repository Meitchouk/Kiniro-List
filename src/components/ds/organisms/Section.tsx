import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "../atoms/Typography";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Section title
   */
  title?: string;
  /**
   * Section subtitle/description
   */
  subtitle?: string;
  /**
   * Action element (button, link, etc.)
   */
  action?: React.ReactNode;
  /**
   * Padding preset
   * @default "md"
   */
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
}

const spacingClasses = {
  none: "",
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
  xl: "py-16",
};

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    { className, title, subtitle, action, spacing = "md", children, ...props },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {(title || subtitle || action) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {title && <Typography variant="h3">{title}</Typography>}
              {subtitle && (
                <Typography variant="subtitle2" className="mt-1">
                  {subtitle}
                </Typography>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </section>
    );
  }
);
Section.displayName = "Section";

// Page Section with full-width background
export interface PageSectionProps extends SectionProps {
  /**
   * Background color variant
   */
  bg?: "default" | "muted" | "card";
}

const bgClasses = {
  default: "",
  muted: "bg-muted",
  card: "bg-card",
};

const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ className, bg = "default", ...props }, ref) => {
    return (
      <Section
        ref={ref}
        className={cn(bgClasses[bg], className)}
        {...props}
      />
    );
  }
);
PageSection.displayName = "PageSection";

export { Section, PageSection };
