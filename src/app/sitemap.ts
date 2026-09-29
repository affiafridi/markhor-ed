import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/**
 * Sitemap.
 *
 * Only the routes that actually exist are listed — currently just the home
 * page. As Phase 2 adds routes, and as products/stories start coming from the
 * CMS, this becomes an async function that awaits `cms.getProducts()` and
 * `cms.getStories()` to emit their detail URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
