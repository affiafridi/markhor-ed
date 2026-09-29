"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import {
  applyFocus,
  CAMERA_DISTANCE,
  damp,
  getStageTransform,
  heroStage,
  wrapOffset,
} from "@/lib/hero";
import { CAMERA } from "@/lib/three";
import type { Product, ViewportTier } from "@/types";
import { ProductBillboard } from "./ProductBillboard";
import { ProductModel } from "./ProductModel";
import {
  PRODUCT_ASPECT,
  PRODUCT_HEIGHT,
  STAGE_Y,
  type BlurRef,
  type OpacityRef,
} from "./types";

/** Smoothing factors — the fraction of the gap still left after one second. */
const HOVER_SMOOTHING = 0.002;
const POINTER_SMOOTHING = 0.0015;

/** How far a product recedes at full transition speed, in world units. */
const TRAVEL_DEPTH = 0.42;
/** How far it leans into the direction of travel, in radians. */
const TRAVEL_LEAN = 0.13;
/** Speeds above this stop adding to the effect. */
const MAX_SPEED = 2.6;

/** How far the centred product follows the cursor. */
const POINTER_SHIFT_X = 0.1;
const POINTER_SHIFT_Y = 0.06;
const POINTER_TURN = 0.19;

/**
 * Hover adds a slow sway on top of the cursor response.
 *
 * Small on purpose. These are rotations in radians, and a can is a heavy
 * object: past about a degree the roll stops reading as the product noticing
 * the cursor and starts reading as something hanging from a string. The yaw
 * is allowed roughly twice the roll, because turning towards the viewer is
 * the part worth seeing.
 */
const HOVER_SWAY_Y = 0.018;
const HOVER_SWAY_Z = 0.008;
const HOVER_SCALE = 0.03;

/**
 * Fraction of the viewport height the selected product fills in detail.
 *
 * About 1.6x its hero size on desktop. Derived from the frustum rather than
 * fixed, so the can holds the same share of the frame on a laptop and on an
 * ultrawide instead of being tuned for one resolution. Leaned eighteen
 * degrees it then stands taller than the viewport and crops top and bottom,
 * which is intended — a product shot that fits entirely inside the frame
 * with room to spare reads as a catalogue image.
 */
const DETAIL_HEIGHT_FRACTION: Record<ViewportTier, number> = {
  desktop: 1,
  tablet: 0.88,
  mobile: 0.74,
};

/**
 * How far right of centre the detail composition sits, as a fraction of the
 * frame's half-width. The copy holds the left, so the product takes the
 * centre-right; on a phone there is no room for that and it stays centred.
 */
const DETAIL_X_FRACTION: Record<ViewportTier, number> = {
  desktop: 0.4,
  tablet: 0.2,
  mobile: 0,
};

/** Mirrors DETAIL_Z in lib/hero/focus.ts, for computing that scale. */
const DETAIL_Z = 0.55;

interface ProductVisualProps {
  product: Product;
  index: number;
  total: number;
  tier: ViewportTier;
  reducedMotion: boolean;
}

/**
 * One product on the stage.
 *
 * Placement only — it reads the shared stage state every frame and derives
 * its own transform, so position, depth, scale, rotation and opacity can
 * never drift apart.
 *
 * Three things move it, and they compose rather than compete:
 *
 *   the stage     where the carousel says it belongs
 *   the travel    it recedes and leans while the stage is moving, so a
 *                 transition reads as an object with weight being carried
 *                 across rather than a value being interpolated
 *   the cursor    the centred product turns and drifts towards the pointer,
 *                 and sways gently when the pointer is actually over it
 *   the focus     the hero-to-detail move, which overrides the other three
 *                 as it takes hold — see lib/hero/focus.ts
 *
 * Hover is resolved by projecting the product's own bounds to the screen
 * rather than by raycasting. Raycasting would mean letting the canvas take
 * pointer events, and the hero needs those for its drag.
 */
