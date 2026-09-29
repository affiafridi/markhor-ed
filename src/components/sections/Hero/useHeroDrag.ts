"use client";

import { useEffect, type RefObject } from "react";
import {
  activeIndexFromPosition,
  heroStage,
  killProductTransition,
  nearestPositionFor,
  settleStage,
} from "@/lib/hero";
import type { GoToOptions } from "./useHeroCarousel";

/** Fraction of the viewport width that equals one product step. */
const STEP_FRACTION = 0.34;
/** How far the stage may be pulled past the neighbouring product. */
const MAX_PULL = 1;
/** Past this much of a step, releasing advances instead of springing back. */
const COMMIT_THRESHOLD = 0.18;
/** Movement below this is a click, not a drag. */
const START_THRESHOLD = 4;

interface HeroDragOptions {
  containerRef: RefObject<HTMLElement | null>;
  total: number;
  enabled: boolean;
  goTo: (index: number, options?: GoToOptions) => void;
  onEngage: () => void;
}

/**
 * Pointer drag and touch swipe.
 *
 * Because the stage is a single continuous scalar, dragging can move it
 * directly — the products track the pointer, and releasing tweens to the
 * nearest product through the same `goTo` as every other control. No carousel
 * library, and no second animation path.
 *
 * Dragging right advances, matching the composition: the incoming product
 * arrives from the left.
 *
 * Vertical intent is detected on the first move and hands the gesture back to
 * the page, so a swipe down the phone still scrolls (`touch-action: pan-y`
 * does the same at the CSS level).
 */
export function useHeroDrag({
  containerRef,
  total,
  enabled,
  goTo,
  onEngage,
}: HeroDragOptions): void {
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enabled || total < 2) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startPosition = 0;
    let isDragging = false;
    let isAbandoned = false;

    const stepDistance = () => Math.max(window.innerWidth * STEP_FRACTION, 120);

    const onPointerDown = (event: PointerEvent) => {
      // Never steal a gesture that started on a button or a link.
      if ((event.target as HTMLElement).closest("button, a")) return;
      if (event.button !== 0) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startPosition = heroStage.position;
      isDragging = false;
      isAbandoned = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || isAbandoned) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!isDragging) {
        if (Math.abs(dx) < START_THRESHOLD && Math.abs(dy) < START_THRESHOLD) return;
        // A mostly-vertical gesture belongs to the page, not the carousel.
        if (Math.abs(dy) > Math.abs(dx)) {
          isAbandoned = true;
          return;
        }
        isDragging = true;
        heroStage.isDragging = true;
        killProductTransition();
        element.setPointerCapture(event.pointerId);
        element.dataset.dragging = "true";
        onEngage();
      }

      const travel = dx / stepDistance();
      heroStage.position =
        startPosition + Math.max(-MAX_PULL, Math.min(MAX_PULL, travel));
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;

      if (!isDragging) {
        isAbandoned = false;
        return;
      }

      isDragging = false;
      heroStage.isDragging = false;
      delete element.dataset.dragging;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      const travelled = heroStage.position - startPosition;
      const from = activeIndexFromPosition(startPosition, total);

      if (Math.abs(travelled) > COMMIT_THRESHOLD) {
        goTo(from + Math.sign(travelled), { fast: true });
        return;
      }

      // Not far enough — settle back onto the product we started from.
      settleStage(nearestPositionFor(from, heroStage.position, total));
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", finish);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", finish);
      element.removeEventListener("pointercancel", finish);
      heroStage.isDragging = false;
      delete element.dataset.dragging;
    };
  }, [containerRef, total, enabled, goTo, onEngage]);
}
