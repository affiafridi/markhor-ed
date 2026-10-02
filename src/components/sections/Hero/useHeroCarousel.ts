"use client";

import { useCallback, useEffect, useMemo } from "react";
import { orderedProducts } from "@/data/products";
import {
  heroStage,
  killFocusTransition,
  killProductTransition,
  nearestPositionFor,
  refreshStoryScroll,
  releaseFocus,
  runFocusTransition,
  runProductTransition,
  syncScrollToIndex,
  TRANSITION_DURATION,
  TRANSITION_DURATION_FAST,
  TRANSITION_DURATION_REDUCED,
} from "@/lib/hero";
import { useExperienceStore } from "@/store";
import type { FocusTransitionOptions } from "@/lib/hero";
import type { Product, ProductThemeId } from "@/types";

export interface GoToOptions {
  /** Shorter transition, used when flicking through with a drag or swipe. */
  fast?: boolean;
  /** Set when scroll initiated the change, so we do not re-drive the scroll. */
  fromScroll?: boolean;
}

export interface HeroCarousel {
  products: Product[];
  total: number;
  activeIndex: number;
  activeProduct: Product;
  goTo: (index: number, options?: GoToOptions) => void;
  next: (options?: GoToOptions) => void;
  previous: (options?: GoToOptions) => void;
  /** Opens a product into detail. */
  focus: (index: number, attach?: FocusAttach) => void;
  /** Returns to the hero carousel, by rewinding the opening move. */
  release: () => void;
  /** The product currently open, or null in the hero. */
  focusedProduct: Product | null;
}

/** Lets the caller hang DOM tweens on the focus timeline. */
type FocusAttach = FocusTransitionOptions["attach"];

const indexOfTheme = (theme: ProductThemeId): number => {
  const index = orderedProducts.findIndex((product) => product.theme === theme);
  return index < 0 ? 0 : index;
};

/**
 * The hero's single navigation entry point.
 *
 * Buttons, keyboard, the product list, drag, swipe and scroll all call
 * `goTo`/`next`/`previous` here — there is no second animation path, so a
 * scroll-driven change and a button press are literally the same transition.
 *
 * `goTo` does three things, in one place:
 *
 *   1. commits the product to the store, which flips `[data-scene]` and lets
 *      CSS interpolate the palette for the whole DOM
 *   2. runs the one central transition timeline (lib/hero/transition.ts),
 *      which moves the stage and every registered participant together
 *   3. realigns the pinned scroll position so scrolling resumes correctly
 */
export function useHeroCarousel(): HeroCarousel {
  const products = orderedProducts;
  const total = products.length;

  const activeTheme = useExperienceStore((state) => state.activeProduct);
  const setActiveProduct = useExperienceStore((state) => state.setActiveProduct);

  const activeIndex = useMemo(() => indexOfTheme(activeTheme), [activeTheme]);
  // The catalogue is never empty, but keep the type honest.
  const activeProduct = products[activeIndex] ?? products[0];

  const goTo = useCallback(
    (index: number, options: GoToOptions = {}) => {
      if (total === 0) return;
      const wrapped = ((Math.round(index) % total) + total) % total;
      const target = products[wrapped];
      if (!target) return;

      /*
       * Read live state rather than closing over it. Scroll and drag call
       * this many times between renders, and — more importantly — it keeps
       * `goTo` referentially stable for the component's whole life. The
       * scroll sequence depends on it, so a changing identity would tear the
       * pinned ScrollTrigger down and rebuild it mid-interaction.
       */
      const {
        activeProduct: currentTheme,
        prefersReducedMotion,
        focusedProduct,
      } = useExperienceStore.getState();
      // Detail is open: scroll, drag and keyboard must not move the carousel
      // out from under the product being looked at.
      if (focusedProduct) return;
      if (target.theme === currentTheme) return;

      const fromIndex = indexOfTheme(currentTheme);

      setActiveProduct(target.theme);

      runProductTransition({
        targetPosition: nearestPositionFor(wrapped, heroStage.position, total),
        fromIndex,
        toIndex: wrapped,
        total,
        duration: prefersReducedMotion
          ? TRANSITION_DURATION_REDUCED
          : options.fast
            ? TRANSITION_DURATION_FAST
            : TRANSITION_DURATION,
      });

      if (!options.fromScroll) syncScrollToIndex(wrapped);
    },
    [products, total, setActiveProduct],
  );

  const next = useCallback(
    (options?: GoToOptions) => {
      const current = indexOfTheme(useExperienceStore.getState().activeProduct);
      goTo(current + 1, options);
    },
    [goTo],
  );

  const previous = useCallback(
    (options?: GoToOptions) => {
      const current = indexOfTheme(useExperienceStore.getState().activeProduct);
      goTo(current - 1, options);
    },
    [goTo],
  );

  const focusedTheme = useExperienceStore((state) => state.focusedProduct);
  const setFocusedProduct = useExperienceStore((state) => state.setFocusedProduct);

  const focus = useCallback(
    (index: number, attach?: FocusAttach) => {
      if (total === 0) return;
      const wrapped = ((Math.round(index) % total) + total) % total;
      const target = products[wrapped];
      if (!target) return;

      const { prefersReducedMotion, focusedProduct } = useExperienceStore.getState();
      if (focusedProduct === target.theme) return;

      /*
       * Stop the carousel where it stands. The focus move carries the
       * selected product to the centre itself, and letting the carousel
       * travel at the same time would send whichever product wraps around
       * the list the opposite way to its exit.
       */
      killProductTransition();
      setFocusedProduct(target.theme);

      runFocusTransition({
        index: wrapped,
        total,
        position: heroStage.position,
        immediate: prefersReducedMotion,
        attach,
        // The pin reserves the story's distance instead of the carousel's
        // now. Re-measured here, once the move has landed, rather than at
        // the start of it: the length would otherwise change underneath a
        // transition still in flight.
        onComplete: refreshStoryScroll,
      });
    },
    [products, total, setFocusedProduct],
  );

  /*
   * Returning rewinds the opening timeline rather than running a second
   * move, so the store cannot be cleared until that rewind has finished —
   * otherwise the hero UI would come back while the can was still large and
   * travelling.
   */
  const release = useCallback(() => {
    const { prefersReducedMotion, focusedProduct } = useExperienceStore.getState();
    if (!focusedProduct) return;

    /*
     * The story hands control back before the hero move starts.
     *
     * Its caller has already established that the story is at its beginning;
     * this makes that a fact rather than an assumption, so the reverse
     * cannot run with stage offsets still applied to the can.
     */
    heroStage.story = 0;

    releaseFocus({
      immediate: prefersReducedMotion,
      onReturned: () => {
        setFocusedProduct(null);
        // Back to the carousel's own, much shorter, pinned distance.
        refreshStoryScroll();
      },
    });
  }, [setFocusedProduct]);

  useEffect(
    () => () => {
      killProductTransition();
      killFocusTransition();
    },
    [],
  );

  return {
    products,
    total,
    activeIndex,
    activeProduct: activeProduct as Product,
    goTo,
    next,
    previous,
    focus,
    release,
    focusedProduct: focusedTheme
      ? (products.find((product) => product.theme === focusedTheme) ?? null)
      : null,
  };
}
