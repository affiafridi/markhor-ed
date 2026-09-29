import { Archivo } from "next/font/google";

/**
 * One family, two roles.
 *
 * FONT CHOICE IS NOT FINAL. The live site pairs Montserrat with a licensed
 * display face ("VeniteAdoremus"). This is chosen to sit in the right
 * territory until the brand team supplies the official files.
 *
 * To adopt the real brand fonts:
 *   1. drop the files into /public/fonts
 *   2. register them here with next/font/local, exposing a CSS variable
 *   3. repoint --font-display / --font-sans in src/styles/typography.css
 * No component changes are needed — every role reads from the type tokens.
 *
 * Archivo is a grotesque with flat terminals and squared bowls, drawn for
 * both small-size legibility and heavy display use. The display roles take
 * it at weight 900 in italic, which is the treatment the category runs on:
 * the slant is doing most of the work, and it is why a single family can
 * carry the hero statement and the navigation without them looking alike.
 *
 * The italic is real, not synthesised — which is the reason for choosing a
 * family that has one. A browser-slanted upright shears the counters and
 * falls apart at hero scale, where the letterforms are 300px tall.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
});
