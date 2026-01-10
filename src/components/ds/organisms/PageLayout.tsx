import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "../atoms/Box";

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Header element
   */
  header?: React.ReactNode;
  /**
   * Footer element
   */
  footer?: React.ReactNode;
  /**
   * Whether content should be in a container
   * @default true
   */
  contained?: boolean;
  /**
   * Maximum width of container
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  /**
   * Padding preset
   * @default "default"
   */
  padding?: "none" | "sm" | "default" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "py-4",
  default: "py-8",
  lg: "py-12",
};

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  (
    {
      className,
      header,
      footer,
      contained = true,
      maxWidth = "7xl",
      padding = "default",
      children,
      ...props
    },
    ref
  ) => {
    const content = contained ? (
      <Container maxWidth={maxWidth} className={cn(paddingClasses[padding])}>
        {children}
      </Container>
    ) : (
      <div className={cn(paddingClasses[padding])}>{children}</div>
    );

    return (
      <div
        ref={ref}
        className={cn("flex min-h-screen flex-col", className)}
        {...props}
      >
        {header}
        <main className="flex-1">{content}</main>
        {footer}
      </div>
    );
  }
);
PageLayout.displayName = "PageLayout";

// Simple page wrapper for consistent page structure
export interface SimplePageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Custom header element
   */
  header?: React.ReactNode;
}

const SimplePage = React.forwardRef<HTMLDivElement, SimplePageProps>(
  ({ className, header, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {header}
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    );
  }
);
SimplePage.displayName = "SimplePage";

export { PageLayout, SimplePage };
