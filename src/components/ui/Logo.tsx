import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./Logo.module.css";

/**
 * The Markhor lockup.
 *
 * Points at the brand's own official logo file — nothing here is redrawn or
 * reconstructed from text. Replacing it with an SVG when one is supplied is a
 * single change to `LOGO` below; every consumer sizes it from CSS.
 */
const LOGO = {
  src: "/brand/logo/markhor-logo.webp",
  width: 2068,
  height: 608,
};

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      className={cn(styles.logo, className)}
      src={LOGO.src}
      width={LOGO.width}
      height={LOGO.height}
      alt="Markhor"
      sizes="160px"
      priority
    />
  );
}
