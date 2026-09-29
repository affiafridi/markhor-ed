/**
 * Joins class names, dropping falsy values.
 *
 * Deliberately dependency-free. We do not pull in clsx/tailwind-merge: this
 * project drives styling from design tokens and component-scoped CSS, so
 * conflicting-utility resolution is not a problem we have.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
