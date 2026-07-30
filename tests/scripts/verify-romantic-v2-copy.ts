import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";

const vm = buildRomanticExperienceViewModel({
  report: (romanticExperienceCompleteFixture as any).report || romanticExperienceCompleteFixture as any,
  viewerIsReportA: true,
  myName: "지민",
  partnerName: "정우",
  nameA: "지민",
  nameB: "정우",
});

const narrativeModules = buildRomanticPremiumNarrative(vm, romanticExperienceCompleteFixture as any);
const textOutput = JSON.stringify(narrativeModules, null, 2);

const BANNED_TERMS = [
  "Affinity", "Chemistry", "Sensitivity", "need/give", "primary", "canonical", "saju frame",
  "Gap", "pts", "tension axis", "표현력", "수용력", "숙성 쪽", "(이)", "(가)", "(은)", "(는)"
];

let failed = false;
for (const term of BANNED_TERMS) {
  if (textOutput.includes(term)) {
    console.error(`FAIL: Banned term "${term}" found in narrative output.`);
    failed = true;
  }
}

if (!failed) {
  console.log("PASS: No banned terms found in narrative output.");
} else {
  process.exit(1);
}