import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  DeviceTier,
  ProductThemeId,
  SceneId,
  SceneThemeId,
  ViewportTier,
} from "@/types";

/**
 * Discrete experience state shared by the DOM and the WebGL layer.
 *
 * IMPORTANT — what does NOT belong here:
 *   scroll progress, transition progress, pointer position, camera position,
 *   rotation, elapsed time, or anything else that changes every frame. Those
 *   live in refs and in the module-level transition state (lib/hero/
 *   transition.ts). Writing them here would re-render React at 60fps.
 *
 * `subscribeWithSelector` lets the 3D scene react to product changes
 * imperatively, without subscribing a React component to the store.
 */
export interface ExperienceState {
  currentScene: SceneId;
  activeProduct: ProductThemeId;
  /** Drives the `[data-scene]` attribute and the scene colour tokens. */
  sceneTheme: SceneThemeId;
  /** True once the WebGL experience is ready to be revealed. */
  isLoaded: boolean;
  /** True once the hero entrance sequence has finished. */
  isIntroComplete: boolean;
  /**
   * The product opened into detail, or null while the hero carousel is up.
   *
   * Discrete, so it belongs here; the transition *between* the two states is
   * a scalar on the stage (`heroStage.focus`) and deliberately is not.
   */
  focusedProduct: ProductThemeId | null;
  deviceTier: DeviceTier;
  viewportTier: ViewportTier;
  prefersReducedMotion: boolean;

  setCurrentScene: (scene: SceneId) => void;
  setActiveProduct: (product: ProductThemeId) => void;
  setSceneTheme: (theme: SceneThemeId) => void;
  setLoaded: (isLoaded: boolean) => void;
  setIntroComplete: (isIntroComplete: boolean) => void;
  setFocusedProduct: (product: ProductThemeId | null) => void;
  setDeviceTier: (tier: DeviceTier) => void;
  setViewportTier: (tier: ViewportTier) => void;
  setPrefersReducedMotion: (prefers: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>()(
  subscribeWithSelector((set) => ({
    currentScene: "intro",
    activeProduct: "green",
    sceneTheme: "green",
    isLoaded: false,
    isIntroComplete: false,
    focusedProduct: null,
    deviceTier: "medium",
    viewportTier: "desktop",
    prefersReducedMotion: false,

    setCurrentScene: (currentScene) => set({ currentScene }),
    // The scene theme always follows the active product, so they cannot drift.
    setActiveProduct: (activeProduct) =>
      set({ activeProduct, sceneTheme: activeProduct }),
    setSceneTheme: (sceneTheme) => set({ sceneTheme }),
    setLoaded: (isLoaded) => set({ isLoaded }),
    setIntroComplete: (isIntroComplete) => set({ isIntroComplete }),
    /*
     * Opening a product also makes it the active one, so the scene palette
     * and the carousel agree with what is on screen when detail is closed.
     */
    setFocusedProduct: (focusedProduct) =>
      set(
        focusedProduct
          ? { focusedProduct, activeProduct: focusedProduct, sceneTheme: focusedProduct }
          : { focusedProduct: null },
      ),
    setDeviceTier: (deviceTier) => set({ deviceTier }),
    setViewportTier: (viewportTier) => set({ viewportTier }),
    setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),
  })),
);
