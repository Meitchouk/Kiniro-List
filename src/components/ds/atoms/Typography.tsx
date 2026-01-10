import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl",
      h2: "text-3xl font-bold tracking-tight",
      h3: "text-2xl font-bold",
      h4: "text-xl font-semibold",
      h5: "text-lg font-semibold",
      h6: "text-base font-semibold",
      subtitle1: "text-lg text-muted-foreground",
      subtitle2: "text-base text-muted-foreground",
      body1: "text-base",
      body2: "text-sm",
      caption: "text-xs text-muted-foreground",
      overline: "text-xs font-medium uppercase tracking-wider",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    colorScheme: {
      default: "",
      primary: "text-primary",
      secondary: "text-muted-foreground",
      destructive: "text-destructive",
      muted: "text-muted-foreground",
      accent: "text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "body1",
    colorScheme: "default",
  },
});

type TypographyElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "label";

const variantElementMap: Record<NonNullable<VariantProps<typeof typographyVariants>["variant"]>, TypographyElement> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "p",
  subtitle2: "p",
  body1: "p",
  body2: "p",
  caption: "span",
  overline: "span",
};

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  /**
   * The HTML element to render
   * @default Inferred from variant
   */
  as?: TypographyElement;
  /**
   * Render as child component (Slot)
   * @default false
   */
  asChild?: boolean;
  /**
   * Truncate text with ellipsis
   * @default false
   */
  truncate?: boolean;
  /**
   * Number of lines to clamp
   */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
}

const lineClampClasses: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      className,
      variant,
      weight,
      align,
      colorScheme,
      as,
      asChild = false,
      truncate = false,
      lineClamp,
      ...props
    },
    ref
  ) => {
    const Comp = asChild
      ? Slot
      : as || variantElementMap[variant || "body1"];

    return (
      <Comp
        ref={ref as never}
        className={cn(
          typographyVariants({ variant, weight, align, colorScheme }),
          truncate && "truncate",
          lineClamp && lineClampClasses[lineClamp],
          className
        )}
        {...props}
      />
    );
  }
);
Typography.displayName = "Typography";

export { Typography, typographyVariants };
