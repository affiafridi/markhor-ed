/**
 * Procedural lightning geometry.
 *
 * Bolts are built by midpoint displacement: repeatedly split every segment
 * and push the new midpoint sideways by a shrinking amount. That is what
 * gives real lightning its character - a mostly-straight run with fine
 * detail layered on it - where a hand-drawn zigzag reads as a cartoon.
 *
 * Coordinates are in the SVG's own viewBox space; the component owns the
 * mapping to the screen.
 */

/** The drawing's coordinate space. Wide, to reach out past the can. */
export const BOLT_VIEWBOX = { width: 1600, height: 640 } as const;

/**
 * Where discharges start: the horn and logo area of the centred can, which
 * is where the packaging itself puts the lightning.
 *
 * Exactly the centre of the viewBox, which is what keeps it on the can. The
 * component sizes the drawing to this same ratio and centres it on the logo
 * line, so the middle of the box is the middle of the product at every
 * viewport — see the note in HeroLightning.module.css. An origin that is
 * merely near the centre drifts away from the can as the window resizes.
 */
export const BOLT_ORIGIN = {
  x: BOLT_VIEWBOX.width / 2,
  y: BOLT_VIEWBOX.height / 2,
} as const;

export interface BoltOptions {
  /** Subdivision passes. More gives finer detail and a longer path. */
  detail?: number;
  /** Sideways displacement as a fraction of each segment's length. */
  jitter?: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/** An irregular path from one point to another. */
export function buildBolt(
  from: { x: number; y: number },
  to: { x: number; y: number },
  { detail = 6, jitter = 0.55 }: BoltOptions = {},
): string {
  let points: Array<[number, number]> = [
    [from.x, from.y],
    [to.x, to.y],
  ];
  let amount = jitter;

  for (let pass = 0; pass < detail; pass += 1) {
    const next: Array<[number, number]> = [];

    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i]!;
      const end = points[i + 1]!;
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.hypot(dx, dy) || 1;
      // Unit normal, so the displacement is always across the run.
      const nx = -dy / length;
      const ny = dx / length;
      const offset = (Math.random() - 0.5) * amount * length;

      next.push(start, [
        (start[0] + end[0]) / 2 + nx * offset,
        (start[1] + end[1]) / 2 + ny * offset,
      ]);
    }

    next.push(points[points.length - 1]!);
    points = next;
    // Each pass displaces less, which keeps the overall run readable
    // while still breaking it up at every scale.
    amount *= 0.62;
  }

  return "M" + points.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L");
}

export type BoltKind = "left" | "right" | "crown";

/** Shortest lateral run. Clears the can, so the arc is never hidden by it. */
const LATERAL_NEAR = 190;
/** Longest. Reaches across the statement, but only occasionally. */
const LATERAL_FAR = 650;

/**
 * A lateral run, out to one side of the can.
 *
 * The reach is biased short: most discharges crackle beside the can, where
 * they belong to the product, and the long run across the statement stays an
 * event rather than the norm. An even spread put the visible length of every
 * arc out near the edge of the frame, which read as energy thrown away from
 * the can rather than coming off it.
 */
function lateralTarget(side: -1 | 1): { x: number; y: number } {
  const reach = LATERAL_NEAR + Math.random() ** 1.8 * (LATERAL_FAR - LATERAL_NEAR);

  return {
    x: BOLT_ORIGIN.x + side * reach,
    y: BOLT_ORIGIN.y + randomBetween(-150, 115),
  };
}

/** A short climb straight out of the logo - the gesture the pack itself draws. */
function crownTarget(): { x: number; y: number } {
  return {
    x: BOLT_ORIGIN.x + randomBetween(-95, 95),
    // Measured from the origin, not from the top of the box, so the climb
    // stays the same length however tall the band ends up.
    y: BOLT_ORIGIN.y - randomBetween(150, 255),
  };
}

/** A destination for one bolt. */
export function boltTarget(kind: BoltKind): { x: number; y: number } {
  switch (kind) {
    case "left":
      return lateralTarget(-1);
    case "right":
      return lateralTarget(1);
    case "crown":
      return crownTarget();
  }
}

/**
 * Origin jitter, so successive strikes never start from the same pixel.
 *
 * Tight on purpose: every bolt in one discharge shares this root, and a wide
 * scatter would break the fork apart into unrelated strokes.
 */
export function boltOrigin(): { x: number; y: number } {
  return {
    x: BOLT_ORIGIN.x + randomBetween(-40, 40),
    y: BOLT_ORIGIN.y + randomBetween(-45, 45),
  };
}

/** The side the last one-sided discharge used, so it cannot repeat. */
let lastSide: "left" | "right" | null = null;

function alternatingSide(): "left" | "right" {
  const side =
    lastSide === "left"
      ? "right"
      : lastSide === "right"
        ? "left"
        : Math.random() < 0.5
          ? "left"
          : "right";

  lastSide = side;
  return side;
}

/**
 * Which bolts make up one discharge.
 *
 * Weighted towards mirrored pairs. A discharge that reaches out both ways
 * reads as radiating from the can; a single arc reads as something thrown
 * off to one side, and with a coin flip deciding each one, short runs of
 * same-side strikes are common enough that the whole effect looks biased.
 * The one-sided case is kept as the exception and forced to alternate.
 */
export function planDischarge(maxBranches: number): BoltKind[] {
  // Mobile draws one branch, so the balance has to come from alternating in
  // time rather than from firing both sides at once.
  if (maxBranches < 2) {
    return Math.random() < 0.35 ? ["crown"] : [alternatingSide()];
  }

  const roll = Math.random();

  if (roll < 0.58) {
    const pair: BoltKind[] = ["left", "right"];
    if (maxBranches > 2 && Math.random() < 0.5) pair.push("crown");
    return pair;
  }

  if (roll < 0.76) return ["crown"];

  const side = alternatingSide();
  return maxBranches > 2 && Math.random() < 0.45 ? [side, "crown"] : [side];
}

/** Seconds until the next discharge. Irregular, so it never feels timed. */
export function nextDischargeDelay(): number {
  return randomBetween(1.6, 3.2);
}
