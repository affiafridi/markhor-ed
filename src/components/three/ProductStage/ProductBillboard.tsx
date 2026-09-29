"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import {
  DoubleSide,
  SRGBColorSpace,
  type MeshBasicMaterial,
  type ShaderMaterial,
  type Texture,
} from "three";
import { liveTheme } from "@/lib/hero";
import type { Product } from "@/types";
import {
  createReflectionUniforms,
  createSilhouetteUniforms,
  attachMotionBlur,
  FULLSCREEN_VERTEX,
  REFLECTION_FRAGMENT,
  setMotionBlur,
  SILHOUETTE_FRAGMENT,
} from "./materials";
import { PRODUCT_ASPECT, PRODUCT_HEIGHT, type BlurRef, type OpacityRef } from "./types";

/** Gap between the product base and the start of its reflection. */
const REFLECTION_GAP = 0.04;
/** Reflections are foreshortened, which reads as a near-horizontal surface. */
const REFLECTION_SQUASH = 0.55;
const REFLECTION_STRENGTH = 0.26;

/**
 * A product rendered from a transparent pack shot.
 *
 * When a product has no artwork, the same geometry renders the can silhouette
 * as an obscured dark form instead. Nothing about the packaging is invented.
 *
 * Materials are declared rather than constructed, so react-three-fiber
 * disposes them with the component, and every per-frame write goes through a
 * ref.
 */
export function ProductBillboard({
  product,
  opacity,
  blur,
  reflection,
}: {
  product: Product;
  opacity: OpacityRef;
  blur: BlurRef;
  reflection: BlurRef;
}) {
  // Aliased: `reflection` is also the name of the reflection material's
  // uniform block inside the frame loop below.
  const reflectionFade = reflection;
  const hasPackshot = product.packshot !== null;
  const source = product.packshot?.src ?? product.silhouette ?? "";
  const texture = useTexture(source) as Texture;

  const bodyRef = useRef<MeshBasicMaterial>(null);
  const silhouetteRef = useRef<ShaderMaterial>(null);
  const reflectionRef = useRef<ShaderMaterial>(null);

  // Created once; per-frame values are written through the material refs.
  const silhouetteUniforms = useMemo(() => createSilhouetteUniforms(texture), [texture]);
  const reflectionUniforms = useMemo(() => createReflectionUniforms(texture), [texture]);
  /*
   * Runs once, when three compiles the pack shot's material. The uniform it
   * installs is owned by the material rather than by this component — see
   * the note in materials.ts.
   */
  const onBeforeCompile = useCallback(
    (shader: Parameters<typeof attachMotionBlur>[1]) => {
      const material = bodyRef.current;
      if (material) attachMotionBlur(material, shader);
    },
    [],
  );

  const aspect = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    if (!image?.width || !image.height) return PRODUCT_ASPECT;
    return image.width / image.height;
  }, [texture]);

  const width = PRODUCT_HEIGHT * aspect;
  const reflectionHeight = PRODUCT_HEIGHT * REFLECTION_SQUASH;

  useFrame(() => {
    const value = opacity.current;
    if (value <= 0.01) return;

    const body = bodyRef.current;
    if (body) body.opacity = value;
    setMotionBlur(body, blur.current);

    const silhouette = silhouetteRef.current?.uniforms;
    if (silhouette) {
      silhouette.uOpacity!.value = value;
      silhouette.uBlur!.value = blur.current;
      silhouette.uDeep!.value.copy(liveTheme.deep).multiplyScalar(0.45);
      silhouette.uGlow!.value.copy(liveTheme.glow);
    }

    const reflection = reflectionRef.current?.uniforms;
    if (reflection) {
      reflection.uOpacity!.value = value * REFLECTION_STRENGTH * reflectionFade.current;
      reflection.uTint!.value.copy(liveTheme.primary);
      // A photographic product reflects its own colours; a silhouette has
      // none, so it borrows the active theme instead.
      reflection.uTintAmount!.value = hasPackshot ? 0 : 0.8;
    }
  });

  return (
    <>
      <mesh>
        <planeGeometry args={[width, PRODUCT_HEIGHT]} />
        {hasPackshot ? (
          <meshBasicMaterial
            ref={bodyRef}
            map={texture}
            map-colorSpace={SRGBColorSpace}
            map-anisotropy={8}
            onBeforeCompile={onBeforeCompile}
            transparent
            depthWrite={false}
          />
        ) : (
          <shaderMaterial
            ref={silhouetteRef}
            uniforms={silhouetteUniforms}
            vertexShader={FULLSCREEN_VERTEX}
            fragmentShader={SILHOUETTE_FRAGMENT}
            transparent
            depthWrite={false}
          />
        )}
      </mesh>

      <mesh
        position={[0, -PRODUCT_HEIGHT / 2 - REFLECTION_GAP - reflectionHeight / 2, 0]}
      >
        <planeGeometry args={[width, reflectionHeight]} />
        <shaderMaterial
          ref={reflectionRef}
          uniforms={reflectionUniforms}
          vertexShader={FULLSCREEN_VERTEX}
          fragmentShader={REFLECTION_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </>
  );
}
