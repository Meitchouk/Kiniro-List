/**
 * Spacer component for consistent vertical/horizontal spacing
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type SpacerSize = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

const sizeClasses: Record<SpacerSize, { horizontal: string; vertical: string }> = {
  1: { horizontal: "w-1", vertical: "h-1" },
  2: { horizontal: "w-2", vertical: "h-2" },
  3: { horizontal: "w-3", vertical: "h-3" },
  4: { horizontal: "w-4", vertical: "h-4" },
  5: { horizontal: "w-5", vertical: "h-5" },
  6: { horizontal: "w-6", vertical: "h-6" },
  8: { horizontal: "w-8", vertical: "h-8" },
  10: { horizontal: "w-10", vertical: "h-10" },
  12: { horizontal: "w-12", vertical: "h-12" },
  16: { horizontal: "w-16", vertical: "h-16" },
  20: { horizontal: "w-20", vertical: "h-20" },
  24: { horizontal: "w-24", vertical: "h-24" },
};

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spacer (Tailwind spacing scale)
   * @default 4
   */
  size?: SpacerSize;
  /**
   * Direction of the spacer
   * @default "vertical"
   */
  axis?: "horizontal" | "vertical";
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size = 4, axis = "vertical", className, ...props }, ref) => {
    const sizeClass = sizeClasses[size][axis];

    return (
      <div
        ref={ref}
        className={cn("shrink-0", axis === "vertical" ? "w-full" : "h-full", sizeClass, className)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Spacer.displayName = "Spacer";

export { Spacer };
