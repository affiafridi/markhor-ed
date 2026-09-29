/** Types owned by the WebGL / animation layer rather than by content. */

/**
 * Which product palette the site is currently expressing. Drives both the
 * `[data-scene]` CSS attribute and the lighting in the 3D scene.
 *
 * `next` is the unannounced third product. It has no published identity, so
 * its palette is a restrained neutral rather than an invented brand colour.
 */
export type ProductThemeId = "green" | "king" | "next";

/** `base` is the neutral foundation the site sits on between products. */
export type SceneThemeId = ProductThemeId | "base";

/**
 * Named scroll destinations in the persistent experience. Intentionally small
 * — this grows as the real sections are built.
 */
export type SceneId = "intro" | "product" | "narrative";

/**
 * Coarse capability bucket, resolved once on mount. Used to pick DPR, the
 * postprocessing budget and animation intensity. Never updated per frame.
 */
export type DeviceTier = "low" | "medium" | "high";

/**
 * Viewport class for the hero composition.
 *
 * Resolved from a media query, not from a raw pixel read, so it stays in step
 * with the CSS breakpoints. Drives product spacing and camera travel — the
 * same components and data render at every size.
 */
export type ViewportTier = "mobile" | "tablet" | "desktop";

/**
 * A product's transform within the hero stage, in world units.
 *
 * Produced declaratively by `getStageLayout()` and consumed by the single
 * transition timeline. Nothing animates these values imperatively.
 */
export interface ProductTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Y rotation in radians. */
  rotationY: number;
  /**
   * Z lean in radians. The cans are not stood perfectly upright — a couple
   * of degrees reads as a photographed object rather than a pasted cut-out.
   */
  tiltZ: number;
  /** 0–1. Inactive products dim rather than blur. */
  opacity: number;
}
