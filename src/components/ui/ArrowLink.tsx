import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./ArrowLink.module.css";

interface ArrowLinkProps {
  href: string;
  label: string;
  className?: string;
}

/**
 * The outlined call to action.
 *
 * Thin border, soft white, a warm accent that only appears on hover, and an
 * arrow that shifts a few pixels. Restrained on purpose — it sits over the
 * product and must not glow for attention.
 */
export function ArrowLink({ href, label, className }: ArrowLinkProps) {
  return (
    <Link href={href} className={cn(styles.root, "type-label", className)}>
      {label}
      <svg
        className={styles.arrow}
        viewBox="0 0 16 16"
        width="13"
        height="13"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2.5 8h10M9 4.5 12.5 8 9 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
