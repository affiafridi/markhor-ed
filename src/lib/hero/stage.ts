/**
 * The hero stage's live, non-React state.
 *
 * `position` is the entire carousel: one continuous number. Buttons,
 * keyboard, drag, swipe and scroll all resolve to a tween of it, and the 3D
 * scene reads it every frame to re-derive each product's transform.
 *
 * The pointer lives here too, because the products react to it every frame
 * and routing that through React would re-render the tree on every mouse
 * move (see the note in store/experience-store.ts).
 *
 * `position` is unbounded: advancing past the last product continues to 3, 4,
 * and so on. `wrapOffset` folds it back onto the list.
 */
export interface HeroStageState {
  position: number;
  /**
   * Smoothed rate of change of `position`, in products per second.
   *
   * The products use it to lean into a move and dip back in depth while it
   * is happening, which is what makes a transition feel like an object with
   * weight rather than a value being interpolated. Derived once per frame by
   * StageDriver — never written by an input.
   */
  velocity: number;
  /**
   * 0-1 while an electrical discharge is live.
   *
   * Lets the product's glow lift very slightly with an arc without any
   * full-screen flash. Written by HeroLightning, read by ProductGlow.
   */
  discharge: number;
  /** True while the user is dragging, which suspends hover and scroll. */
  isDragging: boolean;
  /** Pointer in normalised device coordinates, -1..1, origin at centre. */
  pointerX: number;
  pointerY: number;
  /** False once the pointer leaves the hero, or on a touch device at rest. */
  hasPointer: boolean;

  /* ---------------------------------------------------------------------
   * Focus — the hero-to-product-detail transition.
   *
   * A second scalar beside `position`, for the same reason: one number that
   * every product re-derives itself from, so the selected can travelling to
   * the centre and the others leaving the frame can never fall out of step.
   *
   * `position` is deliberately *not* animated while this runs. Driving the
   * carousel at the same time would send whichever product wraps around the
   * list in the opposite direction to its exit.
   * ------------------------------------------------------------------ */

  /** 0 in the hero, 1 in product detail. Linear — easing is per-role. */
  focus: number;
  /** Index of the selected product, or -1 when nothing is focused. */
  focusIndex: number;
  /**
   * Which way each product leaves, by index: -1 left, +1 right, 0 selected.
   *
   * Frozen at selection from where the products actually *are* on screen,
   * not from their order in the list — the carousel wraps, so the product
   * after the last one sits on the left.
   */
  exitSigns: number[];

  /**
   * Where the focused product actually is, in world units and radians.
   *
   * Published by the product itself each frame, so the DOM can place things
   * on top of it — the electricity round the can needs the can's real
   * transform, and re-deriving it outside the render loop would be a second
   * source of truth that could drift.
   */
  detailX: number;
  detailY: number;
  detailScale: number;
  detailTilt: number;

  /** Index of the product under the cursor, or -1. Published by the stage. */
  hoverIndex: number;
  /** Depth of that claim, so the nearest product wins an overlap. */
  hoverDepth: number;
}

export const heroStage: HeroStageState = {
  position: 0,
  velocity: 0,
  discharge: 0,
  isDragging: false,
  pointerX: 0,
  pointerY: 0,
  hasPointer: false,
  focus: 0,
  focusIndex: -1,
  exitSigns: [],
  detailX: 0,
  detailY: 0,
  detailScale: 1,
  detailTilt: 0,
  hoverIndex: -1,
  hoverDepth: -Infinity,
};

/** Restores the stage to its initial product. Used on unmount. */
export function resetHeroStage(): void {
  heroStage.position = 0;
  heroStage.velocity = 0;
  heroStage.discharge = 0;
  heroStage.isDragging = false;
  heroStage.hasPointer = false;
  heroStage.focus = 0;
  heroStage.focusIndex = -1;
  heroStage.exitSigns = [];
  heroStage.hoverIndex = -1;
  heroStage.hoverDepth = -Infinity;
}
