import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
      "2xl": "h-10 w-10",
    },
    colorScheme: {
      default: "text-current",
      primary: "text-primary",
      secondary: "text-muted-foreground",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    colorScheme: "default",
  },
});

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<SVGSVGElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Screen reader label
   * @default "Loading"
   */
  label?: string;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, colorScheme, label = "Loading", ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(spinnerVariants({ size, colorScheme }), className)}
        aria-label={label}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

// Loading overlay component
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the overlay is visible
   * @default true
   */
  visible?: boolean;
  /**
   * Loading text to display
   */
  text?: string;
  /**
   * Spinner size
   * @default "lg"
   */
  spinnerSize?: SpinnerProps["size"];
  /**
   * Overlay style
   * @default "blur"
   */
  overlay?: "blur" | "solid" | "transparent";
}

const overlayStyles = {
  blur: "bg-background/80 backdrop-blur-sm",
  solid: "bg-background",
  transparent: "bg-transparent",
};

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      visible = true,
      text,
      spinnerSize = "lg",
      overlay = "blur",
      ...props
    },
    ref
  ) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center",
          overlayStyles[overlay],
          className
        )}
        {...props}
      >
        <Spinner size={spinnerSize} />
        {text && (
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    );
  }
);
LoadingOverlay.displayName = "LoadingOverlay";

export { Spinner, LoadingOverlay, spinnerVariants };
