"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isMotionForced } from "@/lib/motion-preference";
import { useMediaQuery } from "./useMediaQuery";

/** The override is resolved before hydration and never changes after it. */
const subscribe = () => () => {};

/**
 * True when the visitor has asked the OS to reduce motion.
 *
 * `?motion=full` overrides it for this browser — see lib/motion-preference.ts
 * for why that exists. Nothing else can turn motion *on* for someone who has
 * asked for less of it.
 *
 * Consumers must reduce motion only — never content, navigation or
 * functionality. See SmoothScrollProvider and lib/animation/gsap.ts.
 */
export function useReducedMotion(): boolean {
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const forced = useSyncExternalStore(
    subscribe,
    isMotionForced,
    // The server cannot know; the first client snapshot corrects it.
    useCallback(() => false, []),
  );

  return forced ? false : systemReduced;
}
