"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import styles from "./HeroIndicator.module.css";

interface HeroIndicatorProps {
  products: Product[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The product list.
 *
 * Doubles as navigation — each entry is a real button that routes through the
 * same `goTo` as every other control, so there is no second transition path.
 * Rendered as a tablist so assistive technology understands that selecting an
 * entry changes what the stage shows.
 */
export function HeroIndicator({
  products,
  activeIndex,
  onSelect,
  className,
}: HeroIndicatorProps) {
  return (
    <div
      className={cn(styles.root, className)}
      role="tablist"
      aria-label="Choose a product"
      aria-orientation="vertical"
    >
      {products.map((product, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={product.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(styles.entry, isActive && styles.active)}
            onClick={() => onSelect(index)}
          >
            <span className={cn(styles.index, "type-micro")}>{pad(index + 1)}</span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={cn(styles.label, "type-label")}>{product.name}</span>
          </button>
        );
      })}
    </div>
  );
}
