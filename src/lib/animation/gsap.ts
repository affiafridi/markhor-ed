import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Central GSAP configuration.
 *
 * GSAP owns the cinematic layer: pinned sections, scroll scrub, camera and
 * product transitions, colour/scene changes, large typography movement.
 * Motion for React owns interface-scale animation (menus, buttons, hovers).
 * Keeping that split avoids two libraries fighting over the same element.
 *
 * Import this module from client components only.
 */

let isRegistered = false;

/**
 * Registers plugins exactly once, client-side.
 *
 * `lagSmoothing(0)` is required for Lenis: without it, GSAP tries to
 * compensate for frame drops and desynchronises from the smooth-scroll
 * position, which shows up as jittery ScrollTrigger scrubbing.
 */
export function registerGsap(): void {
  if (isRegistered || typeof window === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  isRegistered = true;
}

/** Easing names that mirror the CSS easing tokens in styles/tokens.css. */
export const EASE = {
  /**
   * --ease-out-quart. The house glide for product transitions: it keeps
   * speed through the middle of a move instead of front-loading it.
   */
  outQuart: "power3.out",
  /** --ease-out-expo */
  outExpo: "expo.out",
  /** --ease-in-out-quart */
  inOutQuart: "power4.inOut",
  /** --ease-out-soft */
  outSoft: "power2.out",
} as const;

/** Durations that mirror --duration-* in styles/tokens.css, in seconds. */
export const DURATION = {
  fast: 0.25,
  base: 0.6,
  slow: 1.2,
} as const;

/**
 * Conditions for `gsap.matchMedia()`.
 *
 * Use these rather than hand-written breakpoint checks so that every
 * animation scales down consistently, and so reduced motion is handled in
 * the same place as responsive behaviour:
 *
 *   const mm = gsap.matchMedia();
 *   mm.add(MOTION.motionOk, () => { ...full timeline... });
 *   mm.add(MOTION.reduced, () => { ...set end state, no tween... });
 *   return () => mm.revert();
 */
export const MOTION = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  mobile: "(max-width: 767px)",
} as const;

export { gsap, ScrollTrigger };
