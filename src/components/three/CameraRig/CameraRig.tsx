"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { CAMERA_DISTANCE, heroStage, PARALLAX_STRENGTH } from "@/lib/hero";
import { CAMERA } from "@/lib/three";
import { useExperienceStore } from "@/store";

/**
 * How quickly the rig catches up to the pointer. Frame-rate independent, and
 * deliberately slow — the depth should be felt, not noticed.
 */
const DAMPING = 0.02;

/**
 * Owns the scene camera.
 *
 * The camera sits inside a group so transitions animate the rig rather than
 * the camera itself, keeping dolly and look-at independent.
 *
 * Pointer parallax is a small truck/pedestal move on the rig, not a rotation,
 * which reads as depth without the scene appearing to chase the cursor. It is
 * off entirely on touch (PARALLAX_STRENGTH.mobile is 0) and under reduced
 * motion.
 *
 * The dolly distance comes from the viewport tier, so the same stage frames
 * correctly from phone to ultrawide.
 */
export function CameraRig({ children }: { children?: ReactNode }) {
  const rig = useRef<Group>(null);
  const tier = useExperienceStore((state) => state.viewportTier);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);

  useFrame(({ pointer }, delta) => {
    const node = rig.current;
    if (!node) return;

    /*
     * The camera holds still once a product is open. A hero composition can
     * drift with the cursor; a product shot cannot, and the DOM overlay that
     * draws the electricity round the can derives its position from the
     * product's own transform, so a moving camera would slide the two apart.
     */
    const strength = reducedMotion ? 0 : PARALLAX_STRENGTH[tier] * (1 - heroStage.focus);
    const targetX = pointer.x * strength;
    const targetY = pointer.y * strength * 0.55;

    const damping = 1 - Math.pow(DAMPING, delta);
    node.position.x += (targetX - node.position.x) * damping;
    node.position.y += (targetY - node.position.y) * damping;
  });

  return (
    <group ref={rig} name="camera-rig">
      <PerspectiveCamera
        makeDefault
        fov={CAMERA.fov}
        near={CAMERA.near}
        far={CAMERA.far}
        position={[0, 0, CAMERA_DISTANCE[tier]]}
      />
      {children}
    </group>
  );
}
