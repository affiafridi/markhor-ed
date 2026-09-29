/** Shared building blocks used by every content type. */

/** URL-safe identifier, e.g. "markhor-green". */
export type Slug = string;

/** ISO-8601 date string, e.g. "2026-04-24". */
export type ISODateString = string;

/**
 * HTML produced by the CMS. Kept nominally distinct from `string` so that
 * anywhere we render it, the need to sanitise is obvious at the call site.
 */
export type RichText = string;

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Base64 LQIP, supplied by the CMS or a build step. */
  blurDataURL?: string;
}

export interface VideoAsset {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
}

/** A GLB/GLTF product model plus the transform it expects in a scene. */
export interface ModelAsset {
  /** Path under /public/models, or an absolute CMS URL. */
  url: string;
  scale?: number;
  /** Radians. */
  rotation?: [number, number, number];
  position?: [number, number, number];
}

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: ImageAsset;
  canonical?: string;
  noIndex?: boolean;
}

/** Every CMS-backed record carries a stable id and a routable slug. */
export interface ContentEntry {
  id: string;
  slug: Slug;
}
