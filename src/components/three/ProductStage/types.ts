/**
 * A per-frame opacity channel.
 *
 * ProductVisual computes it from the stage position; the mounted renderer
 * applies it to its own materials. A plain ref, because it changes every
 * frame during a transition and must never cause a React render.
 */
export type OpacityRef = { current: number };

/**
 * A per-frame directional-blur channel, in texture UV units.
 *
 * Set only on products leaving the frame during a focus transition. The
 * selected product stays at zero, and the difference between the two is what
 * reads as the camera pulling focus rather than as a crossfade.
 */
export type BlurRef = { current: number };

/**
 * World height of the active product.
 *
 * Tuned against CAMERA_DISTANCE and STAGE_Y so the can clears the header at
 * the top and leaves its reflection room at the bottom. At 1.75 it ran into
 * the navigation on a 900px-tall viewport.
 */
export const PRODUCT_HEIGHT = 1.58;

/**
 * Width/height of the 250 ml can. Every product shares the format, so this
 * doubles as the hover hit-box without each product reporting its own.
 */
export const PRODUCT_ASPECT = 0.373;

/**
 * How far above centre the stage sits.
 *
 * Enough to leave the reflection room without crowding the header. Lives here
 * rather than in ProductStage so the hover projection can account for it.
 */
export const STAGE_Y = 0.08;
