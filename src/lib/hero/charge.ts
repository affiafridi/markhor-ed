/**
 * Electricity around a settled product.
 *
 * Paths are built in the can's own coordinate space — a 100 x 268 box, the
 * real 250ml can's 0.373 width-to-height ratio — so the component can scale
 * and rotate the whole drawing with the product without re-deriving
 * anything. A path here is in can-space, always, and the transform is
 * applied once at the top.
 */

/** The can's own drawing space. Matches PRODUCT_ASPECT. */
export const CAN_BOX = { width: 100, height: 268 } as const;

/** How far the silhouette's shoulders are inset, as the real can's are. */
const SHOULDER = 16;
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export type ChargeEdge = "left" | "right" | "top" | "bottom";

/**
 * A run of electricity along one edge of the can.
 *
 * It traces the silhouette rather than a bounding box: down the straight
 * side, in across the shoulder, round the rim. A rectangle round a
 * photograph of a cylinder reads as a border, which is exactly what this
 * must not look like.
 *
 * `jitter` pushes each sample off the contour by a small random amount, so
 * the arc clings to the edge without being a traced outline of it.
 */
export function buildEdgePath(edge: ChargeEdge, jitter = 3.4): string {
  const { width: w, height: h } = CAN_BOX;
  const points: Array<[number, number]> = [];

  if (edge === "left" || edge === "right") {
    const x = edge === "left" ? 0 : w;
    const inward = edge === "left" ? 1 : -1;
    // Start on the shoulder, run the straight side, finish on the base.
    points.push([x + inward * SHOULDER * 0.55, SHOULDER * 0.3]);
    points.push([x, SHOULDER]);
    for (let i = 1; i < 7; i += 1)
      points.push([x, SHOULDER + ((h - SHOULDER * 2) * i) / 7]);
    points.push([x, h - SHOULDER]);
    points.push([x + inward * SHOULDER * 0.55, h - SHOULDER * 0.3]);
  } else {
    const y = edge === "top" ? 0 : h;
    const downward = edge === "top" ? 1 : -1;
    points.push([SHOULDER * 0.4, y + downward * SHOULDER]);
    points.push([SHOULDER, y]);
    for (let i = 1; i < 4; i += 1)
      points.push([SHOULDER + ((w - SHOULDER * 2) * i) / 4, y]);
    points.push([w - SHOULDER, y]);
    points.push([w - SHOULDER * 0.4, y + downward * SHOULDER]);
  }

  return (
    "M" +
    points
      .map(([x, y], i) => {
        // Ends stay put, so the run starts and finishes on the silhouette.
        const off = i === 0 || i === points.length - 1 ? 0 : jitter;
        return (
          (x + randomBetween(-off, off)).toFixed(1) +
          " " +
          (y + randomBetween(-off, off)).toFixed(1)
        );
      })
      .join("L")
  );
}

/**
 * A short branch leaving the silhouette.
 *
 * Anchored on an edge and thrown outward, which is what stops the effect
 * reading as an outline: the energy has to leave the can somewhere.
 */
export function buildBranchPath(edge: ChargeEdge): string {
  const { width: w, height: h } = CAN_BOX;
  let x: number;
  let y: number;
  let dx: number;
  let dy: number;

  if (edge === "left" || edge === "right") {
    x = edge === "left" ? 0 : w;
    y = randomBetween(SHOULDER * 1.5, h - SHOULDER * 1.5);
    dx = (edge === "left" ? -1 : 1) * randomBetween(18, 46);
    dy = randomBetween(-34, 34);
  } else {
    x = randomBetween(SHOULDER * 1.4, w - SHOULDER * 1.4);
    y = edge === "top" ? 0 : h;
    dx = randomBetween(-30, 30);
    dy = (edge === "top" ? -1 : 1) * randomBetween(16, 40);
  }

  // Three segments, each kinked off the last — a straight spur reads as a
  // whisker rather than as a discharge.
  const mid1: [number, number] = [
    x + dx * 0.4 + randomBetween(-7, 7),
    y + dy * 0.4 + randomBetween(-7, 7),
  ];
  const mid2: [number, number] = [
    x + dx * 0.72 + randomBetween(-6, 6),
    y + dy * 0.72 + randomBetween(-6, 6),
  ];

  return `M${x.toFixed(1)} ${y.toFixed(1)}L${mid1[0].toFixed(1)} ${mid1[1].toFixed(1)}L${mid2[0].toFixed(1)} ${mid2[1].toFixed(1)}L${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`;
}

const EDGES: readonly ChargeEdge[] = ["left", "right", "top", "bottom"];

/** Which edges carry a run this time. Rarely all of them. */
export function planCharge(): { edges: ChargeEdge[]; branches: ChargeEdge[] } {
  const shuffled = [...EDGES].sort(() => Math.random() - 0.5);
  const edgeCount = Math.random() < 0.55 ? 1 : 2;
  const edges = shuffled.slice(0, edgeCount);
  const branchCount = Math.random() < 0.45 ? 2 : 1;

  return { edges, branches: shuffled.slice(0, branchCount) };
}

/** Seconds until the next discharge. */
export function nextChargeDelay(): number {
  return randomBetween(1.5, 3.5);
}

/** Seconds a discharge lasts. */
export function chargeDuration(): number {
  return randomBetween(0.15, 0.3);
}

/** Whether a small second discharge follows, and how long after. */
export function secondaryDelay(): number | null {
  return Math.random() < 0.5 ? randomBetween(0.18, 0.4) : null;
}
