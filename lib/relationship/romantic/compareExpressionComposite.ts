/**
 * Phase 5-3 — comparison_table 「감정 표현」 1행 서버 composite.
 * expression_band를 base로 유지하고 energy_style로만 보정.
 *
 * Balance / expression_speed와 신호 겹침은 있으나 판정 재사용·재호출 없음.
 * - balance_of_power: (energy_style+recognition)/2 → leader/receiver
 * - expression_speed: conflict_style − self_control → A/B/balanced
 * - 본 composite: expression_band(식상 food) + energy_style lean
 *
 * 사주 lock: expressive는 food≥2, reserved는 food===0 (extract와 동일).
 * food=1이면서 band를 expressive로 둔 합성 입력만 soft flip 가능.
 */

import type { ExpressionBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type ExpressionLean = ExpressionBand;

export type CompareExpressionAlign = "confirms" | "caution";
export type CompareExpressionConfidence = "high" | "low";

export type ExpressionStyleSlice = {
  food_count: number;
  expression_band: ExpressionBand;
};

export type RefinedCompareExpressionPerson = {
  lean: ExpressionLean;
  base: ExpressionBand;
  flipped: boolean;
  align: CompareExpressionAlign;
  confidence: CompareExpressionConfidence;
  scores: {
    food_count: number;
    energy_style: number;
    saju_margin: number;
  };
};

export type RefinedCompareExpressionPair = {
  leanA: ExpressionLean;
  leanB: ExpressionLean;
  baseA: ExpressionBand;
  baseB: ExpressionBand;
  flippedA: boolean;
  flippedB: boolean;
  align: CompareExpressionAlign;
  confidence: CompareExpressionConfidence;
  personA: RefinedCompareExpressionPerson;
  personB: RefinedCompareExpressionPerson;
};

const SAJU_LOCK_FOOD = 2;
/** 외향성 상단 — expressive lean */
const PSYCH_EXPRESSIVE = 60;
/** 외향성 하단 — reserved lean */
const PSYCH_RESERVED = 40;

function sajuMargin(foodCount: number): number {
  if (foodCount === 0) return SAJU_LOCK_FOOD;
  return foodCount;
}

function isSajuLocked(base: ExpressionBand, foodCount: number): boolean {
  if (base === "balanced") return false;
  if (base === "expressive") return foodCount >= SAJU_LOCK_FOOD;
  if (base === "reserved") return foodCount === 0;
  return true;
}

function psychLean(energyStyle: number): ExpressionLean | "mid" {
  if (energyStyle >= PSYCH_EXPRESSIVE) return "expressive";
  if (energyStyle <= PSYCH_RESERVED) return "reserved";
  return "mid";
}

function oppositeLean(band: ExpressionBand): ExpressionLean | null {
  if (band === "expressive") return "reserved";
  if (band === "reserved") return "expressive";
  return null;
}

/**
 * 1인 보정. energy_style 없으면 호출하지 말 것.
 * base=expression_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareExpressionPerson(params: {
  expression: ExpressionStyleSlice;
  energyStyle: number;
}): RefinedCompareExpressionPerson {
  const { expression, energyStyle } = params;
  const base = expression.expression_band;
  const margin = sajuMargin(expression.food_count);
  const locked = isSajuLocked(base, expression.food_count);
  const pLean = psychLean(energyStyle);
  const scores = {
    food_count: expression.food_count,
    energy_style: energyStyle,
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
 * A/B 모두 energy_style이 있을 때만 pair 확정.
 * resolveBalanceOfPower / resolveExpressionSpeedDirection 호출 없음.
 */
export function refineCompareExpressionPair(params: {
  expressionA: ExpressionStyleSlice;
  expressionB: ExpressionStyleSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareExpressionPair | null {
  const energyA = params.profileA?.secondary_axes?.energy_style;
  const energyB = params.profileB?.secondary_axes?.energy_style;
  if (typeof energyA !== "number" || typeof energyB !== "number") return null;

  const personA = refineCompareExpressionPerson({
    expression: params.expressionA,
    energyStyle: energyA,
  });
  const personB = refineCompareExpressionPerson({
    expression: params.expressionB,
    energyStyle: energyB,
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
