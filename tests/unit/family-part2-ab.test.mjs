/**
 * Family Part2 A/B — correction_style + bond_distance.
 * Run: npx tsx tests/unit/family-part2-ab.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import {
  resolveCorrectionStyleBucket,
  resolveBondDistanceBucket,
  buildFamilySajuCompareTable,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { resolveParentBondBandFromCounts } from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { profileTenGods } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
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

function countsFromJson(sajuJson) {
  const counts = {};
  for (const t of sajuJson.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

/** Synthetic FamilySajuSignals for band control (existing thresholds only). */
function synthFamilySignals({ sealCount, sealExcess, sealIsolated, punishmentCount = 0, karma = 0 }) {
  const band = sealIsolated
    ? "distant"
    : sealExcess
      ? "smothering"
      : sealCount >= 2
        ? "balanced"
        : "distant";
  return {
    year_karma: {
      year_branch_code: "ja",
      tension_hits: [],
      karma_tension_index: karma,
    },
    seal_parent: {
      seal_count: sealCount,
      seal_excess: sealExcess,
      seal_isolated: sealIsolated,
      parent_bond_band: band,
    },
    home_punishment: {
      punishment_hits: [],
      punishment_count: punishmentCount,
      family_conflict_index: punishmentCount * 25,
    },
  };
}

const child = sajuFromBirth("2014-05-15");
const parent = sajuFromBirth("1988-08-20");
const famChild = extractFamilySignals(child.bundle);
const famParent = extractFamilySignals(parent.bundle);

function buildReport(parentType, extras = {}) {
  return buildFamilyParentReport({
    nicknameA: "아이",
    nicknameB: parentType === "mother" ? "엄마" : "아빠",
    roles: { roleA: "child", roleB: parentType },
    parentType,
    sajuJsonA: child.json,
    sajuJsonB: parent.json,
    familySignalsA: extras.familySignalsChild ?? famChild,
    familySignalsB: extras.familySignalsParent ?? famParent,
    pairFamily: extras.pairFamily,
    locale: extras.locale ?? "ko-KR",
  });
}

// ---------------------------------------------------------------------------
section("A) correction_style buckets + pair friction");

const styleBuckets = new Set();
for (const date of ["1990-01-15", "1992-06-01", "1985-11-20", "2000-03-08", "1988-08-20", "2014-05-15"]) {
  const { json } = sajuFromBirth(date);
  styleBuckets.add(resolveCorrectionStyleBucket(countsFromJson(json)).bucket);
}
assert.ok(styleBuckets.size >= 2, "correction style should vary across births");
ok(`correction_style buckets observed: ${[...styleBuckets].join(",")}`);

const mildPair = buildPairFamilySignals(
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false, punishmentCount: 0, karma: 0 }),
  synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false, punishmentCount: 0, karma: 0 }),
);
assert.equal(mildPair.nagging_band, "low");
ok(`same person-ish mild pair → nagging_band=${mildPair.nagging_band} index=${mildPair.nagging_trigger_index}`);

const hotPair = buildPairFamilySignals(
  synthFamilySignals({ sealCount: 4, sealExcess: true, sealIsolated: false, punishmentCount: 3, karma: 80 }),
  synthFamilySignals({ sealCount: 0, sealExcess: false, sealIsolated: true, punishmentCount: 2, karma: 70 }),
);
assert.equal(hotPair.nagging_band, "high");
ok(`reactive pair friction → nagging_band=${hotPair.nagging_band}`);

const motherA = buildReport("mother", {
  familySignalsParent: synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  familySignalsChild: synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  pairFamily: mildPair,
});
const fatherA = buildReport("father", {
  familySignalsParent: synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  familySignalsChild: synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false }),
  pairFamily: mildPair,
});
const mRowA = motherA.family.section_compare_table.find((r) => r.id === "correction_style");
const fRowA = fatherA.family.section_compare_table.find((r) => r.id === "correction_style");
assert.equal(mRowA.personParent.shortLabel, fRowA.personParent.shortLabel);
assert.equal(mRowA.personChild.shortLabel, fRowA.personChild.shortLabel);
assert.notEqual(mRowA.label, fRowA.label);
ok("parentRole changes A title/context only — person shortLabels identical");

