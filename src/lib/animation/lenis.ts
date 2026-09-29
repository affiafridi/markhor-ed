import type Lenis from "lenis";

/**
 * Module-level handle on the single Lenis instance, exposed as a tiny
 * subscribable store.
 *
 * Lenis is an imperative object with its own lifecycle, so React should not
 * own it in state — it subscribes to it instead (see SmoothScrollProvider,
 * which reads this through `useSyncExternalStore`). Non-React code such as
 * GSAP callbacks can call `getLenis()` directly.
 */
let instance: Lenis | null = null;
const listeners = new Set<() => void>();

export function setLenis(next: Lenis | null): void {
  if (instance === next) return;
  instance = next;
  for (const listener of listeners) listener();
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Server snapshot: there is never a Lenis instance during SSR. */
export function getLenisServerSnapshot(): null {
  return null;
}

export function subscribeLenis(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
}

/**
 * Scrolls to an element or absolute position.
 *
 * Falls back to native scrolling when Lenis is not mounted — which is the
 * case under `prefers-reduced-motion`, so anchor links keep working.
 */
export function scrollTo(
  target: string | number | HTMLElement,
  options: ScrollToOptions = {},
): void {
  const lenis = getLenis();

  if (lenis) {
    lenis.scrollTo(target, options);
    return;
  }

  if (typeof window === "undefined") return;

  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "auto" });
    return;
  }

  const element = typeof target === "string" ? document.querySelector(target) : target;

  element?.scrollIntoView({ behavior: "auto", block: "start" });
}
