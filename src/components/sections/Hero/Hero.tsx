"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { EASE, gsap } from "@/lib/animation";
import {
  activeIndexFromPosition,
  FOCUS_DURATION,
  heroStage,
  nearestPositionFor,
  settleStage,
  TRANSITION_DURATION,
  TRANSITION_DURATION_REDUCED,
} from "@/lib/hero";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import { HeroBackgroundType } from "./HeroBackgroundType";
import { HeroControls } from "./HeroControls";
import { HeroIndicator } from "./HeroIndicator";
import { HeroLightning } from "./HeroLightning";
import { HeroProductCharge } from "./HeroProductCharge";
import { HeroProductDetail } from "./HeroProductDetail";
import { HeroProductPanel } from "./HeroProductPanel";
import { HeroScrollHint } from "./HeroScrollHint";
import { useHeroCarousel } from "./useHeroCarousel";
import { useHeroDrag } from "./useHeroDrag";
import { useHeroPointer } from "./useHeroPointer";
import { useHeroScrollSequence } from "./useHeroScrollSequence";
import { useDetailReturn } from "./useDetailReturn";
import { useHeroSelect } from "./useHeroSelect";
import styles from "./Hero.module.css";

/**
 * The hero.
 *
 * Three layers, which is what produces the depth:
 *   background — the large statement, below the WebGL canvas
 *   middle     — the products, in the persistent canvas (layer 10)
 *   foreground — copy, the product list and the controls, above the canvas
 *
 * The products themselves live in the shared canvas, not here. This component
 * owns the HTML: the copy, the controls, and the entrance.
 *
 * Everything readable is real DOM text, so the hero works with WebGL
 * disabled, is crawlable, and is announced properly by a screen reader.
 */
