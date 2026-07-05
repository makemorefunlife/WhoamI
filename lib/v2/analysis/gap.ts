import { PRIMARY_AXIS_KEYS, type PrimaryAxesScores } from "@/lib/v2/survey/types";

export type GapAxisRow = {
  axis: (typeof PRIMARY_AXIS_KEYS)[number];
  current: number;
  innate: number;
  /** current - innate (docs/v2/analysis/01) */
  delta: number;
  absDelta: number;
};

export function buildGapRows(
  current: PrimaryAxesScores,
  innate: PrimaryAxesScores,
): GapAxisRow[] {
  return PRIMARY_AXIS_KEYS.map((axis) => {
    const c = current[axis];
    const i = innate[axis];
    const delta = c - i;
    return {
      axis,
      current: c,
      innate: i,
      delta,
      absDelta: Math.abs(delta),
    };
  });
}

export function gapDeltaTone(absDelta: number): "neutral" | "wide" {
  return absDelta <= 10 ? "neutral" : "wide";
}
