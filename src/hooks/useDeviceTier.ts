"use client";

import { useEffect } from "react";
import { detectDeviceTier } from "@/lib/utils";
import { useExperienceStore } from "@/store/experience-store";
import type { DeviceTier } from "@/types";

/**
 * Resolves the device tier once on mount and publishes it to the store.
 *
 * Deliberately not reactive to resize: re-tiering mid-session would mean
 * tearing down and rebuilding the WebGL pipeline for no real benefit.
 */
export function useDeviceTier(): DeviceTier {
  const deviceTier = useExperienceStore((state) => state.deviceTier);
  const setDeviceTier = useExperienceStore((state) => state.setDeviceTier);

  useEffect(() => {
    setDeviceTier(detectDeviceTier());
  }, [setDeviceTier]);

  return deviceTier;
}
