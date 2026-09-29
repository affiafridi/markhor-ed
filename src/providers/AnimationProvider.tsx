"use client";

import { useEffect, type ReactNode } from "react";
import { registerGsap, ScrollTrigger } from "@/lib/animation";
import { useDeviceTier, useReducedMotion, useViewportTier } from "@/hooks";
import { useExperienceStore } from "@/store";

/**
 * Bootstraps the animation layer.
 *
 *  - registers GSAP plugins once, client-side
 *  - mirrors the OS reduced-motion preference into the store, so the WebGL
 *    layer can read it without each scene subscribing to matchMedia
 *  - resolves the device tier once and publishes it
 *  - reflects the active scene theme onto <html data-scene="…">, which is what
 *    switches the --scene-* colour tokens
 *
 * It renders no markup of its own.
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const setPrefersReducedMotion = useExperienceStore(
    (state) => state.setPrefersReducedMotion,
  );
  const sceneTheme = useExperienceStore((state) => state.sceneTheme);

  useDeviceTier();
  useViewportTier();

  useEffect(() => {
    registerGsap();
  }, []);

  /*
   * Safety net. The header and hero reveal themselves once the WebGL stage
   * reports ready; if WebGL is unavailable, blocked, or the textures fail,
   * that signal would never arrive and the page would stay blank. After a
   * short grace period we reveal regardless — the content does not depend on
   * the canvas, and must never be held hostage by it.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const state = useExperienceStore.getState();
      if (!state.isLoaded) state.setLoaded(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setPrefersReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setPrefersReducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.scene = sceneTheme;
  }, [sceneTheme]);

  // Fonts change metrics, which moves every scroll-driven start/end point.
  useEffect(() => {
    let cancelled = false;

    void document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
