import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      12: "grid-cols-12",
    },
    smCols: {
      1: "sm:grid-cols-1",
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-3",
      4: "sm:grid-cols-4",
      5: "sm:grid-cols-5",
      6: "sm:grid-cols-6",
    },
    mdCols: {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    },
    lgCols: {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
      6: "lg:grid-cols-6",
    },
    xlCols: {
      1: "xl:grid-cols-1",
      2: "xl:grid-cols-2",
      3: "xl:grid-cols-3",
      4: "xl:grid-cols-4",
      5: "xl:grid-cols-5",
      6: "xl:grid-cols-6",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
    },
    gapX: {
      0: "gap-x-0",
      1: "gap-x-1",
      2: "gap-x-2",
      3: "gap-x-3",
      4: "gap-x-4",
      5: "gap-x-5",
      6: "gap-x-6",
      8: "gap-x-8",
    },
    gapY: {
      0: "gap-y-0",
      1: "gap-y-1",
      2: "gap-y-2",
      3: "gap-y-3",
      4: "gap-y-4",
      5: "gap-y-5",
      6: "gap-y-6",
      8: "gap-y-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-items-start",
      center: "justify-items-center",
      end: "justify-items-end",
      stretch: "justify-items-stretch",
    },
  },
  defaultVariants: {
    cols: 1,
    gap: 4,
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols,
      smCols,
      mdCols,
      lgCols,
      xlCols,
      gap,
      gapX,
      gapY,
      align,
      justify,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          gridVariants({
            cols,
            smCols,
            mdCols,
            lgCols,
            xlCols,
            gap,
            gapX,
            gapY,
            align,
            justify,
          }),
          className
        )}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";

// Responsive grid preset for common patterns
export interface ResponsiveGridProps extends Omit<GridProps, "cols" | "smCols" | "mdCols" | "lgCols" | "xlCols"> {
  /**
   * Preset responsive column configuration
   */
  preset?: "cards" | "features" | "gallery" | "list";
}

const presetConfigs: Record<string, Partial<VariantProps<typeof gridVariants>>> = {
  cards: { cols: 2, smCols: 3, mdCols: 4, lgCols: 5, xlCols: 6 },
  features: { cols: 1, mdCols: 3 },
  gallery: { cols: 2, mdCols: 3, lgCols: 4 },
  list: { cols: 1, lgCols: 2 },
};

function ResponsiveGrid({ preset = "cards", ...props }: ResponsiveGridProps) {
  const config = presetConfigs[preset];
  return <Grid {...config} {...props} />;
}

export { Grid, ResponsiveGrid, gridVariants };
