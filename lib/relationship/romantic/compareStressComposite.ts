/**
 * Phase 5-3 — comparison_table 「스트레스 패턴」 1행 서버 composite.
 * stress_band를 base로 유지하고 self_control로만 보정.
 *
 * Recovery / residual과 신호 겹침은 있으나 판정 재사용·재호출 없음.
 * - recovery: (resilience+self_control)/2 → 회복 속도 band / mismatch
 * - residual: seal + 일지충형 → 잔류도 (조후·self_control 미사용)
 * - 본 composite: stress_band(조후 temperature) + self_control lean
 *
 * 사주 lock: 비-steady이면서 |heat_score−50|≥20 (조후 band는 이미 원소 차≥2로만 잡힘 —
 * heat 극단으로 “강한” 기후를 잠금). 약한 열/한이면 soft flip 허용.
 */

import type { StressReactionBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type StressLean = StressReactionBand;

export type CompareStressAlign = "confirms" | "caution";
export type CompareStressConfidence = "high" | "low";

export type StressPatternSlice = {
  heat_score: number;
  temperature_band: "cold" | "neutral" | "hot";
  stress_band: StressReactionBand;
};

export type RefinedCompareStressPerson = {
  lean: StressLean;
  base: StressReactionBand;
  flipped: boolean;
  align: CompareStressAlign;
  confidence: CompareStressConfidence;
  scores: {
    heat_score: number;
    self_control: number;
    saju_margin: number;
  };
};

export type RefinedCompareStressPair = {
  leanA: StressLean;
  leanB: StressLean;
  baseA: StressReactionBand;
  baseB: StressReactionBand;
  flippedA: boolean;
  flippedB: boolean;
  align: CompareStressAlign;
  confidence: CompareStressConfidence;
  personA: RefinedCompareStressPerson;
  personB: RefinedCompareStressPerson;
};

/** |heat−50| — treasurer/conflict lock 스케일에 맞춘 강한 조후 */
const HEAT_LOCK_MARGIN = 20;
/** 자기통제 상단 — withdrawn lean */
const PSYCH_WITHDRAWN = 60;
/** 자기통제 하단 — explosive lean */
const PSYCH_EXPLOSIVE = 40;

function sajuMargin(heatScore: number): number {
  return Math.abs(heatScore - 50);
}

function isSajuLocked(base: StressReactionBand, heatScore: number): boolean {
  if (base === "steady") return false;
  return sajuMargin(heatScore) >= HEAT_LOCK_MARGIN;
}

function psychLean(selfControl: number): StressLean | "mid" {
  if (selfControl >= PSYCH_WITHDRAWN) return "withdrawn";
  if (selfControl <= PSYCH_EXPLOSIVE) return "explosive";
  return "mid";
}

function oppositeLean(band: StressReactionBand): StressLean | null {
  if (band === "explosive") return "withdrawn";
  if (band === "withdrawn") return "explosive";
  return null;
}

/**
 * 1인 보정. self_control 없으면 호출하지 말 것.
 * base=stress_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareStressPerson(params: {
  stress: StressPatternSlice;
  selfControl: number;
}): RefinedCompareStressPerson {
  const { stress, selfControl } = params;
  const base = stress.stress_band;
  const margin = sajuMargin(stress.heat_score);
  const locked = isSajuLocked(base, stress.heat_score);
  const pLean = psychLean(selfControl);
  const scores = {
    heat_score: stress.heat_score,
    self_control: selfControl,
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
 * A/B 모두 self_control이 있을 때만 pair 확정.
 * resolveRecovery* / resolveResidual* 호출 없음.
 */
export function refineCompareStressPair(params: {
  stressA: StressPatternSlice;
  stressB: StressPatternSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareStressPair | null {
  const ctrlA = params.profileA?.secondary_axes?.self_control;
  const ctrlB = params.profileB?.secondary_axes?.self_control;
  if (typeof ctrlA !== "number" || typeof ctrlB !== "number") return null;

  const personA = refineCompareStressPerson({
    stress: params.stressA,
    selfControl: ctrlA,
  });
  const personB = refineCompareStressPerson({
    stress: params.stressB,
    selfControl: ctrlB,
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
