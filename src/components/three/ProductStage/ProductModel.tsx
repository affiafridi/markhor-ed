"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, type Group, type Material } from "three";
import type { ModelAsset } from "@/types";
import type { OpacityRef } from "./types";

/**
 * A product rendered from its GLB.
 *
 * This is the path every product takes once real models are supplied. No
 * product carries a `model` today, so it is not currently mounted — it exists
 * so that dropping a GLB into src/data/products.ts is the only change needed.
 *
 * Unlike the photographic billboard, a model is lit by the scene; see
 * Lighting, which supplies the key, fill and rim.
 *
 * Compressed models (Meshopt / Draco / KTX2) need their decoder registered on
 * the loader before this will read them.
 *
 * Materials are collected from the mounted graph on first frame and cached.
 * They are not disposed here: `useGLTF` caches the document, and `Clone`
 * shares its materials, so disposing would break any later use of the model.
 */
export function ProductModel({
  model,
  opacity,
}: {
  model: ModelAsset;
  opacity: OpacityRef;
}) {
  const { scene } = useGLTF(model.url);
  const root = useRef<Group>(null);
  const materials = useRef<Material[] | null>(null);

  useFrame(() => {
    const value = opacity.current;
    if (value <= 0.01) return;

    if (!materials.current) {
      const found: Material[] = [];
      root.current?.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        const material = child.material as Material | Material[];
        for (const entry of Array.isArray(material) ? material : [material]) {
          entry.transparent = true;
          found.push(entry);
        }
      });
      if (found.length === 0) return;
      materials.current = found;
    }

    for (const material of materials.current) material.opacity = value;
  });

  return (
    <group ref={root}>
      <Clone
        object={scene}
        scale={model.scale ?? 1}
        position={model.position ?? [0, 0, 0]}
        rotation={model.rotation ?? [0, 0, 0]}
      />
    </group>
  );
}
