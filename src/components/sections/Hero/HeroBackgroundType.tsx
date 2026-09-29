import { cn } from "@/lib/utils";
import styles from "./HeroBackgroundType.module.css";

const LINES = ["One Nation.", "One Energy."];

/**
 * The signature background statement.
 *
 * Real HTML text, not an image - it scales fluidly, stays selectable and is
 * readable by crawlers. It renders *below* the WebGL layer so the products
 * physically overlap it, which is what creates the depth in the composition.
 *
 * Deliberately architectural: it holds still. It does not flash, flicker,
 * move or change opacity on a product change - only its colour follows the
 * scene, and CSS interpolates that. The energy in this hero belongs to the
 * electrical arcs behind the can, and that contrast between huge calm type
 * and small unpredictable light is the whole effect. Animating the letters
 * themselves reads as the page blinking.
 *
 * Marked decorative: at this size and opacity it is a graphic, and the same
 * wording is carried by the hero's accessible heading.
 */
export function HeroBackgroundType({ className }: { className?: string }) {
  return (
    <p className={cn(styles.root, className)} aria-hidden="true">
      {LINES.map((line) => (
        <span className={styles.line} key={line}>
          {line}
        </span>
      ))}
    </p>
  );
}
