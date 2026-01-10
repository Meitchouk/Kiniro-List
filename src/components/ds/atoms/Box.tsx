import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const boxVariants = cva("", {
  variants: {
    display: {
      block: "block",
      flex: "flex",
      "inline-flex": "inline-flex",
      grid: "grid",
      "inline-block": "inline-block",
      hidden: "hidden",
    },
    direction: {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
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
      10: "gap-10",
      12: "gap-12",
    },
    p: {
      0: "p-0",
      1: "p-1",
      2: "p-2",
      3: "p-3",
      4: "p-4",
      5: "p-5",
      6: "p-6",
      8: "p-8",
      10: "p-10",
      12: "p-12",
    },
    px: {
      0: "px-0",
      1: "px-1",
      2: "px-2",
      3: "px-3",
      4: "px-4",
      5: "px-5",
      6: "px-6",
      8: "px-8",
      10: "px-10",
      12: "px-12",
    },
    py: {
      0: "py-0",
      1: "py-1",
      2: "py-2",
      3: "py-3",
      4: "py-4",
      5: "py-5",
      6: "py-6",
      8: "py-8",
      10: "py-10",
      12: "py-12",
    },
    m: {
      0: "m-0",
      1: "m-1",
      2: "m-2",
      3: "m-3",
      4: "m-4",
      5: "m-5",
      6: "m-6",
      8: "m-8",
      auto: "m-auto",
    },
    mx: {
      0: "mx-0",
      1: "mx-1",
      2: "mx-2",
      3: "mx-3",
      4: "mx-4",
      5: "mx-5",
      6: "mx-6",
      8: "mx-8",
      auto: "mx-auto",
    },
    my: {
      0: "my-0",
      1: "my-1",
      2: "my-2",
      3: "my-3",
      4: "my-4",
      5: "my-5",
      6: "my-6",
      8: "my-8",
      auto: "my-auto",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
    shadow: {
      none: "shadow-none",
      sm: "shadow-sm",
      base: "shadow",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl",
    },
    bg: {
      transparent: "bg-transparent",
      background: "bg-background",
      card: "bg-card",
      muted: "bg-muted",
      primary: "bg-primary",
      secondary: "bg-secondary",
      accent: "bg-accent",
      destructive: "bg-destructive",
    },
    border: {
      none: "border-0",
      default: "border",
      2: "border-2",
    },
    maxWidth: {
      none: "max-w-none",
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      "5xl": "max-w-5xl",
      "6xl": "max-w-6xl",
      "7xl": "max-w-7xl",
      full: "max-w-full",
      screen: "max-w-screen-xl",
    },
    width: {
      auto: "w-auto",
      full: "w-full",
      screen: "w-screen",
      fit: "w-fit",
      min: "w-min",
      max: "w-max",
    },
    height: {
      auto: "h-auto",
      full: "h-full",
      screen: "h-screen",
      fit: "h-fit",
      min: "h-min",
      max: "h-max",
    },
    overflow: {
      auto: "overflow-auto",
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      scroll: "overflow-scroll",
    },
    position: {
      static: "static",
      relative: "relative",
      absolute: "absolute",
      fixed: "fixed",
      sticky: "sticky",
    },
  },
});

type BoxElement = "div" | "section" | "article" | "aside" | "header" | "footer" | "main" | "nav" | "span";

export interface BoxProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof boxVariants> {
  /**
   * The HTML element to render
   * @default "div"
   */
  as?: BoxElement;
}

const Box = React.forwardRef<HTMLElement, BoxProps>(
  (
    {
      className,
      as: Component = "div",
      display,
      direction,
      align,
      justify,
      wrap,
      gap,
      p,
      px,
      py,
      m,
      mx,
      my,
      rounded,
      shadow,
      bg,
      border,
      maxWidth,
      width,
      height,
      overflow,
      position,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          boxVariants({
            display,
            direction,
            align,
            justify,
            wrap,
            gap,
            p,
            px,
            py,
            m,
            mx,
            my,
            rounded,
            shadow,
            bg,
            border,
            maxWidth,
            width,
            height,
            overflow,
            position,
          }),
          className
        )}
        {...props}
      />
    );
  }
);
Box.displayName = "Box";

// Convenience components
const Flex = React.forwardRef<HTMLElement, BoxProps>((props, ref) => (
  <Box ref={ref} display="flex" {...props} />
));
Flex.displayName = "Flex";

const Stack = React.forwardRef<HTMLElement, BoxProps & { spacing?: BoxProps["gap"] }>(
  ({ spacing, gap, ...props }, ref) => (
    <Box ref={ref} display="flex" direction="column" gap={spacing || gap} {...props} />
  )
);
Stack.displayName = "Stack";

const Center = React.forwardRef<HTMLElement, BoxProps>((props, ref) => (
  <Box ref={ref} display="flex" align="center" justify="center" {...props} />
));
Center.displayName = "Center";

const Container = React.forwardRef<HTMLElement, BoxProps>(
  ({ maxWidth = "7xl", mx = "auto", px = 4, ...props }, ref) => (
    <Box ref={ref} maxWidth={maxWidth} mx={mx} px={px} {...props} />
  )
);
Container.displayName = "Container";

export { Box, Flex, Stack, Center, Container, boxVariants };
