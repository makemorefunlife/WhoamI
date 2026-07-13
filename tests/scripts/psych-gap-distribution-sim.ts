/**
 * psych_match 축별 gap 분포 — q1~q9 전체 프로필(262,144) + 무작위 쌍 샘플링
 * 실행: npx tsx tests/scripts/psych-gap-distribution-sim.ts
 */
import { scoreSurveyAnswers } from "../../lib/v2/survey/scorer";
import { classifyPsychMatchType } from "../../lib/relationship/psychMatch";
import {
  buildChemistryApproxScores,
  compatibilityScoreFromGap,
} from "../../lib/relationship/psychMatch/chemistryApprox";
import {
  SCORED_QUESTION_IDS,
  SECONDARY_AXIS_KEYS,
  type SecondaryAxisKey,
} from "../../lib/v2/survey/types";
import { psychMatchAxisKoLabel } from "../../lib/relationship/psychMatch";

const CHOICES = ["A", "B", "C", "D"] as const;
const PAIR_SAMPLES = 10_000;
const SEED = 42;

type AxisScores = Record<SecondaryAxisKey, number>;

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function stats(sorted: number[]) {
  if (sorted.length === 0) {
    return {
      n: 0,
      min: NaN,
      p10: NaN,
      p25: NaN,
      median: NaN,
      p60: NaN,
      p75: NaN,
      p90: NaN,
      p95: NaN,
      max: NaN,
      mean: NaN,
    };
  }
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    n: sorted.length,
    min: sorted[0]!,
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p60: percentile(sorted, 0.6),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    max: sorted[sorted.length - 1]!,
    mean: sum / sorted.length,
  };
}

function buildAllProfiles(): AxisScores[] {
  const profiles: AxisScores[] = [];
  const answers: Record<string, string> = {};
  const ids = [...SCORED_QUESTION_IDS];

  function walk(depth: number) {
    if (depth === ids.length) {
      const profile = scoreSurveyAnswers(answers).secondary_axes;
      profiles.push(profile as AxisScores);
      return;
    }
    const qId = ids[depth]!;
    for (const c of CHOICES) {
      answers[qId] = c;
      walk(depth + 1);
    }
  }

  walk(0);
  return profiles;
}

function gapBetween(a: AxisScores, b: AxisScores, axis: SecondaryAxisKey): number {
  return Math.abs(a[axis] - b[axis]);
}

