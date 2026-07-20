/**
 * Part2 A/B 실출력 4 fixture.
 * Run: npx tsx tests/manual/verify-family-part2-ab-fixtures.mjs
 */
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { resolveCorrectionStyleBucket } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function sajuJson(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

function countsFrom(saju) {
  const counts = {};
  for (const t of saju.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function synth({ sealCount, sealExcess, sealIsolated, punishmentCount = 0, karma = 0 }) {
  const band = sealIsolated
    ? "distant"
    : sealExcess
      ? "smothering"
      : sealCount >= 2
        ? "balanced"
        : "distant";
  return {
    year_karma: { year_branch_code: "ja", tension_hits: [], karma_tension_index: karma },
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

const childJson = sajuJson("2014-05-15");
const parentJson = sajuJson("1988-08-20");

function run(name, parentType, famParent, famChild, pair) {
  const report = buildFamilyParentReport({
    nicknameA: "아이",
    nicknameB: parentType === "mother" ? "엄마" : "아빠",
    roles: { roleA: "child", roleB: parentType },
    parentType,
    sajuJsonA: childJson,
    sajuJsonB: parentJson,
    familySignalsA: famChild,
    familySignalsB: famParent,
    pairFamily: pair,
    locale: "ko-KR",
  });
  const a = report.family.section_compare_table.find((r) => r.id === "correction_style");
  const b = report.family.section_compare_table.find((r) => r.id === "bond_distance");
  return {
    fixture: name,
    parentType,
    primitives: {
      parent_bond: famParent.seal_parent.parent_bond_band,
      child_bond: famChild.seal_parent.parent_bond_band,
      parent_style: resolveCorrectionStyleBucket(countsFrom(parentJson)).bucket,
      child_style: resolveCorrectionStyleBucket(countsFrom(childJson)).bucket,
    },
    pair: {
      nagging_band: pair.nagging_band,
      nagging_trigger_index: pair.nagging_trigger_index,
      umbilical_band: pair.umbilical_band,
      umbilical_separation_index: pair.umbilical_separation_index,
    },
    table: {
      A_title: a.label,
      A_parent: a.personParent.shortLabel,
      A_child: a.personChild.shortLabel,
      A_meaning: a.meaning,
      B_title: b.label,
      B_parent: b.personParent.shortLabel,
      B_child: b.personChild.shortLabel,
      B_meaning: b.meaning,
    },
  };
}

const balanced = synth({ sealCount: 2, sealExcess: false, sealIsolated: false });
const smother = synth({ sealCount: 4, sealExcess: true, sealIsolated: false });
const distant = synth({ sealCount: 0, sealExcess: false, sealIsolated: true });
const mildPair = buildPairFamilySignals(balanced, balanced);
const highUmbil = buildPairFamilySignals(smother, distant);
const highNag = buildPairFamilySignals(
  synth({ sealCount: 4, sealExcess: true, sealIsolated: false, punishmentCount: 3, karma: 80 }),
  synth({ sealCount: 0, sealExcess: false, sealIsolated: true, punishmentCount: 2, karma: 70 }),
);
const lowNag = mildPair;

const fixtures = [
  run("1_bond_balanced_umbilical_high", "mother", balanced, distant, highUmbil),
  run("1b_same_calc_father_context", "father", balanced, distant, highUmbil),
  run("2_bond_smothering_umbilical_from_pair", "mother", smother, smother, buildPairFamilySignals(smother, smother)),
  run("3_style_mild_pair_friction_high", "mother", balanced, balanced, highNag),
  run("4_style_from_birth_pair_friction_low", "father", distant, balanced, lowNag),
];

// mother/father same calc check on fixture 1
const m = fixtures[0];
const f = fixtures[1];
const sameCalc =
  m.table.A_parent === f.table.A_parent &&
  m.table.A_child === f.table.A_child &&
  m.table.B_parent === f.table.B_parent &&
  m.table.B_child === f.table.B_child &&
  m.pair.nagging_band === f.pair.nagging_band &&
  m.pair.umbilical_band === f.pair.umbilical_band &&
  m.table.A_title !== f.table.A_title &&
  m.table.B_title !== f.table.B_title;

console.log(
  JSON.stringify(
    {
      ok: true,
      mother_father_same_buckets_different_titles: sameCalc,
      fixtures,
      not_implemented: ["E home_climate", "F recognition_fit"],
    },
    null,
    2,
  ),
);
