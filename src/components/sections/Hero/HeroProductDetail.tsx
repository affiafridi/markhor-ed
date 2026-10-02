"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { gsap, registerGsap } from "@/lib/animation";
import { heroStage, SCENE_COUNT, SCENE_DURATION } from "@/lib/hero";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import type { Product } from "@/types";
import styles from "./HeroProductDetail.module.css";

interface HeroProductDetailProps {
  product: Product | null;
  onClose: () => void;
  /** The hero animates this layer on the shared focus timeline. */
  ref?: RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * The product story: three content scenes beside a product that stays put.
 *
 * Each scene is a whole composition. It arrives as one block and leaves as
 * one block — no heading, stat or sentence has an animation of its own, and
 * nothing's opacity is a function of scroll position. An earlier version did
 * exactly that and the result read as a list of elements reacting to the
 * wheel rather than as scenes you move between.
 *
 * So scroll does exactly one thing: it decides which scene is active. A
 * change of active scene then fires one short tween. Nothing is dragged
 * along with the scrollbar — the scenes all occupy the same box, so each one
 * arrives where the last one was instead of at its own height. The can is
 * not in that path at all: it sits in a fixed canvas holding the transform
 * the entry move left it at, apart from one small offset per scene.
 *
 * The panel that is not active is `inert`: a scene that has slid out of the
 * frame must not still be tabbable.
 */
/**
 * The rail lies down below 1024, where the copy is centred and a left-hand
 * track would be stranded against the edge. The ticks have to know which way
 * round it is to place themselves.
 */
const horizontal = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;

export function HeroProductDetail({
  product,
  onClose,
  ref,
  className,
}: HeroProductDetailProps) {
  const open = product !== null;
  const specs = product?.specs.filter((spec) => spec.value !== null) ?? [];
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);

  const panels = useRef<Array<HTMLElement | null>>([]);
  const railFill = useRef<HTMLSpanElement>(null);
  const railTicks = useRef<Array<HTMLSpanElement | null>>([]);
  const railCurrent = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    registerGsap();

    let active = -1;

    const show = (index: number) => {
      if (index === active) return;
      active = index;

      railTicks.current.forEach((tick, i) => {
        tick?.setAttribute("data-active", String(i === index));
      });
      if (railCurrent.current) {
        railCurrent.current.textContent = String(index + 1).padStart(2, "0");
      }

      panels.current.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === index;
        panel.inert = !isActive;

        if (reducedMotion) {
          gsap.set(panel, { opacity: isActive ? 1 : 0, y: 0 });
          return;
        }

        // One tween for the whole scene, not one per element inside it.
        gsap.to(panel, {
          opacity: isActive ? 1 : 0,
          y: isActive ? 0 : 30,
          duration: SCENE_DURATION,
          ease: "power3.out",
          overwrite: true,
        });
      });
    };

    /*
     * Read on the shared ticker rather than from a ScrollTrigger of its own.
     * The pinned trigger already publishes progress, and a second trigger
     * measuring the same scroll is how two systems end up disagreeing.
     */
    const tick = () => {
      const story = heroStage.focus >= 1 ? heroStage.story : 0;

      /*
       * The rail is the one thing that does follow scroll continuously, and
       * it should: it is a read-out of where you are, not part of the
       * composition. Written as a transform so it costs nothing per frame.
       */
      const fill = railFill.current;
      if (fill) fill.style.scale = horizontal() ? `${story} 1` : `1 ${story}`;

      show(Math.min(SCENE_COUNT - 1, Math.floor(story * SCENE_COUNT * 0.999)));
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [open, reducedMotion]);

  const panel = (index: number, children: ReactNode) => (
    <section
      ref={(node) => {
        panels.current[index] = node;
      }}
      className={styles.panel}
      style={{ opacity: index === 0 ? 1 : 0 }}
      inert={index !== 0}
    >
      <div className={styles.copy}>{children}</div>
    </section>
  );

  return (
    <div
      ref={ref}
      className={cn(styles.root, className)}
      inert={!open}
      aria-hidden={!open}
      data-open={open}
    >
      <div className={styles.column}>
        {/* Scene one — identity. */}
        {panel(
          0,
          <>
            <p className={cn(styles.eyebrow, "type-label")}>{product?.name}</p>
            <h2 className={cn(styles.name, "type-headline")}>{product?.displayName}</h2>
            <p className={cn(styles.tagline, "type-title")}>{product?.tagline}</p>

            {specs.length > 0 ? (
              <dl className={styles.specs}>
                {specs.map((spec) => (
                  <div className={styles.spec} key={spec.label}>
                    <dt className={cn(styles.specLabel, "type-micro")}>{spec.label}</dt>
                    <dd className={cn(styles.specValue, "type-title")}>
                      {spec.value}
                      <span className={styles.specUnit}>{spec.unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </>,
        )}

        {/* Scene two — the drink.
            Only what the packaging itself states. The brand has supplied no
            body copy, and the gap is marked rather than filled. */}
        {panel(
          1,
          <>
            <p className={cn(styles.eyebrow, "type-label")}>The drink</p>
            <h2 className={cn(styles.name, "type-headline")}>Stimulant Drink</h2>
            {product?.description ? (
              <p className={cn(styles.body, "type-body")}>{product.description}</p>
            ) : (
              <p className={cn(styles.pending, "type-micro")}>
                Product copy to be supplied by the brand.
              </p>
            )}
          </>,
        )}

        {/* Scene three — origin. Printed round the foot of the can, along
            with the skyline the story raises the product to show. */}
        {panel(
          2,
          <>
            <p className={cn(styles.eyebrow, "type-label")}>Origin</p>
            <h2 className={cn(styles.name, "type-headline")}>Proud Pakistani Brand</h2>
            <p className={cn(styles.pending, "type-micro")}>
              Brand story to be supplied.
            </p>
          </>,
        )}
      </div>

      {/*
       * A cue, not a button.
       *
       * The detail scene is the same page as the hero, reached by a camera
       * move rather than by navigation — an "all drinks" control implied it
       * was somewhere else you had to come back from. Scrolling up is the
       * real gesture, so the affordance names it.
       *
       * Still a real button underneath: pointing at a gesture is no help to
       * anyone using a keyboard or a screen reader.
       */}
      {/* Progress through the scenes. See the note in the stylesheet. */}
      <div className={styles.rail} aria-hidden="true">
        <span ref={railFill} className={styles.railFill} />
        {Array.from({ length: SCENE_COUNT }, (_, index) => (
          <span
            key={index}
            ref={(node) => {
              railTicks.current[index] = node;
            }}
            className={styles.railTick}
            data-active={index === 0}
            style={
              horizontal()
                ? { insetInlineStart: `${(index / (SCENE_COUNT - 1)) * 100}%` }
                : { insetBlockStart: `${(index / (SCENE_COUNT - 1)) * 100}%` }
            }
          />
        ))}
        <span className={cn(styles.railCount, "type-micro")}>
          <span ref={railCurrent} className={styles.railCurrent}>
            01
          </span>
          {` / ${String(SCENE_COUNT).padStart(2, "0")}`}
        </span>
      </div>

      <button
        type="button"
        className={styles.back}
        onClick={onClose}
        aria-label="Return to all drinks"
      >
        <span aria-hidden="true" className={styles.backGlyph} />
        <span className={cn(styles.backLabel, "type-micro")}>Scroll to return</span>
      </button>
    </div>
  );
}
