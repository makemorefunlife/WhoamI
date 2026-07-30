/**
 * Romantic V2 production-readiness regression checks.
 * Run: npx tsx tests/scripts/verify-romantic-v2-readiness.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  romanticExperienceCompleteFixture,
  romanticExperienceMinimalFixture,
  romanticExperienceStructuralTensionFixture,
} from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";
import { ROMANTIC_V2_CHAPTER_ORDER } from "../../components/relationship/romantic/experience/RomanticExperienceView";
import {
  isRomanticExperienceV2Enabled,
  shouldRenderRomanticExperienceV2,
} from "../../lib/relationship/romantic/experience/romanticExperienceFlag";

let failed = false;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed = true;
  }
}

function vmFor(report: unknown) {
  return buildRomanticExperienceViewModel({
    report: report as any,
    viewerIsReportA: true,
    myName: "지민",
    partnerName: "정우",
    nameA: "지민",
    nameB: "정우",
    locale: "ko-KR",
  });
}

const viewSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/relationship/romantic/experience/RomanticExperienceView.tsx"),
  "utf8",
);
const modulesSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/relationship/romantic/experience/RomanticExperienceModules.tsx"),
  "utf8",
);
const premiumSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/relationship/detail/RelationshipPremiumSection.tsx"),
  "utf8",
);
const previewSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/dev/romantic-v2-visual/PreviewClient.tsx"),
  "utf8",
);

const heroMatch = modulesSource.match(
  /export function RomanticHeroSection[\s\S]*?(?=export function RomanticSnapshotSection)/,
);
check(
  "Hero section has no ScoreBoard / eventScores",
  Boolean(heroMatch && !heroMatch[0].includes("ScoreBoard") && !heroMatch[0].includes("eventScores")),
);

check(
  "Default V2 journey does not render PremiumNarrativeCard stack",
  !viewSource.includes("PremiumNarrativeCard") &&
    !viewSource.includes('getModule("how_we_experience")') &&
    !viewSource.includes('getModule("actual_needs")') &&
    !viewSource.includes('getModule("final_conclusion")'),
);

check(
  "Axis Comparison follows Difference Map in View",
  viewSource.indexOf("RomanticDifferenceMapSection") <
    viewSource.indexOf("RomanticAxisComparisonSection") &&
    viewSource.indexOf("RomanticAxisComparisonSection") <
      viewSource.indexOf("RomanticFlowSection"),
);

check(
  "Conflict → Hidden Heart → Special order in View",
  viewSource.indexOf("RomanticConflictSection") <
    viewSource.indexOf("RomanticHiddenHeartSection") &&
    viewSource.indexOf("RomanticHiddenHeartSection") <
      viewSource.indexOf("RomanticSpecialSection"),
);

check(
  "Action Advice and Reflection are mounted",
  viewSource.includes("RomanticActionAdviceSection") &&
    viewSource.includes("RomanticReflectionSection") &&
    viewSource.includes("RomanticSnapshotSection"),
);

check(
  "Production and dev share RomanticExperienceView",
  premiumSource.includes("RomanticExperienceView") &&
    previewSource.includes("RomanticExperienceView"),
);

check(
  "Chapter order constant places Heart after Conflict",
  ROMANTIC_V2_CHAPTER_ORDER.indexOf("conflict") <
    ROMANTIC_V2_CHAPTER_ORDER.indexOf("hiddenHeart"),
);

const complete = vmFor(romanticExperienceCompleteFixture);
check("Complete: Hidden Heart available", complete.hiddenHeart.available);
check("Complete: Snapshot available", complete.snapshot.available);
check(
  "Complete: Difference relationshipMeaning populated",
  complete.differenceMap.buckets.every((b) =>
    b.items.every((i) => (i.relationshipMeaning?.length ?? 0) > 10),
  ),
);
check(
  "Complete: Conflict meant/heard stay null",
  complete.conflictTranslation.rows.every((r) => r.meant === null && r.heard === null),
);
check(
  "Complete: Essence has no ASCII meeting stubs",
  !JSON.stringify(complete.essence).includes("meets B") &&
    !JSON.stringify(complete.essence).includes("meets A"),
);

const tension = vmFor(romanticExperienceStructuralTensionFixture);
check("Tension: Conflict available", tension.conflictTranslation.available);

const minimal = vmFor(romanticExperienceMinimalFixture);
check("Minimal: Opening available", minimal.opening.available);
check(
  "Minimal: Conflict omitted or empty without throw",
  !minimal.conflictTranslation.available ||
    minimal.conflictTranslation.rows.length === 0,
);

const narrative = buildRomanticPremiumNarrative(
  complete,
  romanticExperienceCompleteFixture as any,
);
const narrativeText = JSON.stringify(narrative);
for (const term of ["Affinity", "Chemistry", "canonical", "saju frame"]) {
  check(`Underlying narrative synthesis avoids "${term}"`, !narrativeText.includes(term));
}

check("Flag default is off", isRomanticExperienceV2Enabled({}) === false);
check(
  "Flag enables romantic V2 only",
  shouldRenderRomanticExperienceV2("romantic", { ROMANTIC_EXPERIENCE_V2: "1" }) &&
    !shouldRenderRomanticExperienceV2("friend", { ROMANTIC_EXPERIENCE_V2: "1" }),
);
check(
  "LEGACY override wins",
  !shouldRenderRomanticExperienceV2("romantic", {
    ROMANTIC_EXPERIENCE_V2: "1",
    ROMANTIC_EXPERIENCE_LEGACY: "1",
  }),
);

if (failed) {
  console.error("\nOne or more readiness checks FAILED.");
  process.exit(1);
}
console.log("\nAll romantic V2 readiness checks PASSED.");
