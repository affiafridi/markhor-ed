"use client";

import type { Ref } from "react";
import { cn } from "@/lib/utils";
import styles from "./MenuButton.module.css";

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  controls: string;
  className?: string;
  /** The menu traps focus across this button and the panel it opens. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The site's menu trigger.
 *
 * Four dots and a word. It carries the whole of the navigation at every
 * breakpoint now, not just on a phone, so it has to read as a control on its
 * own — which is why the label is there rather than an icon alone.
 *
 * `aria-expanded` and `aria-controls` tie it to the overlay it opens, and it
 * stays above that overlay so it doubles as the close control.
 */
export function MenuButton({
  isOpen,
  onClick,
  controls,
  className,
  ref,
}: MenuButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={controls}
      className={cn(styles.root, isOpen && styles.open, className)}
    >
      <span className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      <span className={cn(styles.label, "type-label")}>{isOpen ? "Close" : "Menu"}</span>
    </button>
  );
}
