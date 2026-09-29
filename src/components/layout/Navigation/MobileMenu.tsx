"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { ArrowLink } from "@/components/ui";
import { getLenis } from "@/lib/animation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";
import styles from "./MobileMenu.module.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const FOCUSABLE = "a[href], button:not([disabled])";

interface MobileMenuProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  cta: NavItem;
  /**
   * The header toggle. It stays visible above the panel and doubles as the
   * close control, so it is part of the dialog's focus cycle.
   */
  toggleRef: RefObject<HTMLButtonElement | null>;
}

/**
 * The site's navigation panel.
 *
 * Named for the breakpoint it used to serve: it is now the *only* navigation
 * at every width, since the header carries no visible link list. Worth
 * knowing before reading the styles below, which still talk about phones.
 *
 * Built to the same standard as the rest of the site rather than as a generic
 * drawer: near-black ground, editorial type scale, product-theme accent.
 *
 * The panel stays mounted and is hidden with `inert` + `aria-hidden` rather
 * than being unmounted by an exit animation. That makes "closed" a fact
 * rather than the result of an animation finishing — a throttled tab can
 * never leave a modal dialog lingering in the accessibility tree.
 *
 * Accessibility handled here:
 *   - `role="dialog"` + `aria-modal`, labelled
 *   - Escape closes
 *   - Tab is trapped across the panel and the header toggle
 *   - focus moves in on open and returns to the toggle on close
 *   - page scroll is locked, including Lenis
 */
export function MobileMenu({
  id,
  isOpen,
  onClose,
  items,
  cta,
  toggleRef,
}: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const lenis = getLenis();
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Captured now so the cleanup returns focus to the button that was
    // actually open, not to whatever the ref happens to hold later.
    const toggle = toggleRef.current;

    const collect = (): HTMLElement[] => {
      const inPanel = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      return toggle ? [...inPanel, toggle] : inPanel;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = collect();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => collect()[0]?.focus(), 80);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      toggle?.focus();
    };
  }, [isOpen, onClose, toggleRef]);

  return (
    <motion.div
      id={id}
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(styles.root, !isOpen && styles.closed)}
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      <nav aria-label="Mobile" className={styles.nav}>
        <ul className={styles.list} role="list">
          {items.map((entry, index) => (
            <motion.li
              key={entry.href}
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 16 }}
              transition={{
                duration: 0.5,
                delay: isOpen ? 0.05 + index * 0.045 : 0,
                ease: EASE,
              }}
            >
              <Link
                href={entry.href}
                className={cn(styles.link, "type-headline")}
                onClick={onClose}
              >
                {entry.label}
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      <motion.div
        className={styles.footer}
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.4, delay: isOpen ? 0.26 : 0, ease: EASE }}
      >
        <ArrowLink href={cta.href} label={cta.label} />
      </motion.div>
    </motion.div>
  );
}
