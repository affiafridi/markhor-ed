"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { orderedProducts } from "@/data/products";
import {
  damp,
  heroStage,
  mixLiveTheme,
  nearestPositionFor,
  themePosition,
} from "@/lib/hero";
import { useExperienceStore } from "@/store";
import type { ProductThemeId } from "@/types";
import { ProductGlow } from "./ProductGlow";
import { ProductVisual } from "./ProductVisual";
import { STAGE_Y } from "./types";

/**
 * Advances the shared per-frame state, before anything reads it.
 *
 * Three jobs: mix the palette, clear the hover claim so the products can
 * re-make it, and differentiate the stage position into a smoothed velocity.
 * Rendered as the first child so its `useFrame` subscribes first, and kept
 * separate so all three are computed once rather than once per product.
 */
function StageDriver({ themes }: { themes: readonly ProductThemeId[] }) {
  const previous = useRef(heroStage.position);

  useFrame((_, delta) => {
    /*
     * The atmosphere follows the *focused* product, not the carousel.
     *
     * `position` is frozen during a focus move — see the note on
     * heroStage.focus — so a side product opened into detail would otherwise
     * stand in the previous product's colour. This walks the palette across
     * to it instead, on the same scalar as the move.
     */
    mixLiveTheme(
      themePosition(
        heroStage.position,
        heroStage.focus,
        heroStage.focusIndex < 0
          ? heroStage.position
          : nearestPositionFor(heroStage.focusIndex, heroStage.position, themes.length),
      ),
      themes,
    );

    /*
     * Clear last frame's hover claim before any product can make a new one.
     * This runs first because it is rendered first, which is the same reason
     * the velocity below is safe to read from every product afterwards.
     */
    heroStage.hoverIndex = -1;
    heroStage.hoverDepth = -Infinity;

    const step = Math.max(delta, 1 / 240);
    const raw = (heroStage.position - previous.current) / step;
    previous.current = heroStage.position;
    // Smoothed, or a single long frame would read as a violent lurch.
    heroStage.velocity += (raw - heroStage.velocity) * damp(0.00005, delta);
  });

  return null;
}

/**
 * The hero's product stage.
 *
 * Holds no copy and no interaction logic — it maps the product catalogue onto
 * the scene and lets each product place itself from the shared stage
 * position. Adding a fourth product is a data change.
 */
export function ProductStage() {
  const tier = useExperienceStore((state) => state.viewportTier);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);
  const setLoaded = useExperienceStore((state) => state.setLoaded);

  /*
   * This component sits inside the canvas Suspense boundary and its children
   * suspend on their textures, so by the time this effect runs the products
   * are actually drawable. That is the signal the hero entrance waits for.
   */
  useEffect(() => {
    setLoaded(true);
  }, [setLoaded]);

  const products = orderedProducts;
  const themes = useMemo<ProductThemeId[]>(
    () => products.map((product) => product.theme),
    [products],
  );

  return (
    <group name="product-stage" position={[0, STAGE_Y, 0]}>
      <StageDriver themes={themes} />
      <ProductGlow />

      {products.map((product, index) => (
        <ProductVisual
          key={product.id}
          product={product}
          index={index}
          total={products.length}
          tier={tier}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
