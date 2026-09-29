import type { Metadata } from "next";
import { siteSettings } from "@/data";
import { getSiteUrl, isIndexable } from "./site-url";

export interface PageMetadataInput {
  title?: string;
  description?: string;
  /** Route path, e.g. "/products/markhor-green". Used for the canonical URL. */
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Builds page metadata from the site settings.
 *
 * Copy is never invented here: the defaults are the title and description the
 * brand already publishes. Pages override only what they genuinely have.
 */
export function buildMetadata(input: PageMetadataInput = {}): Metadata {
  const siteUrl = getSiteUrl();
  const { defaultSeo, name, tagline } = siteSettings;

  const title = input.title ?? defaultSeo.title;
  const description = input.description ?? defaultSeo.description;
  const path = input.path ?? "/";
  const canonical = new URL(path, siteUrl).toString();
  const shouldIndex = isIndexable() && !input.noIndex;

  const images = input.ogImage ? [{ url: input.ogImage }] : undefined;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    applicationName: name,
    alternates: { canonical },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: { index: shouldIndex, follow: shouldIndex },
    },
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description,
      url: canonical,
      locale: "en_US",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
    other: { "brand:tagline": tagline },
  };
}
