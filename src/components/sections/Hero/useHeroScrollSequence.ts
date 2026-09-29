"use client";

import { type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { getLenis, gsap, registerGsap, ScrollTrigger } from "@/lib/animation";
import { heroStage, registerScrollSync } from "@/lib/hero";
import type { GoToOptions } from "./useHeroCarousel";

/** Viewport heights of scroll consumed per product step. */
const STEP_VH = 0.8;

interface HeroScrollSequenceOptions {
  containerRef: RefObject<HTMLElement | null>;
  total: number;
  /** Off under reduced motion, where the hero is never pinned. */
  enabled: boolean;
  goTo: (index: number, options?: GoToOptions) => void;
  onEngage: () => void;
}

/**
 * Scroll-driven product switching.
 *
 * The hero is pinned for a finite distance — two steps, ~0.8vh each — so the
 * composition stays still while scroll progress selects a product. Once the
 * last product is reached the pin releases and the page scrolls on normally;
 * it is a short sequence, not a scroll trap.
 *
 * Scroll only *selects*: it calls the same `goTo` as the buttons, and the
 * resulting transition is the same tween. Nothing here animates anything
 * directly, which is why button, keyboard, drag and scroll all look identical.
 *
 * Deliberately no ScrollTrigger `snap`: the visual state is driven by our own
 * tween rather than scrubbed from scroll position, so snapping would add a
 * fight with Lenis for no visual gain.
 */
export function useHeroScrollSequence({
  containerRef,
  total,
  enabled,
  goTo,
  onEngage,
}: HeroScrollSequenceOptions): void {
  useIsomorphicLayoutEffect(() => {
    const element = containerRef.current;
    const steps = total - 1;
    if (!element || !enabled || steps < 1) return;

    registerGsap();

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: element,
        start: "top top",
        end: () => `+=${window.innerHeight * STEP_VH * steps}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          /*
           * While a product is open this trigger does nothing at all.
           *
           * It must not drive the product either: the can holds the exact
           * transform the focus timeline left it at, and scrolling the page
           * is not allowed to move it. Leaving the detail scene is a
           * deliberate gesture, handled by useDetailReturn.
           */
          if (heroStage.focusIndex >= 0) return;

          goTo(Math.round(self.progress * steps), { fromScroll: true });
          if (self.progress > 0.02) onEngage();
        },
      });

      /*
       * Nothing moves on screen while the hero is pinned, so realigning the
       * scroll position after a button press is invisible — it just means the
       * next wheel gesture continues from the right product.
       */
      registerScrollSync((index) => {
        const target = trigger.start + ((trigger.end - trigger.start) * index) / steps;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(target, { immediate: true });
        else window.scrollTo(0, target);
      });
    }, element);

    return () => {
      registerScrollSync(null);
      context.revert();
    };
  }, [containerRef, total, enabled, goTo, onEngage]);
}
