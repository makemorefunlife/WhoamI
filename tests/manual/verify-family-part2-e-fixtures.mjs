/**
 * Part2 E 실출력 4 fixture (+ A/E independence).
 * Run: npx tsx tests/manual/verify-family-part2-e-fixtures.mjs
 */
import { buildFamilySajuCompareTable } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { resolveHomeClimateBand } from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";

const chartStub = {
  pillars: [
    { name: "년주", pillar: "x", stemCode: "gap", branchCode: "ja" },
    { name: "월주", pillar: "x", stemCode: "eul", branchCode: "chuk" },
    { name: "일주", pillar: "x", stemCode: "byeong", branchCode: "in" },
    { name: "시주", pillar: "x", stemCode: "jeong", branchCode: "myo" },
  ],
  stemCodes: new Set(["gap", "eul", "byeong", "jeong"]),
  branchCodes: new Set(["ja", "chuk", "in", "myo"]),
  dayStemCode: "byeong",
  dayBranchCode: "in",
  monthStemCode: "eul",
  monthBranchCode: "chuk",
  yearStemCode: "gap",
  yearBranchCode: "ja",
  hourStemCode: "jeong",
  hourBranchCode: "myo",
  dayPillar: "x",
};

function fam(conflictIndex, extras = {}) {
  return {
    year_karma: {
      year_branch_code: "ja",
      tension_hits: [],
      karma_tension_index: extras.karma ?? 0,
    },
    seal_parent: {
      seal_count: extras.sealCount ?? 2,
      seal_excess: extras.sealExcess ?? false,
      seal_isolated: extras.sealIsolated ?? false,
      parent_bond_band:
        extras.sealIsolated
          ? "distant"
          : extras.sealExcess
            ? "smothering"
            : (extras.sealCount ?? 2) >= 2
              ? "balanced"
              : "distant",
    },
    home_punishment: {
      punishment_hits: [],
      punishment_count: extras.punishmentCount ?? 0,
      family_conflict_index: conflictIndex,
    },
  };
}

function run(name, indexP, indexC) {
  const famP = fam(indexP);
  const famC = fam(indexC);
  const bandP = resolveHomeClimateBand(famP);
  const bandC = resolveHomeClimateBand(famC);

  function table(parentRole) {
    return buildFamilySajuCompareTable({
      parentNickname: parentRole === "mother" ? "엄마" : "아빠",
      childNickname: "아이",
      countsParent: { 정인: 1 },
      countsChild: { 식신: 1 },
      chartParent: chartStub,
      chartChild: chartStub,
      familySignalsParent: famP,
      familySignalsChild: famC,
      parentRole,
      locale: "ko-KR",
    }).find((r) => r.id === "home_climate");
  }

  const mother = table("mother");
  const father = table("father");
  return {
    fixture: name,
    primitives: {
      parent_conflict_index: bandP.sourceValue.family_conflict_index,
      child_conflict_index: bandC.sourceValue.family_conflict_index,
      parent_punishment_count: bandP.sourceValue.punishment_count,
      child_punishment_count: bandC.sourceValue.punishment_count,
    },
    person_band: { parent: bandP.bucket, child: bandC.bucket },
    pair_score: null,
    mother: {
      title: mother.label,
      parent: mother.personParent.shortLabel,
      child: mother.personChild.shortLabel,
      meaning: mother.meaning,
    },
    father: {
      title: father.label,
      parent: father.personParent.shortLabel,
      child: father.personChild.shortLabel,
      meaning: father.meaning,
    },
    labels_identical:
      mother.personParent.shortLabel === father.personParent.shortLabel &&
      mother.personChild.shortLabel === father.personChild.shortLabel,
  };
}

const independence = (() => {
  const climateLow = fam(15, { punishmentCount: 0, sealCount: 2 });
  const nagHigh = buildPairFamilySignals(
    fam(15, { punishmentCount: 3, sealCount: 4, sealExcess: true, karma: 80 }),
    fam(15, { punishmentCount: 2, sealCount: 0, sealIsolated: true, karma: 70 }),
  );
  const climateHigh = fam(85, { punishmentCount: 0, sealCount: 2 });
  const nagLow = buildPairFamilySignals(
    fam(85, { punishmentCount: 0, sealCount: 2 }),
    fam(85, { punishmentCount: 0, sealCount: 2 }),
  );
  return {
    nagging_high_climate_low: {
      nagging_band: nagHigh.nagging_band,
      climate_band: resolveHomeClimateBand(climateLow).bucket,
    },
    nagging_low_climate_high: {
      nagging_band: nagLow.nagging_band,
      climate_band: resolveHomeClimateBand(climateHigh).bucket,
    },
  };
})();

console.log(
  JSON.stringify(
    {
      fixtures: [
        run("1_low_low", 20, 10),
        run("2_low_high", 20, 80),
        run("3_medium_medium", 50, 55),
        run("4_high_high", 80, 90),
      ],
      a_e_independence: independence,
      pair_numeric_score: false,
      pair_numeric_reason:
        "person band combo meanings are sufficient; no PairFamilySignals climate field",
      not_implemented: ["F recognition_fit", "Part3 growth SSOT wiring"],
    },
    null,
    2,
  ),
);
