/**
 * Part2 C 실출력 4 fixture.
 * Run: npx tsx tests/manual/verify-family-part2-c-fixtures.mjs
 */
import { buildFamilySajuCompareTable } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import {
  resolveGuidanceProfile,
  resolveGuidanceFit,
} from "../../lib/personCore/sajuSignals/guidanceProfile.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";

function neutralChart() {
  const bundle = calculateSajuBundle({ birthDate: "1990-01-15", birthTime: "12:00" });
  return bundle.chart;
}

function synthFam(sealCount) {
  const sealExcess = sealCount >= 3;
  const sealIsolated = sealCount === 0;
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

function run(name, countsParent, countsChild) {
  const profileP = resolveGuidanceProfile(countsParent);
  const profileC = resolveGuidanceProfile(countsChild);
  const fit = resolveGuidanceFit(profileP.mode, profileC.mode);
  const famP = synthFam(profileP.scores.receptive);
  const famC = synthFam(profileC.scores.receptive);
  const pair = buildPairFamilySignals(famP, famC, {
    modeA: profileP.mode,
    modeB: profileC.mode,
  });
  const chart = neutralChart();

  function table(parentRole) {
    return buildFamilySajuCompareTable({
      parentNickname: parentRole === "mother" ? "엄마" : "아빠",
      childNickname: "아이",
      countsParent,
      countsChild,
      chartParent: chart,
      chartChild: chart,
      familySignalsParent: famP,
      familySignalsChild: famC,
      pairFamily: pair,
      parentRole,
      locale: "ko-KR",
    }).find((r) => r.id === "guidance_balance");
  }

  const mother = table("mother");
  const father = table("father");

  return {
    fixture: name,
    primitives: {
      parent: profileP.scores,
      child: profileC.scores,
    },
    person_guidance: {
      parent: profileP.mode,
      child: profileC.mode,
    },
    pair: {
      guidance_fit: pair.guidance_fit,
      fit_direct: fit,
    },
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
    psych: "unused",
    labels_identical:
      mother.personParent.shortLabel === father.personParent.shortLabel &&
      mother.personChild.shortLabel === father.personChild.shortLabel,
    titles_differ: mother.label !== father.label,
  };
}

const fixtures = [
  run("1_receptive_receptive", { 정인: 3 }, { 편인: 2 }),
  run("2_receptive_standards", { 정인: 3 }, { 정관: 3 }),
  run("3_explanatory_standards", { 식신: 3 }, { 편관: 2 }),
  run("4_mixed_included", { 정인: 2, 식신: 2 }, { 정관: 3 }),
];

console.log(
  JSON.stringify(
    {
      fixtures,
      not_implemented: [
        "F recognition_fit",
        "Part3 growth SSOT wiring",
        "Part4 parent_lens_summary SSOT wiring",
      ],
    },
    null,
    2,
  ),
);
