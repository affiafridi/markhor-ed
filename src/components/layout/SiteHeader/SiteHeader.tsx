"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { MenuButton } from "@/components/layout/Navigation/MenuButton";
import { MobileMenu } from "@/components/layout/Navigation/MobileMenu";
import { ArrowLink, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useExperienceStore, useUIStore } from "@/store";
import type { Navigation as NavigationData } from "@/types";
import styles from "./SiteHeader.module.css";

const MENU_ID = "site-menu";
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Entrance timing. The whole header is in place inside ~0.9s — long enough to
 * feel composed, short enough that it never delays interaction.
 */
const container = {
  hidden: {},
  visible: { transition: { delayChildren: 0.1, staggerChildren: 0.12 } },
};

/** The rule draws itself across, left to right, before anything lands on it. */
const rule = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.72, ease: EASE },
  },
};

const item = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

/**
 * The global header.
 *
 * Transparent and fixed over the hero, with no solid bar: a rule across the
 * top, the mark centred beneath it, and two controls at the right.
 *
 * The mark is positioned rather than placed in the row, because it has to be
 * centred on the *viewport*. In a flex row it would sit in whatever width the
 * controls left over, which is not the middle of the screen and moves as
 * those labels change.
 *
 * There is no visible link list. Everything lives behind the menu, which is
 * the same panel that has always served small screens — one set of
 * navigation, one place it is defined, rather than a desktop copy kept in
 * step by hand.
 *
 * All labels arrive as data; nothing is written in here.
 *
 * Motion is the animation system for the header (interface scale), while GSAP
 * owns the cinematic hero.
 */
export function SiteHeader({ navigation }: { navigation: NavigationData }) {
  const isMenuOpen = useUIStore((state) => state.isMenuOpen);
  const toggleMenu = useUIStore((state) => state.toggleMenu);
  const closeMenu = useUIStore((state) => state.closeMenu);
  const isLoaded = useExperienceStore((state) => state.isLoaded);

  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <motion.header
        className={cn(styles.root, isMenuOpen && styles.aboveMenu)}
        variants={container}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        <motion.div variants={rule} className={styles.rule} aria-hidden="true" />

        <div className={styles.bar}>
          <motion.div variants={item} className={styles.logo}>
            <Link href="/" className={styles.logoLink} aria-label="Markhor — home">
              <Logo />
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <MenuButton
              ref={toggleRef}
              isOpen={isMenuOpen}
              onClick={toggleMenu}
              controls={MENU_ID}
            />
          </motion.div>

          <motion.div variants={item} className={styles.cta}>
            <ArrowLink href={navigation.cta.href} label={navigation.cta.label} />
          </motion.div>
        </div>
      </motion.header>

      <MobileMenu
        id={MENU_ID}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        items={navigation.primary}
        cta={navigation.cta}
        toggleRef={toggleRef}
      />
    </>
  );
}
