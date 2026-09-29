import type {
  Ambassador,
  BrandEvent,
  Navigation,
  Product,
  SiteSettings,
  Story,
} from "@/types";

/**
 * The single contract between the site and its content.
 *
 * Components never import from `@/data` directly — they receive data as props
 * from a page, and pages read through this interface. Swapping the local
 * source for a WordPress one is therefore a one-line change in `index.ts`,
 * with no component edits.
 *
 * Every method is async even though the local implementation is synchronous.
 * That is the point: call sites are already written for a network source.
 */
export interface ContentSource {
  readonly name: string;

  getSiteSettings(): Promise<SiteSettings>;
  getNavigation(): Promise<Navigation>;

  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;

  getAmbassadors(): Promise<Ambassador[]>;
  getEvents(): Promise<BrandEvent[]>;

  getStories(): Promise<Story[]>;
  getStoryBySlug(slug: string): Promise<Story | null>;
}
