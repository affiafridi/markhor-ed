"use client";

import { useEffect, type RefObject } from "react";
import { heroStage } from "@/lib/hero";

/** Movement above this makes the gesture a drag, so it selects nothing. */
const CLICK_SLOP = 5;

interface HeroSelectOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onSelect: (index: number) => void;
}

/**
 * Turns a click on a product into a selection.
 *
 * The canvas cannot take pointer events — the hero's drag needs them, and
 * letting react-three-fiber have them is what broke it before (see the note
 * in ExperienceCanvas.module.css). So there is no raycast here. The products
 * already work out whether the cursor is over them each frame, for the hover
 * response, and publish the nearest claim to `heroStage.hoverIndex`; this
 * reads that.
 *
 * It listens alongside the drag rather than inside it, because the two
 * answer different questions: the drag cares how far the pointer moved, this
 * cares what was under it when the pointer came up and went down.
 */
export function useHeroSelect({
  containerRef,
  enabled,
  onSelect,
}: HeroSelectOptions): void {
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enabled) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startIndex = -1;

    const onPointerDown = (event: PointerEvent) => {
      // A control on top of the stage owns its own click.
      if ((event.target as HTMLElement).closest("button, a")) return;
      if (event.button !== 0) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startIndex = heroStage.hoverIndex;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;

      if (Math.abs(event.clientX - startX) > CLICK_SLOP) return;
      if (Math.abs(event.clientY - startY) > CLICK_SLOP) return;
      /*
       * Normally the press decides, so a drag that slips off one can and
       * onto another cannot open the wrong product. But the stage works out
       * what is under the cursor in the render loop, so a press that lands
       * in the same frame as the pointer arriving has nothing to read yet —
       * fall back to the release in that case.
       */
      const index = startIndex >= 0 ? startIndex : heroStage.hoverIndex;
      if (index < 0) return;
      if (startIndex >= 0 && heroStage.hoverIndex !== startIndex) return;

      onSelect(index);
    };

    const cancel = () => {
      pointerId = null;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", cancel);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", cancel);
    };
  }, [containerRef, enabled, onSelect]);
}
