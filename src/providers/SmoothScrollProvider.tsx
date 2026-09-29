"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getLenis,
  getLenisServerSnapshot,
  gsap,
  registerGsap,
  ScrollTrigger,
  scrollTo as scrollToTarget,
  setLenis,
  subscribeLenis,
  type ScrollToOptions,
} from "@/lib/animation";
import { useReducedMotion } from "@/hooks";

interface SmoothScrollValue {
  lenis: Lenis | null;
  /** True when Lenis is driving the scroll (i.e. motion is allowed). */
  isSmooth: boolean;
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollValue>({
  lenis: null,
  isSmooth: false,
  scrollTo: scrollToTarget,
});

export function useSmoothScroll(): SmoothScrollValue {
  return useContext(SmoothScrollContext);
}

/**
 * Owns the single Lenis instance and wires it to GSAP.
 *
 * There is exactly one requestAnimationFrame loop for scroll in this app:
 * `gsap.ticker`. Lenis is created with `autoRaf: false` and stepped from that
 * ticker, and ScrollTrigger is updated from Lenis's scroll event. Adding a
 * second `requestAnimationFrame` loop anywhere for scroll would desynchronise
 * scrubbed timelines.
 *
 * (The WebGL layer runs its own render loop inside react-three-fiber. That is
 * separate by design and does not drive scroll.)
 *
 * Under `prefers-reduced-motion` Lenis is never instantiated: the page uses
 * native scrolling, anchors jump instantly, and all content stays intact.
 *
 * The instance is read through `useSyncExternalStore` rather than held in
 * React state — it is an external imperative object, and subscribing to it
 * avoids a cascading render on mount.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const lenis = useSyncExternalStore(subscribeLenis, getLenis, getLenisServerSnapshot);

  useEffect(() => {
    registerGsap();

    // Under reduced motion Lenis is never created. Any previous instance has
    // already been torn down by this effect's own cleanup.
    if (prefersReducedMotion) return;

    const instance = new Lenis({
      autoRaf: false,
      duration: 1.1,
      // Native anchor handling, so href="#section" keeps working.
      anchors: true,
      // Touch devices keep their native scroll feel.
      syncTouch: false,
    });

    setLenis(instance);

    const handleScroll = () => ScrollTrigger.update();
    instance.on("scroll", handleScroll);

    // gsap.ticker reports seconds; Lenis expects milliseconds.
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      instance.off("scroll", handleScroll);
      instance.destroy();
      setLenis(null);
    };
  }, [prefersReducedMotion]);

  const value = useMemo<SmoothScrollValue>(
    () => ({ lenis, isSmooth: lenis !== null, scrollTo: scrollToTarget }),
    [lenis],
  );

  return (
    <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>
  );
}
