"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "../CameraRig";
import { Effects } from "../Effects";
import { SceneEnvironment } from "../Environment";
import { Lighting } from "../Lighting";
import { Scene } from "../Scene";
import { QUALITY } from "@/lib/three";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import styles from "./ExperienceCanvas.module.css";

/**
 * The single, persistent WebGL canvas for the entire site.
 *
 * There is exactly one of these. Sections do not own canvases — they drive
 * this one through the experience store and GSAP. That is what allows a
 * product to travel between scenes instead of being re-created per section.
 *
 * The canvas fades up once the stage reports ready (which waits on the
 * product textures, since ProductStage sits inside the Suspense boundary), so
 * the reveal lands on a finished image rather than an empty scene.
 *
 * Default-exported because it is loaded with `next/dynamic({ ssr: false })`
 * from Experience.tsx, which keeps three.js out of the server bundle.
 */
export default function ExperienceCanvas() {
  const deviceTier = useExperienceStore((state) => state.deviceTier);
  const isLoaded = useExperienceStore((state) => state.isLoaded);
  const quality = QUALITY[deviceTier];

  return (
    /*
     * Decorative: every piece of information the scene expresses also exists
     * as real text in the DOM, so screen readers skip the canvas entirely.
     */
    <div className={cn(styles.root, isLoaded && styles.ready)} aria-hidden="true">
      <Canvas
        dpr={quality.dpr}
        frameloop="always"
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Lighting />
          <SceneEnvironment />
          <Scene />
          <Effects enabled={quality.postprocessing} />
        </Suspense>
      </Canvas>
    </div>
  );
}
