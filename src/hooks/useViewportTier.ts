"use client";

import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { useExperienceStore } from "@/store";
import type { ViewportTier } from "@/types";

/** Kept in step with the breakpoints used by the CSS. */
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Resolves the hero's viewport class and publishes it to the store.
 *
 * Driven by media queries rather than a pixel read, so it matches the CSS
 * breakpoints exactly and updates on resize without a listener of its own.
 */
export function useViewportTier(): ViewportTier {
  const isTablet = useMediaQuery(TABLET_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const viewportTier = useExperienceStore((state) => state.viewportTier);
  const setViewportTier = useExperienceStore((state) => state.setViewportTier);

  useEffect(() => {
    const next: ViewportTier = isDesktop ? "desktop" : isTablet ? "tablet" : "mobile";
    setViewportTier(next);
  }, [isDesktop, isTablet, setViewportTier]);

  return viewportTier;
}
