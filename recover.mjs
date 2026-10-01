import fs from "fs";

const dumpScript = `import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
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

const narrativeModules = buildRomanticPremiumNarrative(vm);
console.log(JSON.stringify(narrativeModules, null, 2));`;

const testMatrixScript = `import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";

const baseReport = (romanticExperienceCompleteFixture as any).report || romanticExperienceCompleteFixture;

const runTest = (name: string, reportData: any, myName: string, partnerName: string) => {
  try {
    const vm = buildRomanticExperienceViewModel({
      report: reportData,
      viewerIsReportA: true,
      myName,
      partnerName,
      nameA: myName,
      nameB: partnerName,
    });
    const narrative = buildRomanticPremiumNarrative(vm);
    const textOutput = JSON.stringify(narrative, null, 2);
    const BANNED_TERMS = ["Affinity", "Chemistry", "Sensitivity", "need/give", "primary", "canonical", "saju frame", "Gap", "pts", "tension axis", "표현력", "수용력", "숙성 쪽", "(이)", "(가)", "(은)", "(는)"];
    let failed = false;
    for (const term of BANNED_TERMS) {
      if (textOutput.includes(term)) {
        console.error(\`[\${name}] FAIL: Banned term "\${term}"\`);
        failed = true;
      }
    }
    if (textOutput.includes("가지 영역") && !textOutput.includes(" 및 ")) {
      console.error(\`[\${name}] FAIL: Generic 'N가지 영역' found without explicitly naming the areas.\`);
      failed = true;
    }
    if (narrative.length > 0) {
       const finalConclusion = narrative.find(n => n.id === "final_conclusion");
       if (finalConclusion && finalConclusion.answer === vm.opening.signature) {
           console.error(\`[\${name}] FAIL: Identical Hero and Ending copy.\`);
           failed = true;
       }
    }
    if (textOutput.includes("meets B")) {
       console.error(\`[\${name}] FAIL: Placeholder 'meets B' found.\`);
       failed = true;
    }
    if (!failed) {
      console.log(\`[\${name}] PASS\`);
    } else {
      process.exit(1);
    }
  } catch (err: any) {
    console.error(\`[\${name}] FAIL: Exception - \${err.message}\`);
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

console.log("ALL TESTS PASSED.");`;

const verifyScript = `import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
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

const narrativeModules = buildRomanticPremiumNarrative(vm);
const textOutput = JSON.stringify(narrativeModules, null, 2);

const BANNED_TERMS = [
  "Affinity", "Chemistry", "Sensitivity", "need/give", "primary", "canonical", "saju frame",
  "Gap", "pts", "tension axis", "표현력", "수용력", "숙성 쪽", "(이)", "(가)", "(은)", "(는)"
];

let failed = false;
for (const term of BANNED_TERMS) {
  if (textOutput.includes(term)) {
    console.error(\`FAIL: Banned term "\${term}" found in narrative output.\`);
    failed = true;
  }
}

if (!failed) {
  console.log("PASS: No banned terms found in narrative output.");
} else {
  process.exit(1);
}`;

fs.writeFileSync("tests/scripts/dump-romantic-v2-copy.ts", dumpScript);
fs.writeFileSync("tests/scripts/test-matrix.ts", testMatrixScript);
fs.writeFileSync("tests/scripts/verify-romantic-v2-copy.ts", verifyScript);

console.log("Files restored");
