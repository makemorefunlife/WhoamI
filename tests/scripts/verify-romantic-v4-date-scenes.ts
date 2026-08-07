/**
 * One-off verification for the Romantic V4 "6 date-scene items" batch.
 * Not wired into CI — run manually with tsx. Exercises the pure builder
 * functions directly (bypasses full V4 pipeline) with a real
 * consonant-ending Korean name ("동글") to catch particle-grammar bugs.
 */
import {
  buildEmpathyVsSolvingScene,
  buildPhysicalIntimacyScene,
  buildGiveUpPointScene,
  buildRomanticChemistryScene,
  buildPossessivenessScene,
  buildLongTermGrowthScene,
} from "../../lib/relationship/romantic/prototypeV4/romanticV4DateSceneInsights";
import type { RomanticPsychMatchAxisResult } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

function axis(key: string, a: number, b: number): RomanticPsychMatchAxisResult {
  const gap = Math.abs(a - b);
  return {
    axis_key: key,
    score_a: a,
    score_b: b,
    gap,
    match_type: gap < 15 ? "similarity" : gap < 30 ? "complementary" : "tension",
  } as RomanticPsychMatchAxisResult;
}

function run(locale: "ko-KR" | "en-US", nameA: string, nameB: string) {
  const axisResults: RomanticPsychMatchAxisResult[] = [
    axis("empathy", 85, 30),
    axis("thinking_style", 30, 80),
    axis("stimulation", 80, 25),
    axis("energy_style", 75, 30),
    axis("self_control", 50, 50),
    axis("practicality", 50, 50),
    axis("structure", 50, 50),
    axis("conflict_style", 50, 50),
    axis("resilience", 30, 35),
    axis("recognition", 50, 50),
    axis("decision_style", 50, 50),
  ];

  console.log(`\n=== ${locale} :: ${nameA} / ${nameB} ===`);

  console.log("1 empathy_vs_solving:", buildEmpathyVsSolvingScene({ axisResults, nameA, nameB, locale })?.difference);
  console.log("2 physical_intimacy:", buildPhysicalIntimacyScene({ axisResults, nameA, nameB, locale })?.difference);
  console.log("3 give_up_point:", buildGiveUpPointScene({ axisResults, nameA, nameB, locale })?.difference);

  console.log(
    "4 romantic_chemistry:",
    buildRomanticChemistryScene({
      bonding: { packets: [{ packet_id: "p1", fact_kind: "combine", group: "bonding", codes: [], selection_priority: 1, directionality: {} as any, evidence: [] }, { packet_id: "p2", fact_kind: "combine", group: "energy", codes: [], selection_priority: 1, directionality: {} as any, evidence: [] }, { packet_id: "p3", fact_kind: "combine", group: "bonding", codes: [], selection_priority: 1, directionality: {} as any, evidence: [] }], count: 3 },
      nameA,
      nameB,
      locale,
    })?.difference,
  );
  console.log(
    "5 possessiveness_boundary:",
    buildPossessivenessScene({ wonjin: { wonjinCount: 1, guimunCount: 0 }, nameA, nameB, locale })?.difference,
  );
  console.log(
    "6 long_term_growth:",
    buildLongTermGrowthScene({ hasBalance: true, combineHitCount: 2, nameA, nameB, locale })?.difference,
  );

  console.log("-- gate check: no data → all null --");
  console.log(
    "4 (no bonding):",
    buildRomanticChemistryScene({ bonding: null, nameA, nameB, locale }),
  );
  console.log(
    "5 (no wonjin):",
    buildPossessivenessScene({ wonjin: null, nameA, nameB, locale }),
  );
  console.log(
    "6 (no balance, no combine):",
    buildLongTermGrowthScene({ hasBalance: false, combineHitCount: 0, nameA, nameB, locale }),
  );
}

run("ko-KR", "동글", "Sera");
run("en-US", "Alex", "Jordan");
