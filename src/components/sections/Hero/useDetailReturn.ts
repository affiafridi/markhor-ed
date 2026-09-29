"use client";

import { useEffect, type RefObject } from "react";
import { isFocusTransitioning } from "@/lib/hero";

/**
 * Accumulated upward intent needed to leave, in wheel-pixels.
 *
 * Deliberately well above a stray trackpad nudge. A single notch of a mouse
 * wheel is around 100; a resting palm on a trackpad produces a handful.
 */
const RETURN_THRESHOLD = 220;
/** Intent decays, so slow drift over several seconds never adds up to a leave. */
const DECAY_PER_SECOND = 400;
/** Touch travels in real pixels, so it needs its own, shorter, distance. */
const SWIPE_THRESHOLD = 90;

interface DetailReturnOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onReturn: () => void;
}

/**
 * Leaving the product detail scene by scrolling back up.
 *
 * Intent, not movement. The brief is that a tiny accidental gesture must not
 * throw the user out of the product, so upward scrolling accumulates and has
 * to clear a threshold, and what it accumulates bleeds away again when the
 * user stops. Downward scrolling resets it outright.
 *
 * Nothing is listened to while the transition itself is running: a wheel
 * gesture arriving mid-move could otherwise start the return before the
 * opening had landed, and the two would fight over the same timeline.
 */
export function useDetailReturn({
  containerRef,
  enabled,
  onReturn,
}: DetailReturnOptions): void {
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enabled) return;

    let intent = 0;
    let last = performance.now();
    let touchY: number | null = null;
    let done = false;

    const trigger = () => {
      if (done) return;
      done = true;
      onReturn();
    };

    const onWheel = (event: WheelEvent) => {
      if (done || isFocusTransitioning()) return;

      const now = performance.now();
      intent = Math.max(0, intent - ((now - last) / 1000) * DECAY_PER_SECOND);
      last = now;

      // Upward only. Scrolling down means the user is staying.
      if (event.deltaY >= 0) {
        intent = 0;
        return;
      }

      intent += -event.deltaY;
      if (intent >= RETURN_THRESHOLD) trigger();
    };

    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (done || touchY === null || isFocusTransitioning()) return;
      const y = event.touches[0]?.clientY;
      if (y === undefined) return;
      // Dragging down the screen is the touch equivalent of scrolling up.
      if (y - touchY > SWIPE_THRESHOLD) trigger();
    };

    const onTouchEnd = () => {
      touchY = null;
    };

    element.addEventListener("wheel", onWheel, { passive: true });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: true });
    element.addEventListener("touchend", onTouchEnd);

    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, enabled, onReturn]);
}
