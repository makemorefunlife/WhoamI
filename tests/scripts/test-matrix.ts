import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";
import type { RomanticSajuDeepReport } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type RomanticReportBody = RomanticSajuDeepReport["report"];
const baseReport = romanticExperienceCompleteFixture as RomanticReportBody;

const runTest = (name: string, reportData: RomanticReportBody, myName: string, partnerName: string) => {
  try {
    const vm = buildRomanticExperienceViewModel({
      report: reportData,
      viewerIsReportA: true,
      myName,
      partnerName,
      nameA: myName,
      nameB: partnerName,
    });
    const narrative = buildRomanticPremiumNarrative(vm, reportData);
    const textOutput = JSON.stringify(narrative, null, 2);
    const BANNED_TERMS = ["Affinity", "Chemistry", "Sensitivity", "need/give", "primary", "canonical", "saju frame", "Gap", "pts", "tension axis", "표현력", "수용력", "숙성 쪽", "(이)", "(가)", "(은)", "(는)"];
    let failed = false;
    for (const term of BANNED_TERMS) {
      if (textOutput.includes(term)) {
        console.error(`[${name}] FAIL: Banned term "${term}"`);
        failed = true;
      }
    }
    if (textOutput.includes("가지 영역") && !textOutput.includes(" 및 ")) {
      console.error(`[${name}] FAIL: Generic 'N가지 영역' found without explicitly naming the areas.`);
      failed = true;
    }
    if (narrative.length > 0) {
       const finalConclusion = narrative.find(n => n.id === "final_conclusion");
       if (finalConclusion && finalConclusion.answer === vm.opening.signature) {
           console.error(`[${name}] FAIL: Identical Hero and Ending copy.`);
           failed = true;
       }
    }
    if (textOutput.includes("meets B")) {
       console.error(`[${name}] FAIL: Placeholder 'meets B' found.`);
       failed = true;
    }
    if (!failed) {
      console.log(`[${name}] PASS`);
    } else {
      process.exit(1);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${name}] FAIL: Exception - ${errorMsg}`);
    process.exit(1);
  }
};

runTest("Complete Fixture", baseReport, "지민", "정우");

const missingReport = JSON.parse(JSON.stringify(baseReport));
delete missingReport.section_4_hidden_hearts;
delete missingReport.section_2_nature.comparison_table;
runTest("Null/Optional Fields", missingReport, "지민", "정우");

const emptySignalsReport = JSON.parse(JSON.stringify(baseReport));
emptySignalsReport.canonical_projections = {};
runTest("Empty Signals", emptySignalsReport, "지민", "정우");

runTest("Korean Name Pair 2", baseReport, "하은", "서연");
runTest("English Name Pair", baseReport, "Alex", "Sam");

console.log("ALL TESTS PASSED.");