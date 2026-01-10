import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva("h-2 w-full overflow-hidden rounded-full bg-secondary", {
  variants: {
    size: {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
      xl: "h-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const progressBarVariants = cva("h-full transition-all duration-300 ease-in-out", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-destructive",
    },
    animated: {
      true: "animate-pulse",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    animated: false,
  },
});

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  /**
   * Progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Whether to show the value label
   * @default false
   */
  showLabel?: boolean;
  /**
   * Custom label formatter
   */
  formatLabel?: (value: number, max: number) => string;
  /**
   * Indeterminate state (unknown progress)
   * @default false
   */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      size,
      variant,
      animated,
      value = 0,
      max = 100,
      showLabel = false,
      formatLabel,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const label = formatLabel
      ? formatLabel(value, max)
      : `${Math.round(percentage)}%`;

    return (
      <div className="w-full space-y-1">
        {showLabel && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{label}</span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(progressVariants({ size }), className)}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ variant, animated }),
              indeterminate && "animate-indeterminate-progress origin-left"
            )}
            style={{
              width: indeterminate ? "50%" : `${percentage}%`,
            }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress, progressVariants, progressBarVariants };
