import type { ProductTransform } from "@/types";
import { wrapOffset } from "./layout";

/**
 * The hero-to-product-detail transition.
 *
 * One camera move, not a page change. The selected product is the same
 * object throughout — it travels from wherever it happens to be standing
 * into the centre and grows towards the lens, while everything else is
 * carried out of frame. Nothing is duplicated, crossfaded or remounted,
 * because the whole stage is derived from `heroStage.focus` every frame.
 *
 * `focus` runs 0 to 1 *linearly*. The easing lives here instead, per role,
 * so the parts can be staggered against each other — the sides start leaving
 * before the selected can starts growing, and the exits hold their opacity
 * until they are nearly gone. A single eased scalar cannot express that, and
 * separate tweens per product would drift.
 */

export const FOCUS_DURATION = 1.65;

/*
 * Windows on the focus scalar: [start, end] as a fraction of the whole move.
 * These are the timing sheet, and the only place it exists.
 */
/**
 * One window for the whole of the selected product's move.
 *
 * Position, scale and rotation deliberately share it. Giving them separate
 * windows makes the move legible as stages — it slides, *then* it grows,
 * *then* it turns — and the thing that sells one physical can travelling
 * between two scenes is that all three happen at once, on one curve.
 */
const SELECTED_MOVE: FocusWindow = [0.04, 0.94];
const EXIT_TRAVEL: FocusWindow = [0.03, 0.92];
/** Opacity holds until the very end: the sides must be seen leaving. */
const EXIT_FADE: FocusWindow = [0.56, 0.95];
const EXIT_BLUR: FocusWindow = [0.04, 0.82];
/** Early, so it is gone long before the lean is steep enough to expose it. */
const SELECTED_REFLECTION: FocusWindow = [0.05, 0.3];

type FocusWindow = readonly [number, number];

/** Where the selected product settles, relative to the stage. */
const DETAIL_Y = -0.08;
/** Towards the camera. Part of why it reads as a lens move, not a scale-up. */
const DETAIL_Z = 0.55;
/**
 * The final lean: eighteen degrees clockwise, top to the right.
 *
 * Plain 2D rotation, and nothing on the other two axes. These products are
 * photographic planes: turning one about X or Y does not rotate a can, it
 * foreshortens a picture of a can, and the give-away is immediate at this
 * scale. A roll in the plane of the screen has no such problem — it is the
 * one rotation a flat image can take and still look like an object.
 *
 * Negative, because three.js measures anticlockwise from the screen's point
 * of view where CSS and GSAP measure clockwise. This is GSAP's `rotation: 18`.
 */
const DETAIL_TILT_Z = -0.314;
const DETAIL_ROTATION_Y = 0;

/** How far past the frame edge a leaving product travels. */
const EXIT_OVERSHOOT = 1.22;
const EXIT_SCALE = 0.85;
/** Radians. The brief's 8 degrees. */
const EXIT_TILT_Z = 0.14;
const EXIT_ROTATION_Y = 0.34;
/** They sink a little as they go, which reads as weight rather than a slide. */
const EXIT_DROP = -0.12;
const EXIT_DEPTH = -0.5;
/**
 * Peak blur, in texture UV units — roughly five pixels across a 532px pack
 * shot. The selected product never receives any: the two together are what
 * make it read as the camera pulling focus rather than as a fade.
 */
const EXIT_BLUR_MAX = 0.0094;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progress through one window, 0 before it opens and 1 after it closes. */
const windowed = (focus: number, [start, end]: FocusWindow) =>
  clamp01((focus - start) / (end - start));

/**
 * `power3.inOut`, written out rather than pulled from GSAP.
 *
 * This runs per product per frame inside the render loop, and keeping the
 * module free of the animation library means the transform math can be
 * tested and reasoned about on its own.
 */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------------------------------------------------------------------------
 * The product story.
 *
 * Three content scenes beside a can that does not move.
 *
 * Note what is absent: there is no path from scroll to the product's
 * transform, not even a small one. Two earlier versions had one - first
 * scrubbed, then a settled offset per scene - and both read as the can
 * reacting to the wheel. It is a product shot; it should sit there. The
 * scenes move, the can is the constant they move against.
 *
 * SCENE_DURATION stays because the copy still transitions. Nothing here
 * takes a scroll value.
 * ------------------------------------------------------------------------ */

/** How many scenes the story has. */
export const SCENE_COUNT = 3;

/** Seconds one scene takes to replace another. */
export const SCENE_DURATION = 0.6;

export interface FocusParams {
  /** 0 to 1, linear. */
  focus: number;
  isSelected: boolean;
  /** -1 leaves left, +1 leaves right. Ignored when selected. */
  exitSign: number;
  /** World half-width of the frustum at this product's depth. */
  halfWidth: number;
  /** World half-width of the product itself, at its current scale. */
  productHalfWidth: number;
  /** Scale the selected product reaches in detail. Derived per viewport. */
  detailScale: number;
  /** How far right of centre the detail composition sits, in world units. */
  detailX: number;
}