export function ProductVisual({
  product,
  index,
  total,
  tier,
  reducedMotion,
}: ProductVisualProps) {
  const group = useRef<Group>(null);
  // Written here, read by whichever renderer is mounted below. Kept in a ref
  // so a fading product never triggers a React render.
  const opacity: OpacityRef = useRef(1);
  /** Directional blur for the renderer below, in texture UV units. */
  const blur: BlurRef = useRef(0);
  /** How much floor reflection survives; the detail composition has none. */
  const reflection: BlurRef = useRef(1);
  const hover = useRef(0);
  const pointerX = useRef(0);
  const pointerY = useRef(0);

  useFrame(({ clock, size }, delta) => {
    const node = group.current;
    if (!node) return;

    const base = getStageTransform(index, heroStage.position, total, tier);
    const offset = wrapOffset(index, heroStage.position, total);
    /** 1 when this product holds the centre, 0 once it reaches a side slot. */
    const centred = 1 - Math.min(Math.abs(offset), 1);

    /* ---- focus ------------------------------------------------------- */
    const isSelected = heroStage.focusIndex === index;
    const halfHeightAt = (z: number) =>
      Math.tan((CAMERA.fov * Math.PI) / 360) * (CAMERA_DISTANCE[tier] - z);
    const aspect = size.width / Math.max(size.height, 1);

    const transform = applyFocus(base, {
      focus: heroStage.focus,
      isSelected,
      exitSign: heroStage.exitSigns[index] ?? 1,
      halfWidth: halfHeightAt(base.z) * aspect,
      productHalfWidth: PRODUCT_HEIGHT * PRODUCT_ASPECT * base.scale * 0.5,
      detailScale:
        (2 * halfHeightAt(DETAIL_Z) * DETAIL_HEIGHT_FRACTION[tier]) / PRODUCT_HEIGHT,
      detailX: halfHeightAt(DETAIL_Z) * aspect * DETAIL_X_FRACTION[tier],
    });

    /*
     * Everything reactive winds down as the move takes over. A can on its
     * way out of frame that is still leaning towards the cursor reads as two
     * animations fighting, and the detail product has to hold still.
     */
    const live = 1 - heroStage.focus;

    /* ---- cursor ------------------------------------------------------ */
    const targetX = heroStage.hasPointer && !reducedMotion ? heroStage.pointerX : 0;
    const targetY = heroStage.hasPointer && !reducedMotion ? heroStage.pointerY : 0;
    pointerX.current += (targetX - pointerX.current) * damp(POINTER_SMOOTHING, delta);
    pointerY.current += (targetY - pointerY.current) * damp(POINTER_SMOOTHING, delta);

    /* ---- hover ------------------------------------------------------- */
    let wantsHover = 0;
    if (
      heroStage.hasPointer &&
      !heroStage.isDragging &&
      heroStage.focus <= 0 &&
      transform.opacity > 0.3
    ) {
      const halfHeight =
        Math.tan((CAMERA.fov * Math.PI) / 360) * (CAMERA_DISTANCE[tier] - transform.z);
      const halfWidth = halfHeight * (size.width / Math.max(size.height, 1));
      const centreX = transform.x / halfWidth;
      const centreY = (transform.y + STAGE_Y) / halfHeight;
      const boxX = (PRODUCT_HEIGHT * PRODUCT_ASPECT * transform.scale * 0.5) / halfWidth;
      const boxY = (PRODUCT_HEIGHT * transform.scale * 0.5) / halfHeight;

      if (
        Math.abs(heroStage.pointerX - centreX) < boxX &&
        Math.abs(heroStage.pointerY - centreY) < boxY
      ) {
        wantsHover = 1;
        /*
         * Publish the claim so the DOM can turn a click into a selection
         * without the canvas ever taking pointer events — it must not, or
         * the hero's drag stops working (see ExperienceCanvas.module.css).
         *
         * Nearest wins, because the side products overlap the centre one at
         * narrow viewports and the front can is the one being pointed at.
         */
        if (transform.z > heroStage.hoverDepth) {
          heroStage.hoverDepth = transform.z;
          heroStage.hoverIndex = index;
        }
      }
    }
    hover.current += (wantsHover - hover.current) * damp(HOVER_SMOOTHING, delta);
    const hovered = reducedMotion ? 0 : hover.current;

    /* ---- travel ------------------------------------------------------ */
    // Reduced motion keeps the short positional move but not the extra
    // depth and lean layered on top of it.
    const velocity = reducedMotion
      ? 0
      : Math.max(-MAX_SPEED, Math.min(MAX_SPEED, heroStage.velocity));
    const speed = Math.abs(velocity) / MAX_SPEED;
    // Strongest on whichever product currently holds the centre, so the stage
    // dips away from the camera mid-move and returns as it settles.
    const recede = speed * TRAVEL_DEPTH * centred;
    const lean = (velocity / MAX_SPEED) * TRAVEL_LEAN;

    /* ---- idle -------------------------------------------------------- */
    const time = clock.elapsedTime;
    const drift = reducedMotion ? 0 : Math.sin(time * 0.42 + index * 2.1) * 0.024;
    const sway = reducedMotion ? 0 : Math.sin(time * 0.27 + index * 1.3) * 0.014;
    const swayY = Math.sin(time * 1.9 + index) * HOVER_SWAY_Y * hovered;
    const swayZ = Math.sin(time * 2.7 + index * 1.7) * HOVER_SWAY_Z * hovered;

    node.position.set(
      transform.x + pointerX.current * POINTER_SHIFT_X * centred * live,
      transform.y + (drift + pointerY.current * POINTER_SHIFT_Y * centred) * live,
      transform.z - recede * live,
    );
    node.scale.setScalar(transform.scale * (1 + hovered * HOVER_SCALE * live));
    node.rotation.y =
      transform.rotationY +
      (sway + swayY + lean + pointerX.current * POINTER_TURN * centred) * live;
    node.rotation.z = transform.tiltZ + (swayZ - lean * 0.35) * live;

    if (isSelected) {
      // Published for the DOM layers that sit over the product.
      heroStage.detailX = transform.x;
      heroStage.detailY = transform.y;
      heroStage.detailScale = transform.scale;
      heroStage.detailTilt = transform.tiltZ;
    }

    opacity.current = transform.opacity;
    blur.current = transform.blur;
    reflection.current = transform.reflection;
    // Skip the draw entirely once a product has faded out.
    node.visible = transform.opacity > 0.01;
  });

  return (
    <group ref={group} name={`product-${product.slug}`}>
      {product.model ? (
        <ProductModel model={product.model} opacity={opacity} />
      ) : (
        <ProductBillboard
          product={product}
          opacity={opacity}
          blur={blur}
          reflection={reflection}
        />
      )}
    </group>
  );
}
