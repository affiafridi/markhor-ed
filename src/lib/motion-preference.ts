/**
 * Motion preference override.
 *
 * The site follows `prefers-reduced-motion` and always should — that is the
 * default and nothing here changes it. This adds one escape hatch on top:
 *
 *   ?motion=full     force the full experience on, and remember it
 *   ?motion=system   clear the override, back to the OS setting
 *
 * It exists because the OS switch is global. Someone who keeps Reduce Motion
 * on for everyday comfort — and anyone reviewing a build on a machine that
 * has it on — otherwise has no way to see the hero at all. The choice is per
 * origin and per browser, so it never leaks to anyone else.
 *
 * There is deliberately no `?motion=reduced`: the OS setting already does
 * that, and a second way to say the same thing is a second thing to keep in
 * step.
 */

/** Where the choice is remembered, so it survives a reload. */
export const MOTION_STORAGE_KEY = "markhor:motion";

/** The attribute the boot script writes, and CSS keys off. */
export const MOTION_ATTRIBUTE = "data-motion";

/**
 * Runs before first paint, from the document head.
 *
 * It has to be inline and blocking: if the attribute landed after hydration,
 * the page would paint once with the OS preference and then visibly switch.
 * Kept to the one job, and every access guarded — private-mode browsers throw
 * on `localStorage`, and a motion preference is never worth a blank page.
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  MOTION_STORAGE_KEY,
)};var q=new URLSearchParams(location.search).get("motion");if(q==="full"){localStorage.setItem(k,"full")}else if(q==="system"){localStorage.removeItem(k)}if(localStorage.getItem(k)==="full"){document.documentElement.setAttribute(${JSON.stringify(
  MOTION_ATTRIBUTE,
)},"full")}}catch(e){}})();`;

/**
 * Whether motion has been forced on for this browser.
 *
 * Read from the DOM rather than from storage so there is a single answer: the
 * boot script has already resolved the URL and storage into the attribute,
 * and CSS is reading that same attribute.
 */
export function isMotionForced(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(MOTION_ATTRIBUTE) === "full";
}
