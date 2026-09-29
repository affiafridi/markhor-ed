import type { ImageAsset, SeoMeta } from "./primitives";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export interface Navigation {
  primary: NavItem[];
  /** The single header call to action. */
  cta: NavItem;
  footer: NavGroup[];
  legal: NavItem[];
}

export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
  label: string;
}

export interface PostalAddress {
  line1: string;
  city: string;
  country: string;
}

export interface ContactDetails {
  email: string;
  phones: string[];
  address: PostalAddress;
}

/**
 * Everything the CMS will eventually own as "site options": the values here
 * are referenced by the header, footer, contact blocks and JSON-LD.
 */
export interface SiteSettings {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  logo: ImageAsset | null;
  contact: ContactDetails;
  socials: SocialLink[];
  defaultSeo: SeoMeta;
}
