"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import styles from "./HornControl.module.css";

interface HornControlProps {
  /** Announced to assistive technology — the glyph alone says nothing. */
  label: string;
  direction: "previous" | "next";
  onClick: () => void;
  /**
   * The glyph itself, for a caller that wants to animate `--horn-charge`.
   * Deliberately not the button: the charge is painted inside the horn's
   * silhouette, and the button's padding is not part of that shape.
   */
  glyphRef?: RefObject<HTMLSpanElement | null>;
  className?: string;
}

/**
 * Carousel control drawn as a Markhor horn.
 *
 * The glyph is the brand's own horn artwork, split into its left and right
 * halves — `previous` gets the horn that sweeps left, `next` the one that
 * sweeps right. It is applied as a CSS mask rather than an `<img>` so the
 * horn takes `currentColor` and can pick up the product accent on hover.
 *
 * There is no ring around it. A circle would add another piece of interface
 * to a composition whose subject is the product; padding provides the touch
 * target instead.
 *
 * `--horn-charge` runs 0 to 1 and drives a light up the horn from base to
 * tip. The control does not animate it — whoever owns the transition does,
 * so the charge is on the same clock as everything else it changes.
 */
export function HornControl({
  label,
  direction,
  onClick,
  glyphRef,
  className,
}: HornControlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(styles.root, className)}
    >
      <span
        ref={glyphRef}
        className={cn(styles.horn, styles[direction])}
        aria-hidden="true"
      />
    </button>
  );
}
