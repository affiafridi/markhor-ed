"use client";

import { EffectComposer } from "@react-three/postprocessing";
import { Children, type ReactNode } from "react";

interface EffectsProps {
  /**
   * Gated by the device tier — see QUALITY in lib/three/config.ts. Only the
   * `high` tier is allowed to run a postprocessing pass.
   */
  enabled?: boolean;
  children?: ReactNode;
}

/**
 * Postprocessing mount point.
 *
 * Phase 1 deliberately ships no effects: the composer only mounts when it is
 * both enabled and given effects to run, so the extra render pass costs
 * nothing until Phase 2 adds bloom / chromatic aberration / tone mapping.
 */
export function Effects({ enabled = false, children }: EffectsProps) {
  if (!enabled || Children.count(children) === 0) return null;

  return <EffectComposer>{children as never}</EffectComposer>;
}
