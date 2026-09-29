import { localSource } from "./local-source";
import type { ContentSource } from "./types";

/**
 * The active content source.
 *
 * Phase 2+ adds a `wordpress-source.ts` implementing the same interface
 * against the WP REST or WPGraphQL endpoint, and this becomes:
 *
 *   export const cms: ContentSource =
 *     process.env.CMS_SOURCE === "wordpress" ? wordpressSource : localSource;
 *
 * Nothing above this file needs to change.
 */
export const cms: ContentSource = localSource;

export type { ContentSource } from "./types";
