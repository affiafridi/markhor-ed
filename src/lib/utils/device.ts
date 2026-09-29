import type { DeviceTier } from "@/types";

/** Navigator fields that are widely implemented but missing from lib.dom. */
interface CapabilityNavigator extends Navigator {
  deviceMemory?: number;
}

/**
 * Resolves a coarse capability bucket once, on mount.
 *
 * This is a budget hint, not a device database: it decides DPR ceiling,
 * whether postprocessing runs, and how much motion we allow. It is never
 * recomputed during scroll.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "medium";

  const nav = window.navigator as CapabilityNavigator;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = window.matchMedia("(max-width: 767px)").matches;

  if (coarsePointer && smallViewport && (cores <= 4 || memory <= 4)) return "low";
  if (cores >= 8 && memory >= 8 && !coarsePointer) return "high";
  if (cores <= 2 || memory <= 2) return "low";

  return "medium";
}

/** Device-pixel-ratio ceiling per tier. Keeps fill-rate under control. */
export const DPR_BY_TIER: Record<DeviceTier, [number, number]> = {
  low: [1, 1.25],
  medium: [1, 1.75],
  high: [1, 2],
};
