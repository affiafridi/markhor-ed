import type { Story } from "@/types";

/**
 * News / stories.
 *
 * The current WordPress install has zero published posts — the homepage
 * "Latest news" block is hard-coded inside Elementor. This single entry is the
 * one real story that block contains.
 */
export const stories: Story[] = [
  {
    id: "story-yousaf-razzaq-uae-ambassador",
    slug: "yousaf-razzaq-joins-the-markhor-era",
    title: "Yousaf Razzaq Joins The Markhor Era as UAE Brand Ambassador",
    excerpt:
      "Digital creator Yousaf Razzaq officially joins Markhor Stimulant Drink as the UAE Brand Ambassador, strengthening our presence across the region and expanding The Markhor Era beyond borders.",
    body: null,
    publishedAt: null,
    cover: null,
    seo: undefined,
  },
];
