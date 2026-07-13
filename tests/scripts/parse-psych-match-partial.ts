/**
 * parsePsychMatch partial parse 스모크
 * 실행: npx tsx tests/scripts/parse-psych-match-partial.ts
 */
import { parseRomanticDeepViewModel } from "@/lib/relationship/detail/parseRomanticDeepViewModel";
import { buildStrengthWeaknessLists } from "@/lib/relationship/psychMatch/strengthWeaknessTemplates";
import { buildChemistryApproxScores } from "@/lib/relationship/psychMatch/chemistryApprox";

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL: ${label}`);
  console.log(`OK: ${label}`);
}

const minimalReport = {
  section_2_nature: {
    a_nature: { description: "a" },
    b_nature: { description: "b" },
  },
  meta: {
    psych_match: {
      axis_results: [
        {
          axis_key: "empathy",
          score_a: 60,
          score_b: 40,
          gap: 20,
          match_type: "complementary",
        },
        { broken: true },
        {
          axis_key: "stimulation",
          score_a: 70,
          score_b: 30,
          gap: 40,
          match_type: "tension",
        },
      ],
      conflict_triggers: [
        { axis_key: "stimulation", gap: 40, match_type: "tension" },
        null,
      ],
    },
  },
};

const parsed = parseRomanticDeepViewModel(minimalReport);
assert(parsed != null, "report parses with partial psych_match");
const axes = parsed?.meta?.psych_match?.axis_results ?? [];
assert(axes.length === 2, `keeps 2 valid axes (got ${axes.length})`);
assert(
  parsed?.meta?.psych_match?.conflict_triggers?.length === 1,
  "keeps 1 valid conflict trigger",
);

const sw = buildStrengthWeaknessLists(axes);
assert(
  sw.strengths.length + sw.weaknesses.length > 0,
  "strength/weakness lists from partial axes",
);
const chem = buildChemistryApproxScores(axes);
assert(chem != null, "chemistry approx from partial axes");

const emptyAxes = parseRomanticDeepViewModel({
  section_2_nature: {
    a_nature: { description: "a" },
    b_nature: { description: "b" },
  },
  meta: {
    psych_match: {
      axis_results: [{ bad: 1 }],
      conflict_triggers: [],
    },
  },
});
assert(
  emptyAxes?.meta?.psych_match == null,
  "all-invalid axes → psych_match null",
);

console.log("\nAll parse-psych-match-partial checks passed.");
