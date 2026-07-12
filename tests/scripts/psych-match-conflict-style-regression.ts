/**
 * conflict_style 제외 회귀 검증
 * 실행: npx tsx tests/scripts/psych-match-conflict-style-regression.ts
 */
import { buildPsychMatchResult } from "@/lib/relationship/psychMatch";
import { buildChemistryApproxScores } from "@/lib/relationship/psychMatch/chemistryApprox";
import { buildStrengthWeaknessLists } from "@/lib/relationship/psychMatch/strengthWeaknessTemplates";
import { SECONDARY_AXIS_KEYS, type CurrentSelfProfile } from "@/lib/v2/survey/types";

function baseProfile(
  overrides: Partial<CurrentSelfProfile["secondary_axes"]> = {},
): CurrentSelfProfile {
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

let ok = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail = "") {
  if (cond) {
    ok++;
    console.log(`[OK] ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const profileA = baseProfile({
  empathy: 40,
  thinking_style: 30,
  structure: 60,
  conflict_style: 20,
});
const profileB = baseProfile({
  empathy: 80,
  thinking_style: 90,
  structure: 70,
  conflict_style: 95,
});

const match = buildPsychMatchResult({ profileA, profileB });
assert("axis_results still 11", match.axis_results.length === 11);
assert(
  "conflict_style still in axis_results",
  match.axis_results.some((r) => r.axis_key === "conflict_style"),
);
assert(
  "conflict_style excluded from conflict_triggers",
  !match.conflict_triggers.some((t) => t.axis_key === "conflict_style"),
  `triggers=${match.conflict_triggers.map((t) => t.axis_key).join(",")}`,
);

const chem = buildChemistryApproxScores(match.axis_results);
const chemNoConflict = buildChemistryApproxScores(
  match.axis_results.filter((r) => r.axis_key !== "conflict_style"),
);
assert(
  "communication count is 3",
  chem.communication_axis_count === 3,
  `count=${chem.communication_axis_count}`,
);
assert(
  "communication unchanged without conflict_style row",
  chem.communication === chemNoConflict.communication,
  `comm=${chem.communication}`,
);

const sw = buildStrengthWeaknessLists(match.axis_results);
assert(
  "strength/weakness skips conflict_style",
  !sw.strengths.some((i) => i.axis_key === "conflict_style") &&
    !sw.weaknesses.some((i) => i.axis_key === "conflict_style"),
);
assert(
  "empathy still in strength/weakness",
  sw.strengths.some((i) => i.axis_key === "empathy") ||
    sw.weaknesses.some((i) => i.axis_key === "empathy"),
);

const otherAxes = SECONDARY_AXIS_KEYS.filter((k) => k !== "conflict_style");
for (const axis of otherAxes) {
  const row = match.axis_results.find((r) => r.axis_key === axis)!;
  const single = buildStrengthWeaknessLists([row]);
  const hasEntry =
    single.strengths.length === 1 || single.weaknesses.length === 1;
  assert(`other axis ${axis} still works`, hasEntry);
}

console.log(`\n${ok} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
