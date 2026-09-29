import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import styles from "./HeroProductPanel.module.css";

interface HeroProductPanelProps {
  product: Product;
  index: number;
  total: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The active product's name, tagline and position in the set.
 *
 * Purely presentational — every string comes from the product record, and the
 * crossfade between products belongs to the hero's central transition
 * timeline, which animates the wrapper around this. Keeping the animation out
 * of here is what stops GSAP and Motion both owning the same element.
 *
 * `aria-live="polite"` announces the change, which is the non-visual
 * equivalent of the transition.
 */
export function HeroProductPanel({ product, index, total }: HeroProductPanelProps) {
  return (
    <div className={styles.root} aria-live="polite">
      <h2 className={cn(styles.name, "type-headline")}>{product.displayName}</h2>

      {product.tagline ? (
        <p className={cn(styles.tagline, "type-label")}>{product.tagline}</p>
      ) : null}

      <p className={cn(styles.counter, "type-micro")}>
        <span className={styles.current}>{pad(index + 1)}</span>
        <span aria-hidden="true"> / </span>
        <span>{pad(total)}</span>
      </p>
    </div>
  );
}
