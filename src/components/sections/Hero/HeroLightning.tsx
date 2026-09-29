"use client";

import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { gsap, registerGsap } from "@/lib/animation";
import {
  BOLT_VIEWBOX,
  boltOrigin,
  boltTarget,
  buildBolt,
  heroStage,
  nextDischargeDelay,
  planDischarge,
  registerTransitionParticipant,
} from "@/lib/hero";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import styles from "./HeroLightning.module.css";

/** Pool size. Mobile draws fewer branches rather than a different scene. */
const MAX_BRANCHES = 3;

interface BoltRefs {
  core: SVGPathElement | null;
  glow: SVGPathElement | null;
}

/**
 * Electrical discharge behind the product.
 *
 * The Markhor packaging puts lightning between the horns; this is that idea
 * at hero scale. It lives below the WebGL layer, so the can always occludes
 * it — the arcs read as happening *behind* the product rather than over it.
 *
 * Deliberately not a full-hero flash. The oversized statement stays fixed
 * and architectural; the energy is small, off-centre and unpredictable, and
 * the contrast between the two is what carries the composition.
 *
 * SVG rather than canvas so it stays crisp at any density, and because a
 * handful of stroked paths is cheaper than a second drawing surface. Each
 * bolt is drawn twice: a wide blurred pass for the halo and a thin bright
 * core on top, and the discharge is animated by running the stroke dash
 * along the path so the charge travels rather than merely switching on.
 */
export function HeroLightning({ className }: { className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const bolts = useRef<BoltRefs[]>([]);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);
  const viewportTier = useExperienceStore((state) => state.viewportTier);

  const fire = useRef<() => void>(() => {});

  useIsomorphicLayoutEffect(() => {
    registerGsap();

    const branches =
      viewportTier === "mobile" ? 1 : viewportTier === "tablet" ? 2 : MAX_BRANCHES;

    fire.current = () => {
      const plan = planDischarge(branches);
      const timeline = gsap.timeline();
      // One root for the whole discharge, so a mirrored pair reads as a
      // single bolt forking rather than as two unrelated strokes.
      const origin = boltOrigin();

      plan.forEach((kind, index) => {
        const slot = bolts.current[index];
        if (!slot?.core || !slot.glow) return;

        const path = buildBolt(origin, boltTarget(kind), {
          detail: kind === "crown" ? 5 : 6,
          jitter: kind === "crown" ? 0.62 : 0.55,
        });
        slot.core.setAttribute("d", path);
        slot.glow.setAttribute("d", path);

        const length = slot.core.getTotalLength();
        const lead = index * gsap.utils.random(0.03, 0.09);
        const travel = gsap.utils.random(0.09, 0.16);
        const targets = [slot.core, slot.glow];

        gsap.set(targets, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        });

        timeline
          // The charge runs the length of the arc.
          .to(targets, { strokeDashoffset: 0, duration: travel, ease: "none" }, lead)
          // Then it gutters, the way a real discharge re-strikes.
          .to(targets, { opacity: 0.3, duration: 0.04, ease: "none" }, lead + travel)
          .to(targets, { opacity: 1, duration: 0.03, ease: "none" }, lead + travel + 0.04)
          .to(
            targets,
            { opacity: 0, duration: gsap.utils.random(0.1, 0.17), ease: "power2.in" },
            lead + travel + 0.09,
          );
      });

      /*
       * The product's own glow lifts a few percent while the arc is live.
       * Enough to feel connected to the scene, far short of a page flash.
       */
      timeline
        .to(heroStage, { discharge: 1, duration: 0.06, ease: "none" }, 0)
        .to(heroStage, { discharge: 0, duration: 0.26, ease: "power2.out" }, 0.09);
    };
  }, [viewportTier]);

  /* The idle rhythm. */
  useEffect(() => {
    if (reducedMotion) return;

    let timer = 0;
    let cancelled = false;

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        fire.current();
        schedule();
      }, nextDischargeDelay() * 1000);
    };

    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      heroStage.discharge = 0;
    };
  }, [reducedMotion]);

  /*
   * And a strike on a product change.
   *
   * Scheduled onto the central transition timeline rather than a timer of
   * its own, so it lands against the same clock as the stage movement and
   * is cancelled with it if the transition is interrupted.
   *
   * At the head of the move, not the end of it: the stage is fastest as it
   * leaves, and a strike that waits for the settle puts most of a second
   * between the press and the response, which reads as lag rather than as
   * anticipation. A second one sometimes follows it in, the way a real
   * discharge re-strikes.
   */
  useEffect(() => {
    if (reducedMotion) return;

    return registerTransitionParticipant((timeline, context) => {
      if (!timeline) return;

      timeline.call(() => fire.current(), undefined, 0);
      if (Math.random() < 0.45) {
        timeline.call(() => fire.current(), undefined, context.duration * 0.6);
      }
    });
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <svg
      ref={root}
      className={cn(styles.root, className)}
      viewBox={`0 0 ${BOLT_VIEWBOX.width} ${BOLT_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="markhor-bolt-halo" x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {Array.from({ length: MAX_BRANCHES }, (_, index) => (
        <g key={index}>
          <path
            ref={(node) => {
              const slot = (bolts.current[index] ??= { core: null, glow: null });
              slot.glow = node;
            }}
            className={styles.halo}
            filter="url(#markhor-bolt-halo)"
            fill="none"
          />
          <path
            ref={(node) => {
              const slot = (bolts.current[index] ??= { core: null, glow: null });
              slot.core = node;
            }}
            className={styles.core}
            fill="none"
          />
        </g>
      ))}
    </svg>
  );
}
