import type { ProductThemeId } from "@/types";

/**
 * Which design token each product theme maps onto.
 *
 * These are CSS custom property *names*, never colour values. tokens.css
 * stays the single source of truth; the animation layer resolves these names
 * at runtime (see lib/hero/theme.ts). Changing a brand colour is a one-line
 * edit in tokens.css and nothing else.
 */
export interface ProductThemeTokens {
  primary: string;
  deep: string;
  glow: string;
  accent: string;
}

export const PRODUCT_THEME_TOKENS: Record<ProductThemeId, ProductThemeTokens> = {
  green: {
    primary: "--markhor-green",
    deep: "--markhor-green-dark",
    glow: "--markhor-green-glow",
    accent: "--accent-orange",
  },
  king: {
    primary: "--king-red",
    deep: "--king-red-dark",
    glow: "--king-red-glow",
    accent: "--accent-gold",
  },
  next: {
    primary: "--next-steel",
    deep: "--next-steel-dark",
    glow: "--next-steel-glow",
    accent: "--accent-gold",
  },
};
