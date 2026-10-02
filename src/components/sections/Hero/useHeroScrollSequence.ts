"use client";

import { type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { getLenis, gsap, registerGsap, ScrollTrigger } from "@/lib/animation";
import {
  heroStage,
  registerScrollSync,
  registerStoryRefresh,
  SCENE_COUNT,
} from "@/lib/hero";
import type { GoToOptions } from "./useHeroCarousel";

/** Viewport heights of scroll consumed per product step. */
const STEP_VH = 0.8;

/**
 * Viewport heights the pinned product story runs for.
 *
 * The scenes no longer slide, so this is purely how much scroll separates
 * one from the next rather than a distance anything travels. A little under
 * a viewport each reads as a deliberate move between scenes without the page
 * feeling like it has stopped responding.
 */
const STORY_VH = SCENE_COUNT * 0.8;

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
        /*
         * One trigger, two jobs, two distances.
         *
         * In the hero it reserves enough scroll to step through the
         * products. With a product open it reserves the story instead, and
         * the change is applied by refreshing after the entry move lands.
         *
         * Extending it is safe precisely because the pin grows *downward*:
         * the spacer gets taller below the viewer, nothing above them moves,
         * and their scroll position still maps to the pin's start. That is
         * why this is the same trigger rather than a second one — creating a
         * pin on selection would insert height and jump the page.
         */
        end: () => {
          if (heroStage.focusIndex >= 0) {
            return `+=${window.innerHeight * STORY_VH}`;
          }
          return `+=${window.innerHeight * STEP_VH * steps}`;
        },
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          /*
           * With a product open, scroll drives the story scalar and nothing
           * else. It never writes a transform: applyFocus reads this and
           * stays the single author of where the can is.
           *
           * Gated on the entry move having finished, so a wheel gesture
           * arriving mid-transition cannot start the story early.
           */
          if (heroStage.focusIndex >= 0) {
            heroStage.story = heroStage.focus >= 1 ? self.progress : 0;
            return;
          }

          heroStage.story = 0;
          goTo(Math.round(self.progress * steps), { fromScroll: true });
          if (self.progress > 0.02) onEngage();
        },
      });

      /*
       * Nothing moves on screen while the hero is pinned, so realigning the
       * scroll position after a button press is invisible — it just means the
       * next wheel gesture continues from the right product.
       */
      /*
       * Re-measure when the pin's job changes. Called once the entry move
       * has landed and once the return has finished, never during either:
       * refreshing mid-move would recompute the distance underneath a
       * transition that is still playing.
       */
      registerStoryRefresh(() => {
        trigger.refresh();
      });

      registerScrollSync((index) => {
        const target = trigger.start + ((trigger.end - trigger.start) * index) / steps;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(target, { immediate: true });
        else window.scrollTo(0, target);
      });
    }, element);

    return () => {
      registerStoryRefresh(null);
      registerScrollSync(null);
      context.revert();
    };
  }, [containerRef, total, enabled, goTo, onEngage]);
}
