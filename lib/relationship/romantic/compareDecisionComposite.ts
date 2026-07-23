/**
 * Phase 5-3 — comparison_table 「의사결정」 1행 서버 composite.
 * decision_band를 base로 유지하고 decision_style로만 보정.
 *
 * Lead / balance dynamics와 신호 겹침·판정 재사용 없음.
 * - balance_of_power: energy_style + recognition → leader/receiver
 * - sublead decisionApproval: officer_count A vs B
 * - 본 composite: decision_band(신강/신약/중화) + decision_style lean
 *
 * 사주 lock: extract는 support/drain 차≥2일 때만 신강·신약 band를 주므로
 * production에서는 base≠balanced면 lock. strength_margin이 있으면 |margin|≥2로 판정
 * (약한 경계 soft flip 테스트·확장용 — extract는 margin 미적재).
 */

import type { DecisionBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type DecisionLean = DecisionBand;

export type CompareDecisionAlign = "confirms" | "caution";
export type CompareDecisionConfidence = "high" | "low";

export type DecisionMakingSlice = {
  strength_label: string;
  decision_band: DecisionBand;
  /**
   * optional — PersonCore extract에는 없음.
   * 있으면 |margin|≥2일 때 lock, 없으면 base≠balanced면 lock.
   */
  strength_margin?: number;
};

export type RefinedCompareDecisionPerson = {
  lean: DecisionLean;
  base: DecisionBand;
  flipped: boolean;
  align: CompareDecisionAlign;
  confidence: CompareDecisionConfidence;
  scores: {
    decision_style: number;
    saju_margin: number;
  };
};

export type RefinedCompareDecisionPair = {
  leanA: DecisionLean;
  leanB: DecisionLean;
  baseA: DecisionBand;
  baseB: DecisionBand;
  flippedA: boolean;
  flippedB: boolean;
  align: CompareDecisionAlign;
  confidence: CompareDecisionConfidence;
  personA: RefinedCompareDecisionPerson;
  personB: RefinedCompareDecisionPerson;
};

const SAJU_LOCK_MARGIN = 2;
/** 신중결정 상단 — consultative lean */
const PSYCH_CONSULTATIVE = 60;
/** 신중결정 하단 — independent lean */
const PSYCH_INDEPENDENT = 40;

function resolveMargin(
  base: DecisionBand,
  strengthMargin: number | undefined,
): number {
  if (typeof strengthMargin === "number") return Math.abs(strengthMargin);
  // production extract: 신강/신약은 이미 원소 차≥2
  return base === "balanced" ? 0 : SAJU_LOCK_MARGIN;
}

function isSajuLocked(base: DecisionBand, margin: number): boolean {
  if (base === "balanced") return false;
  return margin >= SAJU_LOCK_MARGIN;
}

function psychLean(decisionStyle: number): DecisionLean | "mid" {
  if (decisionStyle >= PSYCH_CONSULTATIVE) return "consultative";
  if (decisionStyle <= PSYCH_INDEPENDENT) return "independent";
  return "mid";
}

function oppositeLean(band: DecisionBand): DecisionLean | null {
  if (band === "independent") return "consultative";
  if (band === "consultative") return "independent";
  return null;
}

/**
 * 1인 보정. decision_style 없으면 호출하지 말 것.
 * base=decision_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareDecisionPerson(params: {
  decision: DecisionMakingSlice;
  decisionStyle: number;
}): RefinedCompareDecisionPerson {
  const { decision, decisionStyle } = params;
  const base = decision.decision_band;
  const margin = resolveMargin(base, decision.strength_margin);
  const locked = isSajuLocked(base, margin);
  const pLean = psychLean(decisionStyle);
  const scores = {
    decision_style: decisionStyle,
    saju_margin: margin,
  };

  const resolved = resolveCompareCompositeLean({
    base,
    psychLean: pLean,
    oppositeOfBase: oppositeLean(base),
    locked,
  });

  return { ...resolved, base, scores };
}

/**
 * A/B 모두 decision_style이 있을 때만 pair 확정.
 * resolveBalanceOfPower / resolveSubLeads 호출 없음.
 */
export function refineCompareDecisionPair(params: {
  decisionA: DecisionMakingSlice;
  decisionB: DecisionMakingSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareDecisionPair | null {
  const styleA = params.profileA?.secondary_axes?.decision_style;
  const styleB = params.profileB?.secondary_axes?.decision_style;
  if (typeof styleA !== "number" || typeof styleB !== "number") return null;

  const personA = refineCompareDecisionPerson({
    decision: params.decisionA,
    decisionStyle: styleA,
  });
  const personB = refineCompareDecisionPerson({
    decision: params.decisionB,
    decisionStyle: styleB,
  });

  const { align, confidence } = resolveCompareCompositePairAlignment(
    personA,
    personB,
  );

  return {
    leanA: personA.lean,
    leanB: personB.lean,
    baseA: personA.base,
    baseB: personB.base,
    flippedA: personA.flipped,
    flippedB: personB.flipped,
    align,
    confidence,
    personA,
    personB,
  };
}
