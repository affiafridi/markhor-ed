"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type ShaderMaterial } from "three";
import { heroStage, liveTheme } from "@/lib/hero";
import { createGlowUniforms, FULLSCREEN_VERTEX, GLOW_FRAGMENT } from "./materials";

/**
 * The pool of product-coloured light behind the stage.
 *
 * Tracks the live theme, so the room changes colour with the active product
 * while the packaging itself stays true.
 */
export function ProductGlow() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => createGlowUniforms(), []);

  useFrame(() => {
    const live = material.current?.uniforms;
    if (!live) return;

    live.uColour!.value.copy(liveTheme.glow);
    // The room brightens as a product is carried across, then settles, and
    // lifts a few percent more while an arc is live — felt, not seen as a
    // flash.
    const speed = Math.min(Math.abs(heroStage.velocity) / 2.6, 1);
    live.uIntensity!.value = 0.5 + speed * 0.3 + heroStage.discharge * 0.05;
  });

  return (
    <mesh position={[0, -0.1, -1.9]} renderOrder={-1}>
      <planeGeometry args={[5.2, 4.4]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={FULLSCREEN_VERTEX}
        fragmentShader={GLOW_FRAGMENT}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
