"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the prefers-reduced-motion media query for accessibility (WCAG 2.1)
 *
 * @returns {boolean} true if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
    // Fallback for older browsers
    else {
      // @ts-expect-error - addListener is deprecated but needed for older browsers
      mediaQuery.addListener(listener);
      // @ts-expect-error - removeListener is deprecated but needed for older browsers
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return prefersReducedMotion;
}
