import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dividerVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-[1px] w-full",
      vertical: "h-full w-[1px]",
    },
    spacing: {
      none: "",
      sm: "",
      md: "",
      lg: "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", spacing: "sm", className: "my-2" },
    { orientation: "horizontal", spacing: "md", className: "my-4" },
    { orientation: "horizontal", spacing: "lg", className: "my-6" },
    { orientation: "vertical", spacing: "sm", className: "mx-2" },
    { orientation: "vertical", spacing: "md", className: "mx-4" },
    { orientation: "vertical", spacing: "lg", className: "mx-6" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    spacing: "none",
  },
});

export interface DividerProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {
  /**
   * Text to display in the middle of the divider
   */
  label?: string;
}

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation, spacing, label, ...props }, ref) => {
    if (label) {
      return (
        <div
          className={cn(
            "flex items-center gap-4",
            orientation === "vertical" && "flex-col",
            spacing === "sm" && (orientation === "horizontal" ? "my-2" : "mx-2"),
            spacing === "md" && (orientation === "horizontal" ? "my-4" : "mx-4"),
            spacing === "lg" && (orientation === "horizontal" ? "my-6" : "mx-6"),
            className
          )}
        >
          <div className={cn(dividerVariants({ orientation }))} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {label}
          </span>
          <div className={cn(dividerVariants({ orientation }))} />
        </div>
      );
    }

    return (
      <hr
        ref={ref}
        className={cn(dividerVariants({ orientation, spacing }), className)}
        {...props}
      />
    );
  }
);
Divider.displayName = "Divider";

export { Divider, dividerVariants };
