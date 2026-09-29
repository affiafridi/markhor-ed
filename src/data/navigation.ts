import type { Navigation } from "@/types";

/**
 * Site navigation.
 *
 * The header renders this array — labels are never written into components.
 * When WordPress takes over, a menu query replaces this object and the header
 * does not change.
 *
 * `href` values follow the new route map, which differs from the current
 * WordPress URLs; see lib/cms/legacy-routes.ts for the redirects that protect
 * the existing search equity.
 */
export const navigation: Navigation = {
  primary: [
    { label: "Drinks", href: "/products" },
    { label: "The Markhor Era", href: "/markhor-era" },
    { label: "Stories", href: "/stories" },
    { label: "Events", href: "/events" },
    { label: "About", href: "/about" },
  ],
  cta: { label: "Become a Distributor", href: "/distributors" },
  footer: [
    {
      heading: "Brand",
      items: [
        { label: "Drinks", href: "/products" },
        { label: "The Markhor Era", href: "/markhor-era" },
        { label: "About", href: "/about" },
      ],
    },
    {
      heading: "Network",
      items: [
        { label: "Distributors", href: "/distributors" },
        { label: "Events", href: "/events" },
        { label: "Stories", href: "/stories" },
      ],
    },
    {
      heading: "Company",
      items: [
        { label: "Contact", href: "/contact" },
        { label: "Certifications", href: "/about#certifications" },
      ],
    },
  ],
  legal: [{ label: "Privacy Policy", href: "/privacy-policy" }],
};
