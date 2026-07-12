import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { buildPsychMatchResult } from "@/lib/relationship/psychMatch";
import { buildChemistryApproxScores } from "@/lib/relationship/psychMatch/chemistryApprox";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";

const empty = scoreSurveyAnswers({});
const partial = scoreSurveyAnswers({ q1: "A" });
const neutral = buildNeutralV2Profile();

console.log("=== empty answers: all secondary_axes ===");
console.log(JSON.stringify(empty.secondary_axes, null, 2));

console.log("\n=== partial (q1 only) vs baseline 50 ===");
for (const k of SECONDARY_AXIS_KEYS) {
  const v = partial.secondary_axes[k];
  console.log(`${k}: ${v}${v === 50 ? " (baseline only)" : ""}`);
}

const psychNeutral = buildPsychMatchResult({ profileA: neutral, profileB: neutral });
console.log("\n=== neutral × neutral ===");
console.log("gaps:", [...new Set(psychNeutral.axis_results.map((r) => r.gap))]);
console.log("types:", [...new Set(psychNeutral.axis_results.map((r) => r.match_type))]);
console.log("chemistry:", buildChemistryApproxScores(psychNeutral.axis_results));

const sparseProfile = {
  ...neutral,
  secondary_axes: { empathy: 70, thinking_style: 80 },
} as ReturnType<typeof buildNeutralV2Profile>;
const psychSparse = buildPsychMatchResult({
  profileA: sparseProfile,
  profileB: neutral,
});
console.log("\n=== sparse secondary_axes (2 keys only) ===");
console.log(
  "NaN gap count:",
  psychSparse.axis_results.filter((r) => Number.isNaN(r.gap)).length,
);
console.log(
  "sample:",
  psychSparse.axis_results
    .filter((r) => Number.isNaN(r.gap) || r.axis_key === "empathy")
    .slice(0, 4),
);
