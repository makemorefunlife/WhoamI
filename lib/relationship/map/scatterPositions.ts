import { hashStringToSeed, mulberry32 } from "./seededRandom";

export type ScatterPoint = { key: string; leftPct: number; topPct: number };

/**
 * Star-field scatter for the people revealed under a selected role — "no
 * rule" per the design ask, but deterministic per person key so positions
 * stay put across re-renders instead of jumping around. Keeps clear of the
 * center (where the Sun sits) and does light rejection sampling so two
 * chips don't render exactly on top of each other.
 */
export function scatterPositions(
  keys: readonly string[],
  options?: { minRadiusPct?: number; maxRadiusPct?: number; minDistancePct?: number },
): ScatterPoint[] {
  const minRadius = options?.minRadiusPct ?? 20;
  const maxRadius = options?.maxRadiusPct ?? 46;
  const minDistance = options?.minDistancePct ?? 10;

  const placed: { x: number; y: number }[] = [];
  const points: ScatterPoint[] = [];

  for (const key of keys) {
    const rand = mulberry32(hashStringToSeed(key));
    let chosen = { x: 50, y: 50 };
    const ATTEMPTS = 12;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const angle = rand() * Math.PI * 2;
      const radius = minRadius + rand() * (maxRadius - minRadius);
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const farEnough = placed.every((p) => Math.hypot(p.x - x, p.y - y) >= minDistance);
      chosen = { x, y };
      if (farEnough || attempt === ATTEMPTS - 1) break;
    }
    placed.push(chosen);
    points.push({ key, leftPct: chosen.x, topPct: chosen.y });
  }

  return points;
}
