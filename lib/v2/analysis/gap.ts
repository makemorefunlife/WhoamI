import { PRIMARY_AXIS_KEYS, type PrimaryAxesScores } from "@/lib/v2/survey/types";

export type GapAxisRow = {
  axis: (typeof PRIMARY_AXIS_KEYS)[number];
  current: number;
  essence: number;
  /** current - essence (docs/v2/analysis/01) */
  delta: number;
  absDelta: number;
};

export function buildGapRows(
  current: PrimaryAxesScores,
  essence: PrimaryAxesScores,
): GapAxisRow[] {
  return PRIMARY_AXIS_KEYS.map((axis) => {
    const c = current[axis];
    const e = essence[axis];
    const delta = c - e;
    return {
      axis,
      current: c,
      essence: e,
      delta,
      absDelta: Math.abs(delta),
    };
  });
}

export function gapDeltaTone(absDelta: number): "neutral" | "wide" {
  return absDelta <= 10 ? "neutral" : "wide";
}
