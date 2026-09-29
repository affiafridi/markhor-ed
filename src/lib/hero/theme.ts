import { Color } from "three";
import { PRODUCT_THEME_TOKENS } from "@/data/product-themes";
import type { ProductThemeId } from "@/types";

export interface ThemeColors {
  primary: Color;
  accent: Color;
  glow: Color;
  deep: Color;
}

type ThemeKey = keyof ThemeColors;

const KEYS: readonly ThemeKey[] = ["primary", "accent", "glow", "deep"];

/**
 * SSR fallback only, mirroring the `base` block of tokens.css. The canvas is
 * client-only, so this is used for at most one render.
 */
const FALLBACK = "#0e492c";

const cache = new Map<ProductThemeId, ThemeColors>();

/**
 * Resolves a product theme from the CSS custom properties into THREE.Colors.
 *
 * This is what keeps one palette across DOM and WebGL: tokens.css holds the
 * values, product-themes.ts maps each product to token *names*, and this
 * reads them. No colour is written in the animation layer.
 *
 * Memoised — the brand palette is static, so each theme is read once rather
 * than on every transition frame.
 */
export function resolveTheme(id: ProductThemeId): ThemeColors {
  const cached = cache.get(id);
  if (cached) return cached;

  const tokens = PRODUCT_THEME_TOKENS[id];
  const styles =
    typeof window === "undefined" ? null : getComputedStyle(document.documentElement);

  const read = (name: string): Color =>
    new Color(styles?.getPropertyValue(name).trim() || FALLBACK);

  const resolved: ThemeColors = {
    primary: read(tokens.primary),
    accent: read(tokens.accent),
    glow: read(tokens.glow),
    deep: read(tokens.deep),
  };

  // Only cache once the DOM could actually answer.
  if (styles) cache.set(id, resolved);
  return resolved;
}

/**
 * The live, interpolated palette used by the 3D scene.
 *
 * Mutated in place and read inside `useFrame`. Deliberately not React state.
 *
 * The DOM half of the palette is handled by CSS: the `--scene-*` tokens are
 * registered with `@property` as `<color>` and carry a transition, so the
 * browser interpolates them natively when `[data-scene]` changes. Both halves
 * use the same duration and easing, so they move together.
 */
export const liveTheme: ThemeColors = {
  primary: new Color(FALLBACK),
  accent: new Color(FALLBACK),
  glow: new Color(FALLBACK),
  deep: new Color(FALLBACK),
};

/**
 * Blends the palette between the two products either side of `position`.
 *
 * Because it is derived from the same scalar that drives product movement,
 * lighting, atmosphere and floor reflection can never lag behind the products
 * they belong to.
 */
export function mixLiveTheme(position: number, themes: readonly ProductThemeId[]): void {
  const total = themes.length;
  if (total === 0) return;

  const base = Math.floor(position);
  const t = position - base;
  const indexOf = (n: number) => ((n % total) + total) % total;

  const fromId = themes[indexOf(base)];
  const toId = themes[indexOf(base + 1)];
  if (!fromId || !toId) return;

  const from = resolveTheme(fromId);
  const to = resolveTheme(toId);

  for (const key of KEYS) {
    liveTheme[key].copy(from[key]).lerp(to[key], t);
  }
}
