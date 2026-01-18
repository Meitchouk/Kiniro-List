import * as React from "react";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "./Tooltip";
import { Info } from "lucide-react";

export interface InfoLabelProps {
  /** The main text label */
  children: React.ReactNode;
  /** The tooltip content shown on hover */
  info: React.ReactNode;
  /** Position of the info icon */
  iconPosition?: "left" | "right";
  /** Side where tooltip appears */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Additional className for the container */
  className?: string;
  /** Additional className for the label text */
  labelClassName?: string;
  /** HTML id for accessibility */
  htmlFor?: string;
  /** Make the label clickable/interactive */
  asLabel?: boolean;
}

/**
 * A label with an info icon that shows a tooltip on hover.
 * The info icon appears as a small superscript indicator.
 *
 * @example
 * ```tsx
 * <InfoLabel info="Full description here">Short label</InfoLabel>
 * ```
 */
export const InfoLabel = React.forwardRef<HTMLSpanElement, InfoLabelProps>(
  (
    {
      children,
      info,
      iconPosition = "left",
      tooltipSide = "top",
      className,
      labelClassName,
      htmlFor,
      asLabel = false,
    },
    ref
  ) => {
    const infoIcon = (
      <SimpleTooltip content={info} side={tooltipSide} delayDuration={100}>
        <span
          className="text-muted-foreground hover:text-foreground inline-flex cursor-help items-center transition-colors"
          aria-label="More information"
        >
          <Info className="h-3 w-3" />
        </span>
      </SimpleTooltip>
    );

    const content = (
      <>
        {iconPosition === "left" && (
          <span className="relative -top-0.5 mr-1 inline-flex">{infoIcon}</span>
        )}
        <span className={labelClassName}>{children}</span>
        {iconPosition === "right" && (
          <span className="relative -top-0.5 ml-1 inline-flex">{infoIcon}</span>
        )}
      </>
    );

    if (asLabel && htmlFor) {
      return (
        <label
          htmlFor={htmlFor}
          className={cn("inline-flex cursor-pointer items-baseline", className)}
        >
          {content}
        </label>
      );
    }

    return (
      <span ref={ref} className={cn("inline-flex items-baseline", className)}>
        {content}
      </span>
    );
  }
);

InfoLabel.displayName = "InfoLabel";
