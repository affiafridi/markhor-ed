/**
 * Current markhordrinks.com URLs mapped to the new route structure.
 *
 * Captured during the Phase 1 audit from the live sitemap. These are the
 * pages that already hold search equity; when the redesign goes live they
 * must 301 rather than 404. Feed this into `redirects()` in next.config.ts
 * at cut-over.
 */
export interface LegacyRoute {
  /** Path on the existing WordPress site, including trailing slash. */
  from: string;
  /** Path in the new site. */
  to: string;
}

export const legacyRoutes: LegacyRoute[] = [
  { from: "/brand-ambassadors/", to: "/markhor-era" },
  { from: "/the-markhor-era/", to: "/markhor-era" },
  { from: "/events-activations/", to: "/events" },
  { from: "/distribution/", to: "/distributors" },
  { from: "/contact-us/", to: "/contact" },
  { from: "/certifications/", to: "/about" },
  { from: "/privacy-policy/", to: "/privacy-policy" },
];

/**
 * Live URLs with no home in the new information architecture. They are
 * internal tools (inventory dashboards, staff forms) rather than marketing
 * pages — confirm with the brand before letting any of them 404.
 */
export const unmappedLegacyRoutes: string[] = [
  "/trap/",
  "/employee-form/",
  "/live-inventory/",
  "/inventory-jannat-valley/",
  "/inventory-city-center/",
  "/valley-0334/",
  "/mailing-address/",
  "/signup-page/",
  "/thank-you/",
];
