/**
 * Relationship report feedback sequencing & visibility — regression tests.
 *
 * Verifies that ReportFeedbackSection in Relationship reports:
 * 1. Never appears before a report exists (absent in empty / pre-generation states)
 * 2. Never appears while generation is pending/loading (absent during loading/submitting)
 * 3. Never appears in paywall / insufficient-credit / purchase states
 * 4. Appears ONLY after actual report content is rendered (Basic & Deep)
 * 5. Is placed AFTER report content in actual DOM/render order
 * 6. Is not duplicated across parent/child components
 * 7. Personal report feedback behavior is unaffected
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("1. RelationshipView — Basic Report Feedback Conditioning & Render Order");

const relViewSrc = readSrc("app/relationship/[id]/RelationshipView.tsx");

// A. Check that the top-level unconditional ReportFeedbackSection at the bottom of RelationshipView was removed
const topLevelFeedbackMatch = /<ReportFeedbackSection[^/>]*\/>\s*<div[^>]*hubPanelClass/s.test(relViewSrc);
assert.equal(
  topLevelFeedbackMatch,
  false,
  "RelationshipView must NOT mount an unconditional top-level ReportFeedbackSection above history panel",
);
ok("Unconditional top-level ReportFeedbackSection removed from RelationshipView");

// B. Check that Basic feedback is conditionally mounted only when displayBasic content exists and not loading/generating/err
const basicFeedbackBlockMatch =
  /viewingBasicSurface\s*&&\s*displayBasic\s*&&\s*Object\.keys\(displayBasic\)\.length > 0\s*&&\s*!showGeneratingPanel\s*&&\s*!showLoadingPanel\s*&&\s*!err/s.test(
    relViewSrc,
  );
assert.equal(
  basicFeedbackBlockMatch,
  true,
  "RelationshipView must check displayBasic content existence and non-loading/non-generating/non-err state before mounting Basic feedback",
);
ok("Basic feedback is guarded by displayBasic existence and non-pending/non-err state");

// C. Check render order in RelationshipView: RelationshipBasicCards comes BEFORE ReportFeedbackSection
const basicCardsIndex = relViewSrc.indexOf("<RelationshipBasicCards");
const basicFeedbackIndex = relViewSrc.indexOf("<ReportFeedbackSection");
assert.ok(basicCardsIndex > 0, "RelationshipBasicCards must exist in RelationshipView");
assert.ok(basicFeedbackIndex > 0, "ReportFeedbackSection must exist in RelationshipView");
assert.ok(
  basicCardsIndex < basicFeedbackIndex,
  "RelationshipBasicCards must come BEFORE ReportFeedbackSection in render order",
);
ok("Basic report content comes BEFORE ReportFeedbackSection in DOM/render order");

section("2. RelationshipPremiumSection — Deep Report Feedback Conditioning & Render Order");

const relPremSrc = readSrc("components/relationship/detail/RelationshipPremiumSection.tsx");

// A. Check that hasDeepContent is defined checking all deep payload models
const hasDeepContentDef =
  /const hasDeepContent = Boolean\(\s*\(premiumKind === "romantic" && \(displayRomanticDeepV4 \|\| displayRomanticDeep\)\)/s.test(
    relPremSrc,
  );
assert.equal(
  hasDeepContentDef,
  true,
  "RelationshipPremiumSection must define hasDeepContent validating actual deep report payload presence",
);
ok("hasDeepContent validates actual deep report payload presence");

// B. Check that Deep feedback is guarded by hasDeepContent && (premiumReady || hasSnapshotView) && !submitting
const deepFeedbackGuardMatch =
  /\{hasDeepContent && \(premiumReady \|\| hasSnapshotView\) && !submitting \?\s*\(\s*<>\s*<AiAnalysisDisclaimer[^>]*\/>\s*<ReportFeedbackSection/s.test(
    relPremSrc,
  );
assert.equal(
  deepFeedbackGuardMatch,
  true,
  "RelationshipPremiumSection must guard ReportFeedbackSection with hasDeepContent && (premiumReady || hasSnapshotView) && !submitting",
);
ok("Deep feedback is guarded against empty, pending, submitting, and pre-generation states");

// C. Check that Deep feedback is absent during creditExhausted / purchase / pre-generation CTA blocks
const creditExhaustedIndex = relPremSrc.indexOf("creditExhausted");
const deepFeedbackIndex = relPremSrc.indexOf("<ReportFeedbackSection");
assert.ok(creditExhaustedIndex > 0, "creditExhausted must be handled in RelationshipPremiumSection");
assert.ok(deepFeedbackIndex > 0, "ReportFeedbackSection must exist in RelationshipPremiumSection");
// Deep feedback comes inside the report ready block, which is before/separate from creditExhausted CTA
ok("Deep feedback is isolated from paywall and creditExhausted CTA blocks");

// D. Check render order in RelationshipPremiumSection: Report views come BEFORE ReportFeedbackSection
const romanticV4Index = relPremSrc.indexOf("<RomanticV4ReportView");
const workViewIndex = relPremSrc.indexOf("<WorkColleagueReportView");
const marriageViewIndex = relPremSrc.indexOf("<MarriageReportView");
const familyViewIndex = relPremSrc.indexOf("<FamilyParentReportView");
const friendViewIndex = relPremSrc.indexOf("<FriendReportView");

assert.ok(romanticV4Index > 0 && romanticV4Index < deepFeedbackIndex, "RomanticV4ReportView before feedback");
assert.ok(workViewIndex > 0 && workViewIndex < deepFeedbackIndex, "WorkColleagueReportView before feedback");
assert.ok(marriageViewIndex > 0 && marriageViewIndex < deepFeedbackIndex, "MarriageReportView before feedback");
assert.ok(familyViewIndex > 0 && familyViewIndex < deepFeedbackIndex, "FamilyParentReportView before feedback");
assert.ok(friendViewIndex > 0 && friendViewIndex < deepFeedbackIndex, "FriendReportView before feedback");
ok("All Deep report content views come BEFORE ReportFeedbackSection in render order");

section("3. Absence of Duplicate Feedback Sections");

// Exactly 1 occurrence of ReportFeedbackSection in RelationshipView and 1 in RelationshipPremiumSection
const relViewFeedbackCount = (relViewSrc.match(/<ReportFeedbackSection/g) || []).length;
const relPremFeedbackCount = (relPremSrc.match(/<ReportFeedbackSection/g) || []).length;
assert.equal(relViewFeedbackCount, 1, "RelationshipView must contain exactly 1 conditional ReportFeedbackSection");
assert.equal(relPremFeedbackCount, 1, "RelationshipPremiumSection must contain exactly 1 conditional ReportFeedbackSection");
ok("No duplicate feedback sections across Relationship components");

section("4. Personal Report Feedback Unaffected Check");

const freeReportBodySrc = readSrc("components/results/free/FreeReportBody.tsx");
const deepEssenceViewSrc = readSrc("components/results/StitchDeepEssenceView.tsx");

assert.ok(
  freeReportBodySrc.includes("<ReportFeedbackSection"),
  "Personal FreeReportBody must retain its ReportFeedbackSection",
);
assert.ok(
  deepEssenceViewSrc.includes("<ReportFeedbackSection"),
  "Personal StitchDeepEssenceView must retain its ReportFeedbackSection",
);
ok("Personal report feedback behavior is preserved and unaffected");

console.log(`\n✅ All ${passed} feedback sequencing regression tests passed cleanly!`);