// ---------------------------------------------------------------------------
section("B) bond_distance bands + umbilical independence");

assert.equal(resolveParentBondBandFromCounts({ 정인: 0, 편인: 0 }), "distant");
assert.equal(resolveParentBondBandFromCounts({ 정인: 2 }), "balanced");
assert.equal(resolveParentBondBandFromCounts({ 정인: 3 }), "smothering");
ok("parent_bond_band thresholds: 0→distant, ≥2→balanced, ≥3→smothering");

const balancedBond = synthFamilySignals({ sealCount: 2, sealExcess: false, sealIsolated: false });
const smotherBond = synthFamilySignals({ sealCount: 4, sealExcess: true, sealIsolated: false });
const distantBond = synthFamilySignals({ sealCount: 0, sealExcess: false, sealIsolated: true });

const umbilHigh = buildPairFamilySignals(smotherBond, distantBond);
assert.equal(umbilHigh.umbilical_band, "high");
ok(`smothering+distant → umbilical_band=${umbilHigh.umbilical_band}`);

const umbilLow = buildPairFamilySignals(balancedBond, balancedBond);
assert.ok(umbilLow.umbilical_band === "low" || umbilLow.umbilical_band === "medium");
ok(`balanced+balanced → umbilical_band=${umbilLow.umbilical_band} (not forced by origin tension)`);

const motherB = buildReport("mother", {
  familySignalsParent: balancedBond,
  familySignalsChild: distantBond,
  pairFamily: umbilHigh,
});
const fatherB = buildReport("father", {
  familySignalsParent: balancedBond,
  familySignalsChild: distantBond,
  pairFamily: umbilHigh,
});
const mRowB = motherB.family.section_compare_table.find((r) => r.id === "bond_distance");
const fRowB = fatherB.family.section_compare_table.find((r) => r.id === "bond_distance");
assert.equal(mRowB.personParent.shortLabel, fRowB.personParent.shortLabel);
assert.equal(mRowB.personChild.shortLabel, fRowB.personChild.shortLabel);
assert.ok(mRowB.label.includes("보호") || mRowB.label.includes("독립"));
assert.ok(fRowB.label.includes("관여") || fRowB.label.includes("자율"));
ok("B: same bond labels; mother/father titles differ; umbilical drives meaning");

// origin tension must not override bond bucket
const bondFromSignals = resolveBondDistanceBucket({}, balancedBond);
assert.equal(bondFromSignals.bucket, "balanced");
ok("origin_family_tension does not set B bucket — parent_bond_band does");

// ---------------------------------------------------------------------------
section("11축 — unused (bucket unchanged without psych)");

const withPsychShape = buildReport("mother");
const rowA1 = withPsychShape.family.section_compare_table.find((r) => r.id === "correction_style");
const rowB1 = withPsychShape.family.section_compare_table.find((r) => r.id === "bond_distance");
const again = buildReport("mother");
assert.equal(rowA1.personParent.shortLabel, again.family.section_compare_table.find((r) => r.id === "correction_style").personParent.shortLabel);
assert.equal(rowB1.personParent.shortLabel, again.family.section_compare_table.find((r) => r.id === "bond_distance").personParent.shortLabel);
ok("A/B buckets deterministic without psych input (11축 not in calculation)");

// ---------------------------------------------------------------------------
section("locale + schema ids");

const en = buildReport("mother", { locale: "en-US", pairFamily: mildPair });
const enIds = en.family.section_compare_table.map((r) => r.id);
assert.deepEqual(enIds.slice(0, 2), ["correction_style", "bond_distance"]);
assert.ok(!/[ㄱ-ㅎ가-힣]/.test(en.family.section_compare_table[0].label));
ok("en-US A/B titles Hangul-free; ids correction_style, bond_distance");

const { isFamilyParentChildDeepReport, FAMILY_PARENT_CHILD_DEEP_FORMAT } =
  await import("../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts");
assert.equal(
  isFamilyParentChildDeepReport({ format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: motherA }),
  true,
);
ok("premium cache validator accepts A/B payload");

console.log("\nAll family-part2-ab tests passed.");
