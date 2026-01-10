import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const iconWrapperVariants = cva("inline-flex shrink-0", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
      "2xl": "h-10 w-10",
      "3xl": "h-12 w-12",
    },
    colorScheme: {
      default: "text-current",
      primary: "text-primary",
      secondary: "text-muted-foreground",
      muted: "text-muted-foreground",
      destructive: "text-destructive",
      success: "text-green-500",
      warning: "text-yellow-500",
      accent: "text-accent-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    colorScheme: "default",
  },
});

export interface IconWrapperProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof iconWrapperVariants> {
  /**
   * The Lucide icon component to render
   */
  icon: LucideIcon;
  /**
   * Screen reader label for accessibility
   */
  label?: string;
  /**
   * Whether the icon is decorative only (no label needed)
   * @default false
   */
  decorative?: boolean;
}

const IconWrapper = React.forwardRef<HTMLSpanElement, IconWrapperProps>(
  (
    {
      className,
      icon: Icon,
      size,
      colorScheme,
      label,
      decorative = false,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(iconWrapperVariants({ size, colorScheme }), className)}
        role={decorative ? "presentation" : "img"}
        aria-label={!decorative ? label : undefined}
        aria-hidden={decorative ? "true" : undefined}
        {...props}
      >
        <Icon className="h-full w-full" />
      </span>
    );
  }
);
IconWrapper.displayName = "IconWrapper";

/**
 * A simpler version that just applies size/color to any icon
 */
export interface IconProps extends VariantProps<typeof iconWrapperVariants> {
  icon: LucideIcon;
  className?: string;
}

function Icon({ icon: IconComponent, size, colorScheme, className }: IconProps) {
  return (
    <IconComponent
      className={cn(iconWrapperVariants({ size, colorScheme }), className)}
      aria-hidden="true"
    />
  );
}

export { IconWrapper, Icon, iconWrapperVariants };
