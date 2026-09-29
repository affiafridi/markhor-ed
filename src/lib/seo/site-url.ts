/**
 * Absolute base URL for this deployment.
 *
 * Not hard-coded to markhordrinks.com: the approval build runs on a preview
 * origin, and canonical/OG URLs must match wherever it is actually served.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

/**
 * Whether this deployment should be indexed.
 *
 * Defaults to false. The pre-approval build must never be indexed while the
 * current WordPress site is still the live one — two competing copies of the
 * same brand content would damage the existing rankings.
 */
export function isIndexable(): boolean {
  return process.env.NEXT_PUBLIC_SITE_ENV === "production";
}