function fmt(n: number, digits = 2): string {
  if (Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function printStatsRow(label: string, s: ReturnType<typeof stats>) {
  console.log(
    [
      label.padEnd(22),
      String(s.min).padStart(4),
      fmt(s.p10, 1).padStart(6),
      fmt(s.p25, 1).padStart(6),
      fmt(s.median, 1).padStart(6),
      fmt(s.p75, 1).padStart(6),
      fmt(s.p90, 1).padStart(6),
      fmt(s.p95, 1).padStart(6),
      String(s.max).padStart(4),
      fmt(s.mean, 2).padStart(6),
    ].join(" | "),
  );
}

const profiles = buildAllProfiles();
console.log(`profiles: ${profiles.length} (expected 262144)`);

const rng = mulberry32(SEED);
const perAxisGaps: Record<SecondaryAxisKey, number[]> = Object.fromEntries(
  SECONDARY_AXIS_KEYS.map((k) => [k, []]),
) as unknown as Record<SecondaryAxisKey, number[]>;

const meanGap11: number[] = [];
const maxGap11: number[] = [];
const meanGap7Chem: number[] = [];
const emotionalChem: number[] = [];
const communicationChem: number[] = [];
const compatAll11: number[] = [];

let obsSimilarity = 0;
let obsComplementary = 0;
let obsTension = 0;
let obsTotal = 0;

const chemAxisKeys = new Set([
  "empathy",
  "recognition",
  "resilience",
  "self_control",
  "thinking_style",
  "decision_style",
  "structure",
]);

for (let i = 0; i < PAIR_SAMPLES; i++) {
  const ia = Math.floor(rng() * profiles.length);
  const ib = Math.floor(rng() * profiles.length);
  const a = profiles[ia]!;
  const b = profiles[ib]!;

  const gaps: number[] = [];
  const chemGaps: number[] = [];

  for (const axis of SECONDARY_AXIS_KEYS) {
    const g = gapBetween(a, b, axis);
    perAxisGaps[axis].push(g);
    gaps.push(g);
    if (chemAxisKeys.has(axis)) chemGaps.push(g);

    const mt = classifyPsychMatchType(axis, g);
    obsTotal++;
    if (mt === "similarity") obsSimilarity++;
    else if (mt === "complementary") obsComplementary++;
    else obsTension++;
  }

  meanGap11.push(gaps.reduce((s, v) => s + v, 0) / gaps.length);
  maxGap11.push(Math.max(...gaps));
  meanGap7Chem.push(chemGaps.reduce((s, v) => s + v, 0) / chemGaps.length);

  const axisResults = SECONDARY_AXIS_KEYS.map((axis_key) => ({
    axis_key,
    gap: gapBetween(a, b, axis_key),
  }));
  const chem = buildChemistryApproxScores(axisResults);
  if (chem.emotional != null) emotionalChem.push(chem.emotional);
  if (chem.communication != null) communicationChem.push(chem.communication);

  const compatMean =
    gaps.reduce(
      (s, g, idx) =>
        s + compatibilityScoreFromGap(SECONDARY_AXIS_KEYS[idx]!, g),
      0,
    ) / gaps.length;
  compatAll11.push(compatMean);
}

console.log(`\n=== 샘플: 무작위 프로필 쌍 ${PAIR_SAMPLES}개 (${profiles.length} 프로필 풀) ===\n`);

console.log(
  [
    "축".padEnd(22),
    "min".padStart(4),
    "p10".padStart(6),
    "p25".padStart(6),
    "p50".padStart(6),
    "p75".padStart(6),
    "p90".padStart(6),
    "p95".padStart(6),
    "max".padStart(4),
    "mean".padStart(6),
  ].join(" | "),
);
console.log("-".repeat(90));

for (const axis of SECONDARY_AXIS_KEYS) {
  const sorted = [...perAxisGaps[axis]].sort((x, y) => x - y);
  printStatsRow(psychMatchAxisKoLabel(axis), stats(sorted));
}

console.log("\n=== 종합 gap (쌍당 1값) ===\n");
printStatsRow("mean_gap_11축", stats([...meanGap11].sort((a, b) => a - b)));
printStatsRow("max_gap_11축", stats([...maxGap11].sort((a, b) => a - b)));
printStatsRow("mean_gap_케미7축", stats([...meanGap7Chem].sort((a, b) => a - b)));

console.log("\n=== classifyPsychMatchType (축×쌍, 축별 p60/p90) ===");
console.log(`관측 수: ${obsTotal} (= ${PAIR_SAMPLES}쌍 × 11축)`);
console.log(`유사 (gap<p60):        ${obsSimilarity} (${((100 * obsSimilarity) / obsTotal).toFixed(2)}%)`);
console.log(`보완 (p60≤gap≤p90):    ${obsComplementary} (${((100 * obsComplementary) / obsTotal).toFixed(2)}%)`);
console.log(`긴장 (gap>p90):        ${obsTension} (${((100 * obsTension) / obsTotal).toFixed(2)}%)`);

console.log("\n=== chemistryApprox (퍼센타일 환산, 쌍당) ===\n");
const emoS = stats([...emotionalChem].sort((a, b) => a - b));
const comS = stats([...communicationChem].sort((a, b) => a - b));
const compatS = stats([...compatAll11].sort((a, b) => a - b));
console.log(`감정 케미  mean=${fmt(emoS.mean, 2)}  median=${fmt(emoS.median, 1)}  p10=${fmt(emoS.p10, 1)}  p90=${fmt(emoS.p90, 1)}`);
console.log(`소통 케미  mean=${fmt(comS.mean, 2)}  median=${fmt(comS.median, 1)}  p10=${fmt(comS.p10, 1)}  p90=${fmt(comS.p90, 1)}`);
console.log(`11축 compat mean(percentile)  mean=${fmt(compatS.mean, 2)}  median=${fmt(compatS.median, 1)}  p10=${fmt(compatS.p10, 1)}  p90=${fmt(compatS.p90, 1)}`);

console.log("\n=== 축별 p60 (gapPercentiles 검증용) ===");
for (const axis of SECONDARY_AXIS_KEYS) {
  const sorted = [...perAxisGaps[axis]].sort((x, y) => x - y);
  const p60 = percentile(sorted, 0.6);
  const p90 = percentile(sorted, 0.9);
  console.log(`${axis}: p60=${fmt(p60, 1)} p90=${fmt(p90, 1)}`);
}