export interface FocusedTransform extends ProductTransform {
  /** Directional blur, in texture UV units. Zero for the selected product. */
  blur: number;
  /**
   * How much of the floor reflection to keep, 0 to 1.
   *
   * It is a child of the product, so it leans with it. At the hero’s couple
   * of degrees that is invisible; at the detail pose’s eighteen it swings
   * out to the side and stops reading as a reflection at all.
   */
  reflection: number;
}

/** Blends a product's carousel transform towards its focused one. */
export function applyFocus(
  base: ProductTransform,
  {
    focus,
    isSelected,
    exitSign,
    halfWidth,
    productHalfWidth,
    detailScale,
    detailX,
  }: FocusParams,
): FocusedTransform {
  if (focus <= 0) return { ...base, blur: 0, reflection: 1 };

  if (isSelected) {
    /*
     * One value drives position, depth, scale and lean together - and it is
     * the *only* thing that drives them.
     *
     * Nothing else may write these while a product is open. An earlier
     * version let scroll progress add a drift on top, which meant the page's
     * own scrolling kept nudging a can that had already arrived: two systems
     * owning one transform, which is never a thing you can tune your way out
     * of. A scroll-driven product sequence belongs on its own timeline
     * handing values to this function, not layered over its output.
     */
    const move = ease(windowed(focus, SELECTED_MOVE));

    return {
      x: lerp(base.x, detailX, move),
      y: lerp(base.y, DETAIL_Y, move),
      z: lerp(base.z, DETAIL_Z, move),
      scale: lerp(base.scale, detailScale, move),
      rotationY: lerp(base.rotationY, DETAIL_ROTATION_Y, move),
      tiltZ: lerp(base.tiltZ, DETAIL_TILT_Z, move),
      // Never fades. It is the one thing on screen that stays certain.
      opacity: lerp(base.opacity, 1, move),
      blur: 0,
      reflection: 1 - ease(windowed(focus, SELECTED_REFLECTION)),
    };
  }

  const travel = ease(windowed(focus, EXIT_TRAVEL));
  const fade = ease(windowed(focus, EXIT_FADE));
  const blur = ease(windowed(focus, EXIT_BLUR));
  const exitX = exitSign * (halfWidth + productHalfWidth) * EXIT_OVERSHOOT;

  return {
    x: lerp(base.x, exitX, travel),
    y: base.y + EXIT_DROP * travel,
    z: base.z + EXIT_DEPTH * travel,
    scale: base.scale * lerp(1, EXIT_SCALE, travel),
    // Away from the centre, not towards it — see the sign convention in
    // getStageTransform, where a side product turns *in*.
    rotationY: lerp(base.rotationY, -exitSign * EXIT_ROTATION_Y, travel),
    tiltZ: lerp(base.tiltZ, exitSign * EXIT_TILT_Z, travel),
    opacity: base.opacity * (1 - fade),
    blur: blur * EXIT_BLUR_MAX,
    reflection: 1,
  };
}

/**
 * Which way each product leaves, given the one that was selected.
 *
 * Decided by where the products are standing, not by their order in the
 * catalogue. `getStageTransform` places a product at `-offset * sideX`, so a
 * larger offset is further *left* — and because the list wraps, the product
 * after the last one is on the left, not the right. Reading the row visually
 * is what makes the brief's case work: click the leftmost can and everything
 * else leaves to the right, whatever its index.
 */
export function planExit(
  selectedIndex: number,
  position: number,
  total: number,
): number[] {
  const selectedLane = -wrapOffset(selectedIndex, position, total);

  return Array.from({ length: total }, (_, index) => {
    if (index === selectedIndex) return 0;
    const lane = -wrapOffset(index, position, total);
    // Exactly level with the selection cannot happen with distinct lanes,
    // but index order is a stable answer if a future layout allows it.
    if (lane === selectedLane) return index > selectedIndex ? 1 : -1;
    return lane > selectedLane ? 1 : -1;
  });
}

/** The palette crosses to the focused product over this part of the move. */
const THEME_TRAVEL: FocusWindow = [0.1, 0.72];

/**
 * The position the *palette* should be read at.
 *
 * The carousel's own position is held still through a focus move, so opening
 * a product that is standing to one side would leave the atmosphere on
 * whichever product happened to be centred. This walks it across instead,
 * finishing a little before the can lands so the environment has already
 * changed by the time it gets there.
 */
export function themePosition(
  position: number,
  focus: number,
  focusedPosition: number,
): number {
  if (focus <= 0) return position;
  return lerp(position, focusedPosition, ease(windowed(focus, THEME_TRAVEL)));
}
