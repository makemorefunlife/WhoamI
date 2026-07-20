/**
 * Family Part2 C — guidance_balance.
 * Run: npx tsx tests/unit/family-part2-c.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveGuidanceProfile,
  resolveGuidanceFit,
} from "../../lib/personCore/sajuSignals/guidanceProfile.ts";
import { resolveParentingStyleLean } from "../../lib/personCore/sajuSignals/sharedPersonaSignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import {
  resolveGuidanceBalanceBucket,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { extractFamilySignals } from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    bundle,
    json: {
      saju: payload.saju,
      dayStemData: payload.dayStemData,
      dayBranchData: payload.dayBranchData,
      hiddenStemsData: payload.hiddenStemsData,
      tenGods: payload.tenGods,
      twelveStageData: payload.twelveStageData,
      relations: payload.relations,
      shinsals: payload.shinsals,
    },
  };
}

function countsFromJson(json) {
  const counts = {};
  for (const t of json.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function synthFamilySignals({ sealCount, sealExcess, sealIsolated }) {
  const band = sealIsolated
    ? "distant"
    : sealExcess
      ? "smothering"
      : sealCount >= 2
        ? "balanced"
        : "distant";
  return {
    year_karma: { year_branch_code: "ja", tension_hits: [], karma_tension_index: 0 },
    seal_parent: {
      seal_count: sealCount,
      seal_excess: sealExcess,
      seal_isolated: sealIsolated,
      parent_bond_band: band,
    },
    home_punishment: {
      punishment_hits: [],
      punishment_count: 0,
      family_conflict_index: 0,
    },
  };
}

section("1) guidance profile buckets");

assert.equal(resolveGuidanceProfile({ 정인: 3 }).mode, "receptive");
assert.equal(resolveGuidanceProfile({ 식신: 3 }).mode, "explanatory");
assert.equal(resolveGuidanceProfile({ 정관: 3 }).mode, "standards");
assert.equal(resolveGuidanceProfile({ 정인: 2, 식신: 2 }).mode, "mixed");
assert.equal(resolveGuidanceProfile({ 정인: 2, 정관: 2 }).mode, "mixed");
assert.equal(resolveGuidanceProfile({ 식신: 2, 정관: 2 }).mode, "mixed");
assert.equal(resolveGuidanceProfile({}).mode, "mixed");
assert.equal(resolveGuidanceProfile({ 비견: 4 }).mode, "mixed"); // wealth/self만 → 3채널 전부 0
ok("all modes: receptive / explanatory / standards / mixed (+ empty & self-only)");

section("2) not a rename of parenting_style_lean");

const sealHeavy = { 정인: 3, 식신: 0, 정관: 0 };
const foodHeavy = { 식신: 3 };
const officerHeavy = { 정관: 3, 정인: 0, 식신: 0 };
// lean collapses seal+officer vs food; C keeps seal vs officer distinct
assert.equal(resolveParentingStyleLean(sealHeavy), "structure");
assert.equal(resolveGuidanceProfile(sealHeavy).mode, "receptive");
assert.equal(resolveParentingStyleLean(officerHeavy), "structure");
assert.equal(resolveGuidanceProfile(officerHeavy).mode, "standards");
assert.equal(resolveParentingStyleLean(foodHeavy), "empathy");
assert.equal(resolveGuidanceProfile(foodHeavy).mode, "explanatory");
ok("lean structure splits into receptive vs standards on C");

section("3) pair fit");

assert.equal(resolveGuidanceFit("receptive", "receptive"), "aligned");
assert.equal(resolveGuidanceFit("standards", "standards"), "aligned");
assert.equal(resolveGuidanceFit("receptive", "standards"), "mismatch");
assert.equal(resolveGuidanceFit("explanatory", "standards"), "mismatch");
assert.equal(resolveGuidanceFit("receptive", "mixed"), "partial");
assert.equal(resolveGuidanceFit("mixed", "standards"), "partial");
assert.equal(resolveGuidanceFit("mixed", "mixed"), "aligned");

const pairAligned = buildPairFamilySignals(
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  { modeA: "receptive", modeB: "receptive" },
);
assert.equal(pairAligned.guidance_fit, "aligned");
const pairMismatch = buildPairFamilySignals(
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  { modeA: "receptive", modeB: "standards" },
);
assert.equal(pairMismatch.guidance_fit, "mismatch");
ok("fit: aligned / partial / mismatch + PairFamilySignals.guidance_fit");

section("4) parentRole invariant calc");

const child = sajuFromBirth("2014-05-15");
const parent = sajuFromBirth("1988-08-20");
const famChild = extractFamilySignals(child.bundle);
const famParent = extractFamilySignals(parent.bundle);
const modeP = resolveGuidanceProfile(countsFromJson(parent.json)).mode;
const modeC = resolveGuidanceProfile(countsFromJson(child.json)).mode;
const pair = buildPairFamilySignals(famParent, famChild, {
  modeA: modeP,
  modeB: modeC,
});

function buildReport(parentType, locale = "ko-KR") {
  return buildFamilyParentReport({
    nicknameA: "아이",
    nicknameB: parentType === "mother" ? "엄마" : "아빠",
    roles: { roleA: "child", roleB: parentType },
    parentType,
    sajuJsonA: child.json,
    sajuJsonB: parent.json,
    familySignalsA: famChild,
    familySignalsB: famParent,
    pairFamily: pair,
    locale,
  });
}

const mother = buildReport("mother");
const father = buildReport("father");
const cM = mother.family.section_compare_table.find((r) => r.id === "guidance_balance");
const cF = father.family.section_compare_table.find((r) => r.id === "guidance_balance");
assert.equal(cM.personParent.shortLabel, cF.personParent.shortLabel);
assert.equal(cM.personChild.shortLabel, cF.personChild.shortLabel);
assert.notEqual(cM.label, cF.label);
assert.ok(cM.meaning !== cF.meaning || cM.label !== cF.label);
ok("parentRole: person labels identical; titles/context differ");

section("5) A/B unchanged ids + 11축 unused");

const aRow = mother.family.section_compare_table.find((r) => r.id === "correction_style");
const bRow = mother.family.section_compare_table.find((r) => r.id === "bond_distance");
assert.ok(aRow && bRow);
assert.equal(resolveGuidanceBalanceBucket(countsFromJson(parent.json)).bucket, modeP);
// no psych input on compare table path — determinism
const again = buildReport("mother");
assert.equal(
  again.family.section_compare_table.find((r) => r.id === "guidance_balance").personParent.shortLabel,
  cM.personParent.shortLabel,
);
ok("A/B rows present; C deterministic without psych");

section("6) locale en-US Hangul-free");

const en = buildReport("mother", "en-US");
const enC = en.family.section_compare_table.find((r) => r.id === "guidance_balance");
assert.ok(!/[ㄱ-ㅎ가-힣]/.test(enC.label + enC.personParent.shortLabel + enC.meaning));
ok("en-US C Hangul-free");

section("7) parenting_style_lean regression (marriage path untouched)");

assert.equal(resolveParentingStyleLean({ 식신: 3 }), "empathy");
assert.equal(resolveParentingStyleLean({ 정인: 2, 정관: 1 }), "structure");
ok("lean still binary empathy/structure");

section("8) cache / schema ids");

const ids = mother.family.section_compare_table.map((r) => r.id);
assert.deepEqual(ids, [
  "correction_style",
  "bond_distance",
  "affection_expression",
  "guidance_balance",
  "gathering_recovery",
  "home_climate",
]);
const { isFamilyParentChildDeepReport, FAMILY_PARENT_CHILD_DEEP_FORMAT } =
  await import("../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts");
assert.equal(
  isFamilyParentChildDeepReport({ format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: mother }),
  true,
);
ok("row ids + deep cache validator");

console.log("\nAll family-part2-c tests passed.");
