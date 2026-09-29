"use client";

import { useEffect, useRef } from "react";
import { HornControl } from "@/components/ui";
import { gsap } from "@/lib/animation";
import { registerTransitionParticipant } from "@/lib/hero";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import styles from "./HeroControls.module.css";

interface HeroControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}

/**
 * Previous / next controls, drawn as Markhor horns.
 *
 * Thin wrappers only — they call the carousel, which owns the single
 * transition. Labels are built from the actual product names by the hero, so
 * screen reader users hear where they are going.
 *
 * On a product change the horn for the direction of travel runs a charge
 * from its base to its tip, so the control that caused the move also reports
 * the move's progress. It joins the central transition timeline rather than
 * running a tween of its own, which is what keeps it in step with the stage
 * and, more importantly, lets it be cancelled when the stage is.
 */
export function HeroControls({
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  className,
}: HeroControlsProps) {
  const previousGlyph = useRef<HTMLSpanElement>(null);
  const nextGlyph = useRef<HTMLSpanElement>(null);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    return registerTransitionParticipant((timeline, context) => {
      // `direction` is +1 when advancing, so it names the horn that was, or
      // would have been, pressed — drag and scroll light it up too.
      const glyph = context.direction >= 0 ? nextGlyph.current : previousGlyph.current;
      if (!glyph || !timeline) return;

      timeline.fromTo(
        glyph,
        { "--horn-charge": 0 },
        {
          "--horn-charge": 1,
          // Shorter than the move. The charge should have arrived by the
          // time the product lands, not still be climbing.
          duration: context.duration * 0.62,
          // Linear: a charge that eases looks like it is losing power.
          ease: "none",
          // An interrupted transition would otherwise strand the band
          // halfway up the horn. 1 is past the tip, so it is invisible.
          onInterrupt: () => gsap.set(glyph, { "--horn-charge": 1 }),
        },
        0,
      );
    });
  }, [reducedMotion]);

  return (
    <div className={cn(styles.root, className)}>
      <HornControl
        direction="previous"
        label={previousLabel}
        onClick={onPrevious}
        glyphRef={previousGlyph}
      />
      <HornControl
        direction="next"
        label={nextLabel}
        onClick={onNext}
        glyphRef={nextGlyph}
      />
    </div>
  );
}
