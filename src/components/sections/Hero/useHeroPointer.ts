"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/animation";
import { heroStage } from "@/lib/hero";

/**
 * Publishes the pointer position to the stage, in normalised device
 * coordinates.
 *
 * The products use it to know when the cursor is over them. It is written
 * straight to the stage rather than to React state: it changes on every mouse
 * move, and a re-render per move would be wasted work.
 *
 * It also mirrors the stage's hover answer back onto the element as a data
 * attribute, so the cursor can say a product is clickable. That is read on
 * the shared GSAP ticker rather than in a loop of its own, and written only
 * when it changes — the stage decides what is hovered, in the render loop,
 * and there is no DOM hit-box to ask.
 *
 * Touch is ignored — a finger has no hover, and on a touch device the same
 * gesture is already the drag.
 */
export function useHeroPointer(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      heroStage.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      // Screen y grows downward; world y grows upward.
      heroStage.pointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      heroStage.hasPointer = true;
    };

    const onLeave = () => {
      heroStage.hasPointer = false;
    };

    let wasOver: boolean | null = null;
    const syncCursor = () => {
      const over = heroStage.hoverIndex >= 0;
      if (over === wasOver) return;
      wasOver = over;
      element.dataset.overProduct = String(over);
    };

    element.addEventListener("pointermove", onMove, { passive: true });
    element.addEventListener("pointerleave", onLeave);
    gsap.ticker.add(syncCursor);

    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(syncCursor);
      delete element.dataset.overProduct;
      heroStage.hasPointer = false;
    };
  }, [containerRef]);
}
