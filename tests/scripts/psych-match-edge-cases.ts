/**
 * psychMatch / chemistryApprox / strengthWeaknessTemplates 경계값 테스트
 * 실행: npx tsx tests/scripts/psych-match-edge-cases.ts
 */
import {
  classifyPsychMatchType,
  buildPsychMatchResult,
  getAxisGapPercentiles,
} from "@/lib/relationship/psychMatch";
import {
  buildChemistryApproxScores,
  compatibilityScoreFromGap,
} from "@/lib/relationship/psychMatch/chemistryApprox";
import { buildStrengthWeaknessLists } from "@/lib/relationship/psychMatch/strengthWeaknessTemplates";
import { SECONDARY_AXIS_KEYS, type CurrentSelfProfile } from "@/lib/v2/survey/types";

function section(title: string) {
  console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);
}

function baseProfile(overrides: Partial<CurrentSelfProfile["secondary_axes"]> = {}): CurrentSelfProfile {
  const secondary_axes = Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k) => [k, 50]),
  ) as CurrentSelfProfile["secondary_axes"];
  for (const [k, v] of Object.entries(overrides)) {
    if (v != null) secondary_axes[k as keyof typeof secondary_axes] = v;
  }
  return {
    profile_type: "current_self",
    primary_axes: {
      extraversion: 50,
      agreeableness: 50,
      conscientiousness: 50,
      emotional_stability: 50,
      openness: 50,
    },
    secondary_axes,
    personalization: { primary_concern: null },
    meta: {
      survey_version: "v2",
      completed_at: "2026-01-01T00:00:00.000Z",
      completion_time_seconds: null,
    },
  };
}

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL: ${label}`);
  console.log(`OK: ${label}`);
}

section("1. classifyPsychMatchType — empathy 축 p60/p90 경계");

const empathyBounds = getAxisGapPercentiles("empathy");
const empathyGaps = [
  Math.floor(empathyBounds.p60) - 1,
  Math.floor(empathyBounds.p60),
  Math.ceil(empathyBounds.p90),
  Math.ceil(empathyBounds.p90) + 1,
];
for (const gap of empathyGaps) {
  console.log(`empathy gap=${gap} → ${classifyPsychMatchType("empathy", gap)}`);
}

section("2. buildPsychMatchResult — empathy 축 gap 경계");

for (const gap of empathyGaps) {
  const profileA = baseProfile({ empathy: 50 });
  const profileB = baseProfile({ empathy: 50 + gap });
  const result = buildPsychMatchResult({ profileA, profileB });
  const empathy = result.axis_results.find((r) => r.axis_key === "empathy")!;
  console.log(
    `target gap=${gap} | empathy: gap=${empathy.gap} match_type=${empathy.match_type}`,
  );
}

section("3. compatibilityScoreFromGap — empathy 퍼센타일 환산");

for (const gap of [0, 2, 4, 8, 12, 15]) {
  console.log(`empathy gap=${gap} → compat=${compatibilityScoreFromGap("empathy", gap)}`);
}

section("4. buildChemistryApproxScores — 3축 gap 샘플");

const chem = buildChemistryApproxScores([
  { axis_key: "thinking_style", gap: 0 },
  { axis_key: "decision_style", gap: 4 },
  { axis_key: "structure", gap: 8 },
]);
console.log(chem);

section("5. buildStrengthWeaknessLists — tension 축");

const lists = buildStrengthWeaknessLists([
  {
    axis_key: "empathy",
    match_type: "tension",
    gap: 12,
  },
]);
console.log(`weaknesses: ${lists.weaknesses.length}, strengths: ${lists.strengths.length}`);

section("6. buildStrengthWeaknessLists — full psych_match min 3 each");

const fullMatch = buildPsychMatchResult({
  profileA: baseProfile({ stimulation: 20, empathy: 45 }),
  profileB: baseProfile({ stimulation: 80, empathy: 55 }),
});
const fullLists = buildStrengthWeaknessLists(fullMatch.axis_results);
console.log(
  `full match — strengths: ${fullLists.strengths.length}, weaknesses: ${fullLists.weaknesses.length}`,
);
assert(fullLists.weaknesses.length >= 3, "weaknesses min 3");
assert(fullLists.strengths.length >= 3, "strengths min 3");

console.log("\nAll psych-match edge checks passed.");
