"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { AnimationProvider } from "./AnimationProvider";
import { SmoothScrollProvider } from "./SmoothScrollProvider";

export { AnimationProvider } from "./AnimationProvider";
export { SmoothScrollProvider, useSmoothScroll } from "./SmoothScrollProvider";

/**
 * Single composition point for every client provider, so the root layout can
 * stay a server component with one client boundary.
 *
 * Order matters: AnimationProvider registers GSAP plugins that
 * SmoothScrollProvider relies on when it wires Lenis to the ticker.
 *
 * `MotionConfig reducedMotion="user"` makes every Motion animation in the
 * interface honour the OS preference automatically, which matches what GSAP
 * does via `MOTION` in lib/animation/gsap.ts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AnimationProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </AnimationProvider>
    </MotionConfig>
  );
}
