import type { RelationshipRoleId } from "./relationshipRoleSsot";
import { hashStringToSeed, mulberry32 } from "./seededRandom";

/**
 * A closed, lightly hand-sketched "wobble blob" path inscribed roughly in a
 * unit circle (radius ~1, centered at origin). Same `seedKey` always yields
 * the same shape, so each role's planet keeps a stable, unique silhouette
 * instead of a perfect circle.
 */
export function buildWobbleBlobPath(
  seedKey: string,
  options?: { points?: number; jitter?: number; spiky?: boolean },
): string {
  const points = options?.points ?? 11;
  const jitter = options?.jitter ?? 0.07;
  const rand = mulberry32(hashStringToSeed(seedKey));
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = 1 + (rand() * 2 - 1) * jitter;
    pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }

  if (options?.spiky) {
    let d = `M ${pts[0][0].toFixed(4)} ${pts[0][1].toFixed(4)} `;
    for (let i = 1; i < pts.length; i++) {
      d += `L ${pts[i][0].toFixed(4)} ${pts[i][1].toFixed(4)} `;
    }
    return `${d}Z`;
  }

  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const n = pts.length;
  const start = mid(pts[n - 1], pts[0]);
  let d = `M ${start[0].toFixed(4)} ${start[1].toFixed(4)} `;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const m = mid(cur, next);
    d += `Q ${cur[0].toFixed(4)} ${cur[1].toFixed(4)} ${m[0].toFixed(4)} ${m[1].toFixed(4)} `;
  }
  return `${d}Z`;
}

export type PlanetSilhouette =
  | "atmosphere"
  | "moon"
  | "ring"
  | "stripes"
  | "oval-moons"
  | "sketchy"
  | "spots"
  | "double"
  | "jagged"
  | "plain";

export type PlanetVisual = {
  fill: string;
  fillSoft: string;
  stroke: string;
  silhouette: PlanetSilhouette;
  /** Orbit placement — angleDeg measured clockwise from straight up, radiusFraction 0..1 of the map radius. */
  angleDeg: number;
  radiusFraction: number;
};

/**
 * Hand-placed (not evenly spaced) orbit slots + one distinct "planetary
 * personality" per role, per relationship-map spec section 5. Colors are a
 * soft pastel/crayon palette chosen to sit next to the product's existing
 * warm-cream / deep-forest editorial surface.
 */
export const PLANET_VISUALS: Record<RelationshipRoleId, PlanetVisual> = {
  my_person: {
    fill: "#f6c9c9",
    fillSoft: "#fbe4e4",
    stroke: "#c98f8f",
    silhouette: "atmosphere",
    angleDeg: 3,
    radiusFraction: 0.74,
  },
  muse: {
    fill: "#d9cdf2",
    fillSoft: "#ece5fa",
    stroke: "#a494cf",
    silhouette: "moon",
    angleDeg: 33,
    radiusFraction: 0.9,
  },
  compass: {
    fill: "#bfe0cf",
    fillSoft: "#e0f0e8",
    stroke: "#7fae95",
    silhouette: "ring",
    angleDeg: 74,
    radiusFraction: 0.8,
  },
  growth_button: {
    fill: "#f3b8a4",
    fillSoft: "#f9dcd0",
    stroke: "#cf7c5e",
    silhouette: "stripes",
    angleDeg: 106,
    radiusFraction: 0.95,
  },
  couch: {
    fill: "#f4dfa0",
    fillSoft: "#faeecb",
    stroke: "#c9a95a",
    silhouette: "oval-moons",
    angleDeg: 147,
    radiusFraction: 0.76,
  },
  mic: {
    fill: "#f2b6ae",
    fillSoft: "#f9dcd8",
    stroke: "#cc7d72",
    silhouette: "sketchy",
    angleDeg: 177,
    radiusFraction: 0.9,
  },
  keeper: {
    fill: "#e9cf8e",
    fillSoft: "#f5e7c3",
    stroke: "#bd9a4c",
    silhouette: "spots",
    angleDeg: 218,
    radiusFraction: 0.78,
  },
  explorer: {
    fill: "#aecbe0",
    fillSoft: "#d9e7f2",
    stroke: "#7396b3",
    silhouette: "oval-moons",
    angleDeg: 250,
    radiusFraction: 0.94,
  },
  twin: {
    fill: "#b9e0d4",
    fillSoft: "#dcf0e9",
    stroke: "#7cae9c",
    silhouette: "double",
    angleDeg: 291,
    radiusFraction: 0.72,
  },
  spark: {
    fill: "#f2a58e",
    fillSoft: "#f9d3c4",
    stroke: "#cc6e4f",
    silhouette: "jagged",
    angleDeg: 321,
    radiusFraction: 0.98,
  },
};

/** Bounded nonlinear planet size (px diameter) — sqrt(count) so 100 people never dominates the screen. */
export function planetDiameterPx(count: number): number {
  const BASE = 40;
  const SCALE = 9;
  const MIN = 34;
  const MAX = 108;
  if (count <= 0) return MIN;
  const raw = BASE + Math.sqrt(count) * SCALE;
  return Math.min(MAX, Math.max(MIN, raw));
}
