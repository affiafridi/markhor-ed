"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DirectionalLight } from "three";
import { liveTheme } from "@/lib/hero";

/**
 * Three-point lighting tinted by the active product theme.
 *
 * Light colours are copied from the live palette every frame rather than
 * being React props, so a product transition re-lights the scene on exactly
 * the same curve as everything else, with no re-render.
 *
 * The current pack shots are photographs and render unlit, so these lights
 * are effectively free today. They are what will light the GLB product models
 * once those are supplied.
 */
export function Lighting() {
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useFrame(() => {
    key.current?.color.copy(liveTheme.accent);
    rim.current?.color.copy(liveTheme.glow);
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      {/* Key */}
      <directionalLight ref={key} position={[4, 5, 4]} intensity={1.15} />
      {/* Rim — separates the product from the dark background. */}
      <directionalLight ref={rim} position={[-4, -1, -3]} intensity={0.75} />
    </>
  );
}
