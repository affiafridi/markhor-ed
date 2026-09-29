import type { Product } from "@/types";

/**
 * Product catalogue. The hero carousel renders this array in `order`.
 *
 * Every string here is taken from real Markhor material — the pack shot
 * artwork itself ("THE WILD POWER", "STIMULANT DRINK", "250 ML") or the
 * brand's own briefing. Nothing is invented.
 *
 * Asset status (see README):
 *   green — real pack shot, isolated from the brand's official 3-can render
 *   king  — cut from a supplied photograph of the real can (see README);
 *           lower resolution than green until a studio render exists
 *   next  — unannounced; silhouette by design
 *
 * When real artwork arrives, set `packshot` (or `model`) on the product and
 * the hero picks it up with no component changes.
 */
export const products: Product[] = [
  {
    id: "product-markhor-green",
    slug: "markhor-green",
    name: "Markhor Green",
    shortName: "Green",
    displayName: "MARKHOR",
    tagline: "The Wild Power",
    description: null,
    theme: "green",
    status: "available",
    packshot: {
      src: "/products/green/images/markhor-green-can.webp",
      alt: "Markhor Green 250 ml stimulant drink can",
      width: 532,
      height: 1425,
    },
    model: null,
    silhouette: "/products/can-silhouette.png",
    specs: [
      { label: "Net Quantity", value: 250, unit: "ml" },
      { label: "Energy", value: 45, unit: "kcal" },
      { label: "Taurine", value: 400, unit: "mg" },
    ],
    order: 0,
  },
  {
    id: "product-markhor-king",
    slug: "markhor-king",
    name: "Markhor King",
    shortName: "King",
    displayName: "KING",
    tagline: "Original Energy",
    description: null,
    theme: "king",
    status: "available",
    packshot: {
      src: "/products/king/images/markhor-king-can.webp",
      alt: "Markhor King 250 ml stimulant drink can",
      width: 532,
      height: 1425,
    },
    model: null,
    silhouette: "/products/can-silhouette.png",
    specs: [
      { label: "Net Quantity", value: null, unit: "ml" },
      { label: "Energy", value: null, unit: "kcal" },
      { label: "Taurine", value: null, unit: "mg" },
    ],
    order: 1,
  },
  {
    id: "product-next",
    slug: "next",
    // Not a product name — the brand has not announced one.
    name: "Coming Soon",
    shortName: "Coming Soon",
    displayName: "COMING SOON",
    tagline: "The Next Era",
    description: null,
    theme: "next",
    status: "coming-soon",
    packshot: null,
    model: null,
    silhouette: "/products/can-silhouette.png",
    specs: [],
    order: 2,
  },
];

/** Carousel order, guaranteed. */
export const orderedProducts: Product[] = [...products].sort((a, b) => a.order - b.order);
