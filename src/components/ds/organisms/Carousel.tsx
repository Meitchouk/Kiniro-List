"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Flex } from "../atoms/Box";

export interface CarouselProps<T> {
  /**
   * Items to display in the carousel
   */
  items: T[];
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Extract unique key from item
   */
  getKey: (item: T) => string | number;
  /**
   * Auto-advance interval in ms (0 to disable)
   * @default 5000
   */
  autoIntervalMs?: number;
  /**
   * Number of items to scroll per navigation action
   * @default 1
   */
  scrollBy?: number;
  /**
   * Additional className for the carousel container
   */
  className?: string;
  /**
   * Gap between cards (matches DS Grid gap values)
   * @default 4
   */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
  /**
   * Threshold for intersection observer (0-1)
   * @default 0.3
   */
  visibilityThreshold?: number;
}

// Gap values in pixels for calculations
const GAP_PX: Record<number, number> = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
};

/**
 * Design System Carousel: An infinite carousel component for displaying items.
 * Uses DS primitives (Card, Flex, Button) for consistent styling.
 * Items loop seamlessly in both directions.
 */
export function Carousel<T>({
  items,
  renderItem,
  // getKey,
  autoIntervalMs = 5000,
  scrollBy = 1,
  className,
  gap = 4,
  visibilityThreshold = 0.3,
}: CarouselProps<T>) {
  const t = useTranslations("common");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const startXRef = useRef<number>(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  // Current position in the extended (cloned) array
  const [position, setPosition] = useState(0);

  const itemCount = items.length;
  const gapPx = GAP_PX[gap] ?? 16;

  // Number of clones on each side (enough to fill viewport + buffer)
  const cloneCount = Math.max(itemCount, 6);

  // Build extended items array with clones on both sides
  const extendedItems = useMemo(() => {
    if (!itemCount) return [];
    const result: { item: T; originalIndex: number; cloneId: string }[] = [];

    // Leading clones (from end of original array)
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = (((itemCount - (cloneCount - i)) % itemCount) + itemCount) % itemCount;
      result.push({
        item: items[originalIndex],
        originalIndex,
        cloneId: `clone-start-${i}`,
      });
    }

    // Original items
    for (let i = 0; i < itemCount; i++) {
      result.push({
        item: items[i],
        originalIndex: i,
        cloneId: `original-${i}`,
      });
    }

    // Trailing clones (from start of original array)
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = i % itemCount;
      result.push({
        item: items[originalIndex],
        originalIndex,
        cloneId: `clone-end-${i}`,
      });
    }

    return result;
  }, [items, itemCount, cloneCount]);

  // Calculate item width from first rendered item
  const getItemWidth = useCallback(() => {
    const firstItem = itemRefs.current.get(0);
    return firstItem?.offsetWidth ?? 300;
  }, []);

  // Calculate offset in pixels for a given position
  const getOffsetForPosition = useCallback(
    (pos: number) => {
      const itemWidth = getItemWidth();
      // Position 0 = first original item (after leading clones)
      const actualIndex = cloneCount + pos;
      return -(actualIndex * (itemWidth + gapPx));
    },
    [cloneCount, gapPx, getItemWidth]
  );

  // Initialize position to show first original item
  useEffect(() => {
    if (itemCount > 0) {
      setPosition(0);
    }
  }, [itemCount]);

  // Handle infinite loop jump (without animation)
  const checkAndJump = useCallback(() => {
    if (isTransitioning || !itemCount) return;

    // If we've scrolled too far left (into leading clones)
    if (position < -cloneCount + scrollBy) {
      setIsTransitioning(true);
      // Jump to equivalent position in trailing section
      setPosition(position + itemCount);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      });
    }
    // If we've scrolled too far right (into trailing clones)
    else if (position >= itemCount) {
      setIsTransitioning(true);
      // Jump to equivalent position in original section
      setPosition(position - itemCount);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      });
    }
  }, [position, itemCount, cloneCount, scrollBy, isTransitioning]);

  // Check for jump after each position change
  useEffect(() => {
    const timer = setTimeout(checkAndJump, 550); // After transition completes
    return () => clearTimeout(timer);
  }, [position, checkAndJump]);

  // Intersection Observer for lazy loading - only auto-advance when visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: visibilityThreshold,
        // Add root margin to start/stop slightly before entering/leaving viewport
        rootMargin: "50px",
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [visibilityThreshold]);

  // Auto-advance - only when visible
  useEffect(() => {
    if (itemCount <= 1 || autoIntervalMs <= 0 || isDragging || !isVisible) return;
    const timer = setInterval(() => {
      setPosition((prev) => prev + scrollBy);
    }, autoIntervalMs);
    return () => clearInterval(timer);
  }, [itemCount, autoIntervalMs, scrollBy, isDragging, isVisible]);

  // Measure track height
  useEffect(() => {
    if (!trackRef.current) return;
    const updateHeight = () => {
      const items = Array.from(itemRefs.current.values());
      const heights = items.map((el) => el?.offsetHeight ?? 0);
      const max = heights.length ? Math.max(...heights) : undefined;
      setTrackHeight(max);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [extendedItems]);

  // Pointer/touch handlers for swipe
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTransitioning) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    setDragOffsetPx(deltaX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    const itemWidth = getItemWidth();
    const threshold = itemWidth * 0.3;

    if (deltaX < -threshold) {
      setPosition((prev) => prev + scrollBy);
    } else if (deltaX > threshold) {
      setPosition((prev) => prev - scrollBy);
    }

    setIsDragging(false);
    setDragOffsetPx(0);
  };

  const goNext = () => {
    if (isTransitioning) return;
    setPosition((prev) => prev + scrollBy);
  };

  const goPrev = () => {
    if (isTransitioning) return;
    setPosition((prev) => prev - scrollBy);
  };

  if (!items.length) return null;

  // Map gap prop to Tailwind classes
  const gapClasses: Record<number, string> = {
    0: "gap-0",
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    8: "gap-8",
  };
  const gapClass = gapClasses[gap] || "gap-4";

  const offset = getOffsetForPosition(position);
  const transformValue = `translateX(${offset + dragOffsetPx}px)`;

  return (
    <Card
      ref={containerRef}
      className={cn(
        "bg-card/50 relative touch-pan-y overflow-hidden rounded-lg border-0",
        className
      )}
      style={trackHeight ? { minHeight: trackHeight + 32 } : undefined}
    >
      {/* Infinite track */}
      <div
        ref={trackRef}
        className={cn(
          "flex p-4",
          gapClass,
          isDragging || isTransitioning
            ? "cursor-grabbing transition-none"
            : "cursor-grab transition-transform duration-500 ease-in-out"
        )}
        style={{ transform: transformValue }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {extendedItems.map((entry, idx) => (
          <div
            key={entry.cloneId}
            className="shrink-0"
            ref={(el) => {
              if (el) {
                itemRefs.current.set(idx, el);
              } else {
                itemRefs.current.delete(idx);
              }
            }}
          >
            {renderItem(entry.item, entry.originalIndex)}
          </div>
        ))}
      </div>

      {/* Navigation */}
      {itemCount > 1 && (
        <Flex
          align="center"
          justify="between"
          className="pointer-events-none absolute inset-0 px-2"
          border={"none"}
        >
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background pointer-events-auto h-10 w-10 rounded-full backdrop-blur-sm"
            onClick={goPrev}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background pointer-events-auto h-10 w-10 rounded-full backdrop-blur-sm"
            onClick={goNext}
            aria-label={t("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Flex>
      )}
    </Card>
  );
}

export type { CarouselProps as CarouselComponentProps };
