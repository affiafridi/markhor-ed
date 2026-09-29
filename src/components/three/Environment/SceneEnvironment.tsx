"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Fog } from "three";
import { liveTheme } from "@/lib/hero";

/**
 * Atmospheric depth for the scene.
 *
 * The canvas is transparent — the page background shows through — so there is
 * no background colour here, only distance fog in the active product's deep
 * tone. It starts beyond the active product and only ever touches the
 * products set back in the stage, which is what separates them from the front
 * one without blurring them.
 *
 * An HDR environment map would mount here once real GLB models arrive; it is
 * deliberately absent while the products are photographic, to keep the first
 * load light.
 */
export function SceneEnvironment() {
  const fog = useRef<Fog>(null);

  useFrame(() => {
    fog.current?.color.copy(liveTheme.deep);
  });

  return <fog ref={fog} attach="fog" args={["#05070a", 6.5, 18]} />;
}
