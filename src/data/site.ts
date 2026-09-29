import type { SiteSettings } from "@/types";

/**
 * Global site settings.
 *
 * Every value here was taken from the live markhordrinks.com site during the
 * Phase 1 audit. Nothing is invented. When WordPress becomes the source of
 * truth this object is replaced by an options/ACF query — the shape stays.
 */
export const siteSettings: SiteSettings = {
  name: "Markhor Drinks",
  legalName: "Markhor Stimulant Drink",
  tagline: "One Nation, One Energy",
  description:
    "Markhor Energy Drink — Pakistan's homegrown energy drink with bold taste and wild power.",
  url: "https://markhordrinks.com",
  logo: null,
  contact: {
    email: "info@markhordrinks.com",
    phones: ["0334 3060000", "091 3060000"],
    address: {
      line1: "2nd Floor Jannat Residency, Near HBK Arena, Ring Road",
      city: "Peshawar",
      country: "Pakistan",
    },
  },
  socials: [
    {
      platform: "facebook",
      href: "https://www.facebook.com/markhordrinks/",
      label: "Markhor Drinks on Facebook",
    },
    {
      platform: "instagram",
      href: "https://www.instagram.com/markhordrinkspk/",
      label: "Markhor Drinks on Instagram",
    },
    {
      platform: "tiktok",
      href: "https://www.tiktok.com/@markhordrinks",
      label: "Markhor Drinks on TikTok",
    },
    {
      platform: "youtube",
      href: "https://www.youtube.com/@MarkhorDrinks",
      label: "Markhor Drinks on YouTube",
    },
    {
      platform: "linkedin",
      href: "https://www.linkedin.com/company/markhor-energy-drink/",
      label: "Markhor Drinks on LinkedIn",
    },
  ],
  defaultSeo: {
    title: "Markhor Drinks | One Nation, One Energy",
    description:
      "Markhor Energy Drink — Pakistan's homegrown energy drink with bold taste and wild power.",
  },
};
