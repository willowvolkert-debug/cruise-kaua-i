import { useEffect, useRef, useState } from "react";

// Pull-to-refresh hook for iOS touch devices.
// Returns { pullDistance, isRefreshing, touchProps }.
// Spread touchProps onto the scrollable container element.
// Pass onRefresh as an async function that reloads the page data.
export function usePullToRefresh({ onRefresh, threshold = 70, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const el = document.documentElement;

    const handleTouchStart = (e) => {
      // Only start tracking if scrolled to top
      if (window.scrollY <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling.current || isRefreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        // Dampen the pull so it feels like elastic resistance
        const dampened = Math.min(delta * 0.5, threshold * 1.5);
        setPullDistance(dampened);
        // Prevent default scroll when pulling down at top
        if (delta > 10) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        try {
          await onRefresh();
        } catch (e) {
          // ignore
        }
        setIsRefreshing(false);
      }
      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, threshold, disabled, onRefresh]);

  return { pullDistance, isRefreshing };
}