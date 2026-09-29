import type { DeviceTier } from "@/types";

/** Default camera. CameraRig owns the actual camera instance. */
export const CAMERA = {
  fov: 35,
  near: 0.1,
  far: 100,
  position: [0, 0, 4.2] as [number, number, number],
};

export interface QualityProfile {
  /** [min, max] device pixel ratio handed to the renderer. */
  dpr: [number, number];
  antialias: boolean;
  /** Whether the postprocessing pass is allowed to run at all. */
  postprocessing: boolean;
  shadows: boolean;
}

/**
 * Per-tier rendering budget.
 *
 * Mobile keeps the experience — it renders the same scene — but at a lower
 * pixel ratio and without postprocessing. Nothing is disabled outright.
 */
export const QUALITY: Record<DeviceTier, QualityProfile> = {
  low: { dpr: [1, 1.25], antialias: false, postprocessing: false, shadows: false },
  medium: { dpr: [1, 1.75], antialias: true, postprocessing: false, shadows: false },
  high: { dpr: [1, 2], antialias: true, postprocessing: true, shadows: false },
};
