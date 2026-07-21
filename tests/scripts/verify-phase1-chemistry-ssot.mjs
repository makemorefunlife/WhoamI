/**
 * Phase 1 검증 스크립트 — chemistry_approx/strength_weakness가
 * finalizeRomanticSajuDeepReport와 동일한 방식(buildChemistryApproxScores/
 * buildStrengthWeaknessLists)으로 정상 호출되는지 확인. LLM 호출 없음.
 * 실행: npx tsx tests/scripts/verify-phase1-chemistry-ssot.mjs
 */
import {
  buildPsychMatchResult,
  buildChemistryApproxScores,
  buildStrengthWeaknessLists,
} from "../../lib/relationship/psychMatch/index.ts";

const profileA = {
  primary_axes: {},
  secondary_axes: {
    stimulation: 70,
    self_control: 40,
    practicality: 55,
    structure: 60,
    empathy: 75,
    conflict_style: 30,
    resilience: 65,
    recognition: 50,
    energy_style: 45,
    thinking_style: 35,
    decision_style: 60,
  },
};
const profileB = {
  primary_axes: {},
  secondary_axes: {
    stimulation: 40,
    self_control: 80,
    practicality: 60,
    structure: 30,
    empathy: 55,
    conflict_style: 70,
    resilience: 45,
    recognition: 65,
    energy_style: 70,
    thinking_style: 55,
    decision_style: 40,
  },
};

const psychMatch = buildPsychMatchResult({ profileA, profileB });
console.log("psychMatch.axis_results length:", psychMatch.axis_results.length);

const chemistry = buildChemistryApproxScores(psychMatch.axis_results);
console.log("chemistry_approx:", JSON.stringify(chemistry));

const swKo = buildStrengthWeaknessLists(psychMatch.axis_results, "ko");
const swEn = buildStrengthWeaknessLists(psychMatch.axis_results, "en");
console.log("strength_weakness(ko) strengths:", swKo.strengths.length, "weaknesses:", swKo.weaknesses.length);
console.log("strength_weakness(en) strengths:", swEn.strengths.length, "weaknesses:", swEn.weaknesses.length);
console.log("ko sample:", JSON.stringify(swKo.strengths[0] ?? null));
console.log("en sample:", JSON.stringify(swEn.strengths[0] ?? null));
