import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchAxisResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import { buildPsychMatchFromMasters } from "@/lib/relationship/psychDomainLens/shared";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { BedroomMatrixSection } from "./bedroomProfile";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";

export type PsychAxisSignal = {
  gap: number;
  match_type: PsychMatchType;
  score_a: number;
  score_b: number;
} | null;

export type CohabitationKillerSignals = {
  nicknameA: string;
  nicknameB: string;

  sajuCfoNickname: string;
  sajuWealthPowerStruggle: boolean;
  psychPracticality: PsychAxisSignal;

  bedroomMismatchCount: number;
  bedroomDayBranchTension: boolean;
  sleepFitMismatch: boolean;
  psychSelfControl: PsychAxisSignal;

  inlawStressIndexMax: number;
  inlawNeedsStrongBoundary: boolean;
  psychEmpathy: PsychAxisSignal;

  homeRiskPct: number;
  conflictWealthStruggle: boolean;
  conflictDayBranchChung: boolean;
};

function pickPsychAxis(
  axisResults: PsychMatchAxisResult[],
  axis: SecondaryAxisKey,
): PsychAxisSignal {
  const row = axisResults.find((r) => r.axis_key === axis);
  if (!row) return null;
  return {
    gap: row.gap,
    match_type: row.match_type,
    score_a: row.score_a,
    score_b: row.score_b,
  };
}

function countBedroomMismatches(matrix: BedroomMatrixSection): number {
  const archA = matrix.person_a.archetypes;
  const archB = matrix.person_b.archetypes;
  return (
    (archA.stamina !== archB.stamina ? 1 : 0) +
    (archA.fantasy !== archB.fantasy ? 1 : 0) +
    (archA.manner !== archB.manner ? 1 : 0)
  );
}

/**
 * PersonCore psych_master + 사주 rule context → 킬러 IF-THEN 입력 신호.
 */
export function extractCohabitationKillerSignals(params: {
  ctx: MarriageRuleContext;
  bedroomMatrix: BedroomMatrixSection;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
}): CohabitationKillerSignals {
  const { ctx, bedroomMatrix, psychA, psychB } = params;
  const sig = ctx.marriagePairAnalysis.scoringSignals;
  const boundaryA = ctx.tenGod.boundaryA;
  const boundaryB = ctx.tenGod.boundaryB;

  const psychMatch =
    psychA && psychB ? buildPsychMatchFromMasters(psychA, psychB) : null;
  const axisResults = psychMatch?.axis_results ?? [];

  const sleepMismatch =
    ctx.sleepFit.sensor_nickname != null &&
    ctx.sleepFit.easy_sleeper_nickname != null;

  return {
    nicknameA: ctx.nicknameA,
    nicknameB: ctx.nicknameB,
    sajuCfoNickname: ctx.tenGod.cfo.nickname,
    sajuWealthPowerStruggle: sig.hasWealthOfficerPowerStruggle,
    psychPracticality: pickPsychAxis(axisResults, "practicality"),
    bedroomMismatchCount: countBedroomMismatches(bedroomMatrix),
    bedroomDayBranchTension:
      ctx.marriagePairAnalysis.dayBranch.hasDayBranchChungHyung,
    sleepFitMismatch: sleepMismatch,
    psychSelfControl: pickPsychAxis(axisResults, "self_control"),
    inlawStressIndexMax: Math.max(
      boundaryA.inlawStressIndex,
      boundaryB.inlawStressIndex,
    ),
    inlawNeedsStrongBoundary:
      boundaryA.needsStrongBoundary || boundaryB.needsStrongBoundary,
    psychEmpathy: pickPsychAxis(axisResults, "empathy"),
    homeRiskPct: ctx.masterScores.risk,
    conflictWealthStruggle: sig.hasWealthOfficerPowerStruggle,
    conflictDayBranchChung:
      ctx.marriagePairAnalysis.dayBranch.hasDayBranchChungHyung,
  };
}
