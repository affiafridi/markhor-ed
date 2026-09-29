import type { Ambassador } from "@/types";

/**
 * Ambassadors named on markhordrinks.com.
 *
 * Roles and regions are only filled in where the site actually states them
 * (mostly on The Markhor Era page). Portraits are null — no brand imagery has
 * been copied into this project.
 *
 * Note for the brand team: the live site spells some names inconsistently
 * across pages ("Taimour"/"Tamour" Mirza, "FB Metal"/"FB Metall"). The
 * spellings below need confirming before launch.
 */
export const ambassadors: Ambassador[] = [
  {
    id: "ambassador-shahid-afridi",
    slug: "shahid-afridi",
    name: "Shahid Afridi",
    role: "Brand Ambassador",
    region: null,
    category: "sport",
    portrait: null,
    bio: null,
    order: 0,
  },
  {
    id: "ambassador-yousaf-razzaq",
    slug: "yousaf-razzaq",
    name: "Yousaf Razzaq",
    role: "UAE Brand Ambassador",
    region: "United Arab Emirates",
    category: "digital",
    portrait: null,
    bio: null,
    order: 1,
  },
  {
    id: "ambassador-ijaz-ahmad",
    slug: "ijaz-ahmad",
    name: "Ijaz Ahmad",
    role: "Fitness Ambassador",
    region: null,
    category: "fitness",
    portrait: null,
    bio: null,
    order: 2,
  },
  {
    id: "ambassador-taimour-mirza",
    slug: "taimour-mirza",
    name: "Taimour Mirza",
    role: "Tape Ball Cricket Ambassador",
    region: null,
    category: "sport",
    portrait: null,
    bio: null,
    order: 3,
  },
  {
    id: "ambassador-zunair-kamboh",
    slug: "zunair-kamboh",
    name: "Zunair Kamboh",
    role: null,
    region: null,
    category: null,
    portrait: null,
    bio: null,
    order: 4,
  },
  {
    id: "ambassador-baba-chee",
    slug: "baba-chee",
    name: "Baba Chee",
    role: "Balochistan TikTok Ambassador",
    region: "Balochistan",
    category: "digital",
    portrait: null,
    bio: null,
    order: 5,
  },
  {
    id: "ambassador-raja-umar",
    slug: "raja-umar",
    name: "Raja Umar",
    role: "Sindh TikTok Ambassador",
    region: "Sindh",
    category: "digital",
    portrait: null,
    bio: null,
    order: 6,
  },
  {
    id: "ambassador-fb-metal",
    slug: "fb-metal",
    name: "FB Metal",
    role: "Gaming & Esports Ambassador",
    region: null,
    category: "gaming",
    portrait: null,
    bio: null,
    order: 7,
  },
];
