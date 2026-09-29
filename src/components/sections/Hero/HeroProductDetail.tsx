"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
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
 * The product-detail copy, over the focused product.
 *
 * Deliberately only a layer of text and one control: the product itself is
 * still the same WebGL object that was standing in the hero a moment ago,
 * carried here by the focus transition. Nothing is re-rendered, re-mounted
 * or crossfaded, which is the whole reason the move reads as a camera
 * pushing in rather than as a second page arriving.
 *
 * It stays mounted through the exit so the copy can animate out; `inert`
 * keeps it off the keyboard path and out of the accessibility tree whenever
 * no product is open.
 *
 * Content comes from the catalogue and nothing else. `description` is null
 * for every product today because the brand has not supplied any, so the
 * specifications — which are printed on the can — carry the section. No copy
 * is written here to fill the space.
 */
export function HeroProductDetail({
  product,
  onClose,
  ref,
  className,
}: HeroProductDetailProps) {
  const open = product !== null;
  const specs = product?.specs.filter((spec) => spec.value !== null) ?? [];

  return (
    <div
      ref={ref}
      className={cn(styles.root, className)}
      inert={!open}
      aria-hidden={!open}
      data-open={open}
    >
      <div className={styles.copy}>
        <p className={cn(styles.eyebrow, "type-label")}>{product?.name}</p>
        {/*
         * Headline, not display. The display role is sized to bleed across a
         * whole viewport; here it shares the frame with a can that occupies
         * the centre-right, and a title that runs underneath the product is
         * not a composition.
         */}
        <h2 className={cn(styles.name, "type-headline")}>{product?.displayName}</h2>
        <p className={cn(styles.tagline, "type-title")}>{product?.tagline}</p>

        {product?.description ? (
          <p className={cn(styles.description, "type-body")}>{product.description}</p>
        ) : null}

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
