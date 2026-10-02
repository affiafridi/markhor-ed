"use client";

import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { gsap, registerGsap } from "@/lib/animation";
import {
  buildBranchPath,
  buildEdgePath,
  CAMERA_DISTANCE,
  CAN_BOX,
  chargeDuration,
  heroStage,
  nextChargeDelay,
  planCharge,
  secondaryDelay,
  SCENE_COUNT,
} from "@/lib/hero";
import { CAMERA } from "@/lib/three";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store";
import styles from "./HeroProductCharge.module.css";

/** Two edge runs and two branches is the busiest it ever gets. */
const EDGE_SLOTS = 2;
const BRANCH_SLOTS = 2;

/** Mirrors PRODUCT_HEIGHT and DETAIL_Z in the 3D stage. */
const PRODUCT_HEIGHT = 1.58;
const DETAIL_Z = 0.55;
/** Only once the can has genuinely stopped moving. */
const SETTLED = 0.995;
/**
 * How far into the energy stage before anything fires.
 *
 * The electricity is the last beat of the story, not decoration on the whole
 * detail scene. Nothing crackles while the reader is still on the facts.
 */
const ENERGY_THRESHOLD = 0.12;

/**
 * How far into the last scene the reader is, 0 to 1.
 *
 * The electricity belongs to the final scene, not to the whole detail view —
 * nothing crackles while the reader is still on the product's facts.
 */
const energyProgress = () => {
  const last = (SCENE_COUNT - 1) / SCENE_COUNT;
  return Math.max(0, Math.min(1, (heroStage.story - last) * SCENE_COUNT));
};

interface Bolt {
  core: SVGPathElement | null;
  halo: SVGPathElement | null;
}

/**
 * Electricity around the settled product.
 *
 * Drawn in the can's own coordinate space, then placed by one CSS transform
 * derived from where the product actually is in the 3D scene - so it
 * travels, scales and leans with the can rather than being a decoration
 * parked on top of it. The paths follow the cylinder's silhouette: down the
 * straight sides, in across the shoulders, round the rims. A rectangle
 * around a photograph of a can reads as a border, which is the one thing
 * this must not look like.
 *
 * Deliberately not part of the transition. Nothing fires until the move has
 * finished, and the return puts it out before the can starts travelling.
 */
export function HeroProductCharge({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const edges = useRef<Bolt[]>([]);
  const branches = useRef<Bolt[]>([]);
  const reducedMotion = useExperienceStore((state) => state.prefersReducedMotion);
  const tier = useExperienceStore((state) => state.viewportTier);

  /*
   * Follow the can.
   *
   * On the shared ticker rather than a loop of its own, writing one
   * transform string. The projection is a handful of multiplies, which is
   * cheaper than trying to keep a cached value in step with a timeline that
   * can be reversed halfway through.
   */
  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return;
    registerGsap();

    const follow = () => {
      const node = wrapper.current;
      if (!node) return;

      const live = heroStage.focus >= SETTLED ? energyProgress() : 0;
      // Fades up with the stage rather than switching on.
      node.style.opacity = String(Math.min(1, live * 2.5));
      if (live <= 0) return;

      const halfHeight =
        Math.tan((CAMERA.fov * Math.PI) / 360) * (CAMERA_DISTANCE[tier] - DETAIL_Z);
      // World units to screen pixels at the product's depth.
      const perUnit = window.innerHeight / (2 * halfHeight);
      const height = PRODUCT_HEIGHT * heroStage.detailScale * perUnit;

      node.style.height = `${height}px`;
      node.style.width = `${(height * CAN_BOX.width) / CAN_BOX.height}px`;
      node.style.transform =
        `translate(-50%, -50%) translate(${heroStage.detailX * perUnit}px, ` +
        `${-heroStage.detailY * perUnit}px) rotate(${-heroStage.detailTilt}rad)`;
    };

    gsap.ticker.add(follow);
    return () => gsap.ticker.remove(follow);
  }, [reducedMotion, tier]);

  /* The rhythm: short irregular bursts, long quiet between them. */
  useEffect(() => {
    if (reducedMotion) return;

    let timer = 0;
    let secondary = 0;
    let cancelled = false;

    const fire = (scale: number) => {
      const plan = planCharge();
      const timeline = gsap.timeline();

      const run = (slot: Bolt | undefined, path: string, index: number) => {
        if (!slot?.core || !slot.halo) return;
        slot.core.setAttribute("d", path);
        slot.halo.setAttribute("d", path);

        const length = slot.core.getTotalLength();
        const targets = [slot.core, slot.halo];
        const lead = index * gsap.utils.random(0.02, 0.06);
        const travel = chargeDuration() * scale;

        gsap.set(targets, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        });

        timeline
          // The charge runs the length of the edge.
          .to(targets, { strokeDashoffset: 0, duration: travel, ease: "none" }, lead)
          // Then gutters and re-strikes, the way a real discharge does.
          .to(targets, { opacity: 0.25, duration: 0.035, ease: "none" }, lead + travel)
          .to(
            targets,
            { opacity: 1, duration: 0.03, ease: "none" },
            lead + travel + 0.035,
          )
          .to(
            targets,
            { opacity: 0, duration: gsap.utils.random(0.09, 0.16), ease: "power2.in" },
            lead + travel + 0.08,
          );
      };

      plan.edges.forEach((edge, i) => run(edges.current[i], buildEdgePath(edge), i));
      plan.branches.forEach((edge, i) =>
        run(branches.current[i], buildBranchPath(edge), i + 1),
      );
    };

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        // Silent unless the can is still *and* the story has reached its
        // last scene.
        if (heroStage.focus >= SETTLED && energyProgress() > ENERGY_THRESHOLD) {
          fire(1);
          const delay = secondaryDelay();
          if (delay !== null) {
            secondary = window.setTimeout(() => {
              if (!cancelled) fire(0.6);
            }, delay * 1000);
          }
        }
        schedule();
      }, nextChargeDelay() * 1000);
    };

    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(secondary);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const pool = (store: typeof edges, count: number, kind: string) =>
    Array.from({ length: count }, (_, index) => (
      <g key={`${kind}-${index}`}>
        <path
          ref={(node) => {
            const slot = (store.current[index] ??= { core: null, halo: null });
            slot.halo = node;
          }}
          className={styles.halo}
          filter="url(#markhor-charge-halo)"
          fill="none"
        />
        <path
          ref={(node) => {
            const slot = (store.current[index] ??= { core: null, halo: null });
            slot.core = node;
          }}
          className={styles.core}
          fill="none"
        />
      </g>
    ));

  return (
    <div ref={wrapper} className={cn(styles.root, className)} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`${-CAN_BOX.width} ${-CAN_BOX.height * 0.3} ${CAN_BOX.width * 3} ${CAN_BOX.height * 1.6}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <filter id="markhor-charge-halo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>
        {pool(edges, EDGE_SLOTS, "edge")}
        {pool(branches, BRANCH_SLOTS, "branch")}
      </svg>
    </div>
  );
}
