"use client";

import { memo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { OptimizedImage } from "./OptimizedImage";
import { cn } from "@/lib/utils";

const KOFI_USERNAME = "kinirolist";
const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`;

const kofiWidgetVariants = cva("", {
  variants: {
    variant: {
      /**
       * Floating button fixed at the bottom of the screen
       * Opens Ko-fi in a new tab
       */
      floating:
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2",
      /**
       * Embedded iframe panel for displaying Ko-fi page
       * Useful for settings pages or dedicated support sections
       */
      panel: "w-full rounded-lg overflow-hidden",
      /**
       * Styled button/link that opens Ko-fi in a new tab
       * Better for dark mode compatibility
       */
      button:
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
      /**
       * Official Ko-fi badge - uses brand asset images
       * Most authentic representation of Ko-fi brand
       */
      badge: "inline-block transition-all duration-200 hover:scale-105",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
    colorScheme: {
      kofi: "bg-[#00b9fe] text-white hover:bg-[#00a8e8] focus:ring-[#00b9fe]",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
      gold: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 focus:ring-amber-500",
      outline:
        "border-2 border-[#00b9fe] text-[#00b9fe] hover:bg-[#00b9fe] hover:text-white focus:ring-[#00b9fe] dark:border-[#00b9fe] dark:text-[#00b9fe]",
    },
  },
  compoundVariants: [
    // Panel sizes
    {
      variant: "panel",
      size: "sm",
      class: "h-[400px]",
    },
    {
      variant: "panel",
      size: "md",
      class: "h-[520px]",
    },
    {
      variant: "panel",
      size: "lg",
      class: "h-[712px]",
    },
    // Button sizes
    {
      variant: "button",
      size: "sm",
      class: "text-sm px-3 py-2",
    },
    {
      variant: "button",
      size: "md",
      class: "text-base px-4 py-2.5",
    },
    {
      variant: "button",
      size: "lg",
      class: "text-lg px-6 py-3",
    },
    // Floating sizes
    {
      variant: "floating",
      size: "sm",
      class: "text-sm px-3 py-2",
    },
    {
      variant: "floating",
      size: "md",
      class: "text-base px-4 py-3",
    },
    {
      variant: "floating",
      size: "lg",
      class: "text-lg px-5 py-3.5",
    },
  ],
  defaultVariants: {
    variant: "floating",
    size: "md",
    colorScheme: "kofi",
  },
});

export interface KofiWidgetProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof kofiWidgetVariants> {
  /**
   * Custom button text for floating and button variants
   * If not provided, uses translation key 'common.supportKofi'
   */
  buttonText?: string;
  /**
   * Whether to hide the feed in the panel variant
   * @default true
   */
  hideFeed?: boolean;
  /**
   * Badge style for the badge variant
   * @default "blue"
   */
  badgeStyle?: "blue" | "red" | "dark" | "beige";
}

/**
 * Ko-fi Widget Component
 *
 * A unified component for integrating Ko-fi support functionality.
 * Supports three variants:
 * - `floating`: A custom floating button fixed at the bottom-left that opens Ko-fi
 * - `panel`: An embedded iframe showing the Ko-fi page
 * - `button`: A styled button/link that opens Ko-fi in a new tab
 *
 * @example
 * // Floating button (typically in layout)
 * <KofiWidget variant="floating" buttonText="Support me" colorScheme="gold" />
 *
 * // Compact floating button (icon only)
 * <KofiWidget variant="floating" iconOnly />
 *
 * // Styled button link (in footer or anywhere)
 * <KofiWidget variant="button" buttonText="Buy me a coffee" colorScheme="kofi" />
 *
 * // Embedded panel (if needed for dedicated page)
 * <KofiWidget variant="panel" size="md" />
 */
export const KofiWidget = memo(function KofiWidget({
  className,
  variant = "floating",
  size = "md",
  colorScheme = "kofi",
  buttonText,
  hideFeed = true,
  badgeStyle = "blue",
  ...props
}: KofiWidgetProps) {
  const t = useTranslations();
  const defaultButtonText = t("common.supportKofi");
  const displayText = buttonText || defaultButtonText;

  // Badge variant - official Ko-fi badge images
  if (variant === "badge") {
    const badgeImages = {
      blue: "/kofi_brandasset/support_me_on_kofi_blue.png",
      red: "/kofi_brandasset/support_me_on_kofi_red.png",
      dark: "/kofi_brandasset/support_me_on_kofi_dark.png",
      beige: "/kofi_brandasset/support_me_on_kofi_beige.png",
    };

    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("common.supportKofi")}
        className={cn(kofiWidgetVariants({ variant }), "overflow-hidden rounded-lg", className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        <OptimizedImage
          src={badgeImages[badgeStyle]}
          alt="Support me on Ko-fi"
          width={223}
          height={51}
          className="h-auto w-auto"
        />
      </a>
    );
  }

  // Floating variant - custom styled floating button with Ko-fi branding
  if (variant === "floating") {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={displayText}
        className={cn(kofiWidgetVariants({ variant, size, colorScheme }), className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {/* Ko-fi logo */}
        <OptimizedImage
          src="/kofi_brandasset/kofi_symbol.png"
          alt="Ko-fi"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span>
          {displayText}
          {colorScheme === "kofi" && " on Ko-fi"}
        </span>
      </a>
    );
  }

  // Button variant - styled inline link with Ko-fi branding
  if (variant === "button") {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(kofiWidgetVariants({ variant, size, colorScheme }), className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {/* Ko-fi logo */}
        <OptimizedImage
          src="/kofi_brandasset/kofi_symbol.png"
          alt="Ko-fi"
          width={20}
          height={20}
          className="h-5 w-5"
        />
        <span>
          {displayText}
          {colorScheme === "kofi" && " on Ko-fi"}
        </span>
      </a>
    );
  }

  // Panel variant - embedded iframe
  const iframeSrc = `https://ko-fi.com/${KOFI_USERNAME}/?hidefeed=${hideFeed}&widget=true&embed=true&preview=true`;

  return (
    <div className={cn(kofiWidgetVariants({ variant, size }), className)} {...props}>
      <iframe
        id="kofiframe"
        src={iframeSrc}
        className="h-full w-full border-none bg-[#f9f9f9] p-1 dark:bg-[#1a1a1a]"
        title={`Support ${KOFI_USERNAME} on Ko-fi`}
        loading="lazy"
      />
    </div>
  );
});

export { kofiWidgetVariants };
