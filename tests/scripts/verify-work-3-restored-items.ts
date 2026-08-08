/**
 * One-off verification for the Work Colleague "3 restored action-plan items"
 * batch (Ch4 role-ownership clarity, Ch3 risk/rhythm, Ch8 R&R check-in).
 * Not wired into CI — run manually with tsx.
 */
import {
  buildSynergyFrictionCheckInNote,
  buildRoleOwnershipClarityLine,
} from "../../lib/relationship/enrichment/workSajuRoleInsights";
import { buildRiskAndRhythmLine } from "../../lib/relationship/enrichment/workPsychRoleInsights";
import type { WorkScoringSignals } from "../../lib/saju/workPairAnalysis";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

const sigBoth: WorkScoringSignals = {
  hasStemCombine: true,
  hasElementMutualComplement: false,
  hasStemClashOrOvercome: true,
  hasMonthDirectCombine: false,
  hasMonthElementFlow: false,
  hasMonthClashOrPunish: false,
  hasMonthDirectChung: false,
  hasWonjinOrGuimun: false,
  hasHaPaHae: false,
  hasGongmangHit: false,
};
console.log("item9 (synergy+friction both):", buildSynergyFrictionCheckInNote({ sig: sigBoth, locale: "ko-KR" }));

const sigOnlySynergy: WorkScoringSignals = { ...sigBoth, hasStemClashOrOvercome: false };
console.log("item9 (synergy only -> null):", buildSynergyFrictionCheckInNote({ sig: sigOnlySynergy, locale: "ko-KR" }));

const countsA = { 비견: 1, 식신: 0, 상관: 0, 편재: 0, 정재: 0, 편관: 0, 정관: 3, 편인: 0, 정인: 0 };
const countsB = { 비견: 1, 식신: 0, 상관: 3, 편재: 0, 정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0 };
console.log("item8 (role ownership, gap present):", buildRoleOwnershipClarityLine({ countsA, countsB, locale: "ko-KR" }));
console.log("item8 (no gap -> null):", buildRoleOwnershipClarityLine({ countsA: countsB, countsB, locale: "ko-KR" }));

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}
console.log(
  "item10 (both gaps):",
  buildRiskAndRhythmLine({
    psychA: psych({ decision_style: 80, structure: 80 }),
    psychB: psych({ decision_style: 30, structure: 30 }),
    locale: "ko-KR",
  }),
);
console.log(
  "item10 (structure gap only):",
  buildRiskAndRhythmLine({
    psychA: psych({ structure: 80 }),
    psychB: psych({ structure: 30 }),
    locale: "ko-KR",
  }),
);
console.log(
  "item10 (no gap -> null):",
  buildRiskAndRhythmLine({ psychA: psych({}), psychB: psych({}), locale: "ko-KR" }),
);