export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);

  const {
    products,
    total,
    activeIndex,
    activeProduct,
    goTo,
    next,
    previous,
    focus,
    release,
    focusedProduct,
  } = useHeroCarousel();
  const isFocused = focusedProduct !== null;
  const detailRef = useRef<HTMLDivElement>(null);

  const isLoaded = useExperienceStore((state) => state.isLoaded);
  const setIntroComplete = useExperienceStore((state) => state.setIntroComplete);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);

  const [hasEngaged, setHasEngaged] = useState(false);
  const onEngage = useCallback(() => setHasEngaged(true), []);

  // Under reduced motion the hero is never pinned — no long animated scroll.
  useHeroScrollSequence({
    containerRef: heroRef,
    total,
    enabled: !reducedMotion,
    goTo,
    onEngage,
  });

  // Dragging the carousel while a product is open would pull the thing being
  // looked at out of frame. `goTo` refuses too, so this is belt and braces.
  useHeroDrag({
    containerRef: heroRef,
    total,
    enabled: !isFocused,
    goTo,
    onEngage,
  });

  // Publishes the cursor to the stage so the products can respond to it.
  useHeroPointer(heroRef);

  /*
   * The DOM half of the hero-to-detail move.
   *
   * Hung on the timeline the stage is already animating on rather than run
   * as tweens of its own, so the copy cannot arrive before the product it
   * describes, and an interrupted move takes the whole composition with it.
   *
   * Built in the opening direction only. The return plays this same
   * timeline backwards, so the statement comes back the way it left and the
   * copy leaves before the can starts travelling — without a second set of
   * values that could drift out of step with these.
   *
   * The positions are fractions of the focus duration, which is what keeps
   * the sheet readable: the hero UI goes almost immediately, the statement
   * leaves under the product rather than with it, and the detail copy waits
   * until the can has nearly landed.
   */
  const attachFocus = useCallback((timeline: gsap.core.Timeline | null) => {
    const detail = detailRef.current;

    if (!timeline) {
      gsap.set([foregroundRef.current, backdropRef.current], { opacity: 0 });
      gsap.set(detail, { opacity: 1, y: 0 });
      return;
    }

    const d = FOCUS_DURATION;

    timeline
      // Secondary UI is gone almost at once; it is not part of the move.
      .to(
        foregroundRef.current,
        { opacity: 0, duration: d * 0.22, ease: "power2.out" },
        d * 0.03,
      )
      /*
       * The statement grows very slightly as it goes, so it reads as being
       * passed by rather than switched off. No flashing, no flicker.
       */
      .to(
        backdropRef.current,
        { opacity: 0, scale: 1.07, duration: d * 0.55, ease: "power2.inOut" },
        d * 0.08,
      )
      // Only once the can is nearly there. Copy that arrives while the
      // product is still travelling makes the two read as separate
      // animations that happen to overlap.
      .fromTo(
        detail,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: d * 0.32, ease: "power3.out" },
        d * 0.76,
      );
  }, []);

  const onSelectProduct = useCallback(
    (index: number) => {
      focus(index, attachFocus);
    },
    [focus, attachFocus],
  );

  const onCloseDetail = useCallback(() => {
    release();
  }, [release]);

  useHeroSelect({
    containerRef: heroRef,
    enabled: !isFocused,
    onSelect: onSelectProduct,
  });

  // Scrolling back up is how you leave the product, so it is the same call
  // the cue's button makes.
  useDetailReturn({
    containerRef: heroRef,
    enabled: isFocused,
    onReturn: onCloseDetail,
  });

  /*
   * Reconciliation guard.
   *
   * The stage and the active product are driven from one place, but the stage
   * is a plain number living outside React while the product lives in the
   * store — anything that kills the running timeline (a torn-down
   * ScrollTrigger, a reverted GSAP context) can leave the two disagreeing,
   * which shows up as the wrong can centred under the right product name.
   *
   * Once the transition has had time to land, check and correct.
   */
  useEffect(() => {
    if (isFocused) return;

    const settled = reducedMotion ? TRANSITION_DURATION_REDUCED : TRANSITION_DURATION;
    const timer = window.setTimeout(
      () => {
        if (heroStage.isDragging || heroStage.focus > 0) return;
        if (activeIndexFromPosition(heroStage.position, total) === activeIndex) return;
        settleStage(nearestPositionFor(activeIndex, heroStage.position, total), 0.45);
      },
      settled * 1000 + 260,
    );

    return () => window.clearTimeout(timer);
  }, [activeIndex, total, reducedMotion, isFocused]);

  /*
   * Hide before first paint rather than in CSS: if JavaScript never runs, the
   * hero stays fully visible instead of being blank.
   */
  useIsomorphicLayoutEffect(() => {
    gsap.set([backdropRef.current, foregroundRef.current], { opacity: 0 });
  }, []);

  /* Entrance: the stage is already lit by the time this runs (isLoaded waits
   * for the product textures), so the reveal lands on a finished image. */
  useIsomorphicLayoutEffect(() => {
    if (!isLoaded) return;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([backdropRef.current, foregroundRef.current], { opacity: 1, y: 0 });
        setIntroComplete(true);
        return;
      }

      gsap
        .timeline({ onComplete: () => setIntroComplete(true) })
        .fromTo(
          backdropRef.current,
          { opacity: 0, y: 44 },
          { opacity: 1, y: 0, duration: 1.2, ease: EASE.outQuart },
          0.1,
        )
        .fromTo(
          foregroundRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: EASE.outQuart },
          0.42,
        );
    }, heroRef);

    return () => context.revert();
  }, [isLoaded, reducedMotion, setIntroComplete]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isFocused) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseDetail();
      }
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  };

  const previousProduct = products[(activeIndex - 1 + total) % total];
  const nextProduct = products[(activeIndex + 1) % total];

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      aria-labelledby="hero-title"
      data-focused={isFocused}
      onKeyDown={onKeyDown}
    >
      {/* The stable, accessible heading. The visible product name is an h2
          because it changes as the carousel moves. */}
      <h1 id="hero-title" className="visually-hidden">
        Markhor — One Nation, One Energy
      </h1>

      <div ref={backdropRef} className={styles.backdrop}>
        <HeroBackgroundType />
        <HeroLightning />
      </div>

      {/*
       * `inert` rather than only opacity. A layer faded to nothing still
       * takes clicks and still holds a tab stop, and the hero's controls sit
       * directly over the detail scene's own — which is what swallowed the
       * back button the first time.
       */}
      <div ref={foregroundRef} className={styles.foreground} inert={isFocused}>
        <div className={cn(styles.frame, "container-wide")}>
          <HeroIndicator
            className={styles.indicator}
            products={products}
            activeIndex={activeIndex}
            onSelect={goTo}
          />

          <div className={styles.bottom}>
            <div className={styles.copy}>
              <HeroProductPanel
                product={activeProduct}
                index={activeIndex}
                total={total}
              />
            </div>

            <HeroControls
              className={styles.controls}
              onPrevious={() => previous()}
              onNext={() => next()}
              previousLabel={`Previous product${previousProduct ? `: ${previousProduct.name}` : ""}`}
              nextLabel={`Next product${nextProduct ? `: ${nextProduct.name}` : ""}`}
            />
          </div>

          <HeroScrollHint className={styles.hint} isDimmed={hasEngaged} />

          {/* Says the product is interactive without putting a button on
              it. Shown by CSS from the stage's own hover answer. */}
          <p className={cn(styles.explore, "type-micro")} aria-hidden="true">
            Click to explore
          </p>
        </div>
      </div>

      {/* Last, so it paints over the hero's own foreground: both sit on the
          content layer, and the detail scene is what is in front now. */}
      {/* Behind the copy, over the canvas: the charge belongs to the front
          of the can, where the hero's own lightning belongs behind it. */}
      <HeroProductCharge />

      <HeroProductDetail
        ref={detailRef}
        product={focusedProduct}
        onClose={onCloseDetail}
      />
    </section>
  );
}
