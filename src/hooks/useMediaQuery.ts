"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query subscription.
 *
 * `useSyncExternalStore` is used rather than `useState` + `useEffect` so the
 * server snapshot is explicit (`false`) and React reconciles without a
 * hydration mismatch warning.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // Never assume a match before we can measure.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
