"use client";

import { ProductStage } from "../ProductStage";

/**
 * The scene graph.
 *
 * One persistent scene for the whole site — the canvas above it never
 * remounts, so products transition within a single WebGL context rather than
 * being rebuilt per section.
 */
export function Scene() {
  return (
    <group name="scene-root">
      <ProductStage />
    </group>
  );
}
