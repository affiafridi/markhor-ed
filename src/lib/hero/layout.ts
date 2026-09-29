import type { ProductTransform, ViewportTier } from "@/types";

/**
 * Stage geometry per viewport, in world units.
 *
 * The same three products render at every size — only spacing, depth and
 * scale change. Mobile pulls the neighbours in close so they read as
 * partially visible edges rather than a shrunken desktop composition.
 */
interface StageMetrics {
  /** Horizontal distance from centre to a neighbouring product. */
  sideX: number;
  /** How far a neighbour sits behind the active product. */
  sideZ: number;
  sideScale: number;
  activeScale: number;
  /** Neighbours dim rather than blur, so they stay recognisable. */
  sideOpacity: number;
  /** Radians a neighbour turns towards the centre. */
  sideRotation: number;
  /** Neighbours settle slightly lower, which reads as depth. */
  sideY: number;
}

const STAGE_METRICS: Record<ViewportTier, StageMetrics> = {
  desktop: {
    sideX: 1.95,
    sideZ: -1.6,
    sideScale: 0.62,
    activeScale: 1,
    sideOpacity: 0.62,
    sideRotation: 0.14,
    sideY: -0.08,
  },
  tablet: {
    sideX: 1.55,
    sideZ: -1.45,
    sideScale: 0.58,
    activeScale: 0.9,
    sideOpacity: 0.55,
    sideRotation: 0.12,
    sideY: -0.06,
  },
  mobile: {
    sideX: 1.18,
    sideZ: -1.2,
    sideScale: 0.5,
    activeScale: 0.76,
    sideOpacity: 0.45,
    sideRotation: 0.1,
    sideY: -0.04,
  },
};

/** The active product's resting lean, in radians (about -1.7 degrees). */
const ACTIVE_TILT = -0.03;
/** Extra lean a product picks up as it moves out to a side slot. */
const SIDE_TILT = 0.06;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Frame-rate independent easing factor.
 *
 * `smoothing` is the fraction still remaining after one second, so smaller
 * values settle faster. Use it as `current += (target - current) * damp(...)`.
 */
export function damp(smoothing: number, delta: number): number {
  return 1 - Math.pow(smoothing, delta);
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Shortest signed distance from the stage position, wrapping around the list.
 *
 * Accepts a fractional position: the stage is driven by a continuous value so
 * that dragging, scroll scrubbing and an interrupted tween all use the exact
 * same code path as a button press.
 *
 * With three products every item stays within -1.5..1.5, which is what gives
 * the hero its fixed three-position composition.
 */
export function wrapOffset(index: number, position: number, total: number): number {
  if (total <= 0) return 0;
  const half = total / 2;
  let offset = index - position;
  while (offset > half) offset -= total;
  while (offset < -half) offset += total;
  return offset;
}

/**
 * The transform for one product at an arbitrary stage position.
 *
 * Pure and continuous — there are no keyframes and no per-object tweens. The
 * transition timeline animates a single scalar (`heroStage.position`) and the
 * scene re-derives every product from it each frame, so position, depth,
 * scale, rotation and opacity can never drift out of sync with each other.
 *
 * Advancing the carousel brings the incoming product in from the left, which
 * puts King left and the unannounced product right while Green is centred —
 * the approved composition.
 */
export function getStageTransform(
  index: number,
  position: number,
  total: number,
  tier: ViewportTier,
): ProductTransform {
  const m = STAGE_METRICS[tier];
  const offset = wrapOffset(index, position, total);
  const distance = Math.min(Math.abs(offset), 2);
  const near = Math.min(distance, 1);
  // How far past the immediate neighbour slot this product has travelled.
  const far = Math.max(distance - 1, 0);

  // Continuous through zero, so a product never snaps as it crosses centre.
  const lateral = clamp(offset, -1, 1) + Math.sign(offset) * far * 0.65;

  return {
    x: -lateral * m.sideX,
    y: m.sideY * near,
    z: lerp(0, m.sideZ, near) * (1 + far * 0.6),
    scale: lerp(m.activeScale, m.sideScale, near) * (1 - far * 0.25),
    rotationY: -clamp(offset, -1, 1) * m.sideRotation,
    tiltZ: ACTIVE_TILT - clamp(offset, -1, 1) * SIDE_TILT,
    opacity: far > 0 ? m.sideOpacity * (1 - far) : lerp(1, m.sideOpacity, near),
  };
}

/** Normalises any stage position to a product index. */
export function activeIndexFromPosition(position: number, total: number): number {
  if (total <= 0) return 0;
  return ((Math.round(position) % total) + total) % total;
}

/**
 * The representation of `index` closest to the current position.
 *
 * Keeps the carousel taking the short way round — advancing past the last
 * product continues forwards to the first rather than rewinding through the
 * whole list.
 */
export function nearestPositionFor(
  index: number,
  position: number,
  total: number,
): number {
  return position + wrapOffset(index, position, total);
}

/** Camera dolly per viewport, so the stage frames consistently. */
export const CAMERA_DISTANCE: Record<ViewportTier, number> = {
  desktop: 4.2,
  tablet: 4.6,
  mobile: 5.1,
};

/** Maximum camera travel from pointer parallax, in world units. */
export const PARALLAX_STRENGTH: Record<ViewportTier, number> = {
  desktop: 0.22,
  tablet: 0.1,
  mobile: 0,
};
