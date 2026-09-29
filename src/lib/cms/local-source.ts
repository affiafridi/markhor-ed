import {
  ambassadors,
  brandEvents,
  navigation,
  products,
  siteSettings,
  stories,
} from "@/data";
import type { ContentSource } from "./types";

const bySlug = <T extends { slug: string }>(items: T[], slug: string): T | null =>
  items.find((item) => item.slug === slug) ?? null;

const byOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/**
 * Typed local content, used for the approval build. Mirrors exactly what a
 * WordPress source will return, so pages behave identically against both.
 */
export const localSource: ContentSource = {
  name: "local",

  getSiteSettings: async () => siteSettings,
  getNavigation: async () => navigation,

  getProducts: async () => byOrder(products),
  getProductBySlug: async (slug) => bySlug(products, slug),

  getAmbassadors: async () => byOrder(ambassadors),
  getEvents: async () => brandEvents,

  getStories: async () => stories,
  getStoryBySlug: async (slug) => bySlug(stories, slug),
};
