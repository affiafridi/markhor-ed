"use client";

import { cn } from "@/lib/utils";
import styles from "./HeroScrollHint.module.css";

/**
 * Tells the visitor the stage is interactive.
 *
 * Text alone — no rule, no dot, nothing animated. It simply fades away once
 * the first interaction happens, having done its job.
 */
export function HeroScrollHint({
  isDimmed,
  className,
}: {
  isDimmed: boolean;
  className?: string;
}) {
  return (
    <p className={cn(styles.root, isDimmed && styles.dimmed, className, "type-micro")}>
      Drag or scroll to explore
    </p>
  );
}
