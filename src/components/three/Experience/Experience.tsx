"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry point for the WebGL layer.
 *
 * `ssr: false` is what keeps three.js out of the server render and prevents
 * hydration mismatches — the canvas simply does not exist until the browser
 * has mounted. Rendering nothing as the fallback is intentional: the page is
 * fully readable without WebGL.
 */
const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => null,
});

export function Experience() {
  return <ExperienceCanvas />;
}
