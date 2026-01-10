"use client";

import { useState, useEffect } from "react";
import { useLoading } from "@/components/providers/LoadingProvider";

function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function LoadingBar() {
  const { isLoading, isInitialLoading } = useLoading();
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    const debouncedCheckMobile = debounce(checkMobile, 150);
    window.addEventListener("resize", debouncedCheckMobile);

    return () => window.removeEventListener("resize", debouncedCheckMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsSticky(false);
      return;
    }

    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    const debouncedHandleScroll = debounce(handleScroll, 100);
    window.addEventListener("scroll", debouncedHandleScroll);
    return () => window.removeEventListener("scroll", debouncedHandleScroll);
  }, [isMobile]);

  const showLoading = isLoading || isInitialLoading;

  return (
    <>
      {/* Loading Bar */}
      <div
        className={`w-full ${
          isMobile && isSticky
            ? "fixed top-0 left-0 right-0 z-100 bg-background"
            : ""
        }`}
      >
        <div className="h-1 bg-muted overflow-hidden">
          {showLoading ? (
            <div
              className="h-full w-full bg-linear-to-r from-primary via-yellow-400 to-primary"
              style={{
                animation: "loading-bar 1.5s ease-in-out infinite",
              }}
            />
          ) : (
            <div className="h-full w-0" />
          )}
        </div>
      </div>

      {/* Blocking Overlay */}
      {showLoading && (
        <div
          className="fixed inset-0 z-99 bg-background/30 cursor-wait"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-hidden="true"
        />
      )}
    </>
  );
}
