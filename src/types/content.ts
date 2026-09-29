import type { ProductThemeId } from "./experience";
import type {
  ContentEntry,
  ISODateString,
  ImageAsset,
  ModelAsset,
  RichText,
  SeoMeta,
  VideoAsset,
} from "./primitives";

/**
 * A single declared nutrition/spec figure. `value` is nullable because the
 * brand has not published figures for every SKU yet — the UI renders a
 * placeholder rather than a fabricated number.
 */
export interface SpecFact {
  label: string;
  value: number | null;
  unit: string;
}

/**
 * Whether the brand has published this product yet. `coming-soon` products
 * render as an obscured silhouette — never as invented packaging.
 */
export type ProductStatus = "available" | "coming-soon";

export interface Product extends ContentEntry {
  /** Full product name, e.g. "Markhor Green". */
  name: string;
  /** Short form used in tight UI, e.g. "Green". */
  shortName: string;
  /** Headline shown in the hero, e.g. "MARKHOR". */
  displayName: string;
  tagline: string | null;
  description: RichText | null;
  /** Selects the scene palette and lighting for this product. */
  theme: ProductThemeId;
  status: ProductStatus;
  packshot: ImageAsset | null;
  model: ModelAsset | null;
  /**
   * Alpha mask used when no pack shot exists. Renders as an unlit dark form,
   * which communicates "not yet revealed" without implying a design.
   */
  silhouette: string | null;
  specs: SpecFact[];
  /** Carousel position. Also the order products appear in every list. */
  order: number;
  seo?: SeoMeta;
}

export type AmbassadorCategory =
  "sport" | "fitness" | "entertainment" | "gaming" | "digital";

export interface Ambassador extends ContentEntry {
  name: string;
  /** e.g. "UAE Brand Ambassador". Null when the brand has not stated one. */
  role: string | null;
  region: string | null;
  category: AmbassadorCategory | null;
  portrait: ImageAsset | null;
  bio: RichText | null;
  order: number;
}

export type BrandEventKind =
  "sports" | "music" | "youth" | "social-impact" | "activation";

export interface BrandEvent extends ContentEntry {
  title: string;
  kind: BrandEventKind;
  location: string | null;
  date: ISODateString | null;
  summary: string | null;
  gallery: ImageAsset[];
}

export interface Story extends ContentEntry {
  title: string;
  excerpt: string | null;
  body: RichText | null;
  publishedAt: ISODateString | null;
  cover: ImageAsset | null;
  video?: VideoAsset;
  seo?: SeoMeta;
}

export interface DistributorRegion extends ContentEntry {
  name: string;
  country: string;
  cities: string[];
}

export interface Certification extends ContentEntry {
  name: string;
  issuer: string | null;
  document: ImageAsset | null;
}
