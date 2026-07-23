/**
 * Phase 5-3 — comparison_table 「애정 언어」 1행 서버 composite.
 * affection_band를 base로 유지하고 empathy로만 보정.
 * 강한 사주(|wealth−seal|≥2)는 flip 금지.
 *
 * Reassurance와 신호 겹침(empathy, wealth/seal raw)은 있으나
 * 판정 목적·출력이 다름 — resolveReassurance* / resolveGiveStyle 재사용·재호출 없음.
 * - reassurance: need(empathy×일간뿌리) + give(5카운트 argmax) → match
 * - 본 composite: affection_band(wealth vs seal) + empathy lean → align/confidence
 */

import type { AffectionBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type AffectionLean = AffectionBand;

export type CompareAffectionAlign = "confirms" | "caution";
export type CompareAffectionConfidence = "high" | "low";

export type AffectionLanguageSlice = {
  wealth_count: number;
  seal_count: number;
  affection_band: AffectionBand;
};

export type RefinedCompareAffectionPerson = {
  lean: AffectionLean;
  base: AffectionBand;
  flipped: boolean;
  align: CompareAffectionAlign;
  confidence: CompareAffectionConfidence;
  scores: {
    wealth_count: number;
    seal_count: number;
    empathy: number;
    saju_margin: number;
  };
};

export type RefinedCompareAffectionPair = {
  leanA: AffectionLean;
  leanB: AffectionLean;
  baseA: AffectionBand;
  baseB: AffectionBand;
  flippedA: boolean;
  flippedB: boolean;
  align: CompareAffectionAlign;
  confidence: CompareAffectionConfidence;
  personA: RefinedCompareAffectionPerson;
  personB: RefinedCompareAffectionPerson;
};

const SAJU_LOCK_MARGIN = 2;
/** 관계공감 상단 — emotional_care lean (reassurance EMPATHY_HIGH=60과 동일 임계, 판정은 독립) */
const PSYCH_EMOTIONAL = 60;
/** 관계공감 하단 — action_gift lean */
const PSYCH_ACTION = 40;

function sajuMargin(wealth: number, seal: number): number {
  return Math.abs(wealth - seal);
}

function isSajuLocked(wealth: number, seal: number): boolean {
  return sajuMargin(wealth, seal) >= SAJU_LOCK_MARGIN;
}

function psychLean(empathy: number): AffectionLean | "mid" {
  if (empathy >= PSYCH_EMOTIONAL) return "emotional_care";
  if (empathy <= PSYCH_ACTION) return "action_gift";
  return "mid";
}

function oppositeLean(band: AffectionBand): AffectionLean | null {
  if (band === "action_gift") return "emotional_care";
  if (band === "emotional_care") return "action_gift";
  return null;
}

/**
 * 1인 보정. empathy 없으면 호출하지 말 것.
 * base=affection_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareAffectionPerson(params: {
  affection: AffectionLanguageSlice;
  empathy: number;
}): RefinedCompareAffectionPerson {
  const { affection, empathy } = params;
  const base = affection.affection_band;
  const margin = sajuMargin(affection.wealth_count, affection.seal_count);
  const locked = isSajuLocked(affection.wealth_count, affection.seal_count);
  const pLean = psychLean(empathy);
  const scores = {
    wealth_count: affection.wealth_count,
    seal_count: affection.seal_count,
    empathy,
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
 * A/B 모두 empathy가 있을 때만 pair 확정.
 * resolveReassurance* 호출 없음 — raw empathy만 읽음.
 */
export function refineCompareAffectionPair(params: {
  affectionA: AffectionLanguageSlice;
  affectionB: AffectionLanguageSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareAffectionPair | null {
  const empathyA = params.profileA?.secondary_axes?.empathy;
  const empathyB = params.profileB?.secondary_axes?.empathy;
  if (typeof empathyA !== "number" || typeof empathyB !== "number") return null;

  const personA = refineCompareAffectionPerson({
    affection: params.affectionA,
    empathy: empathyA,
  });
  const personB = refineCompareAffectionPerson({
    affection: params.affectionB,
    empathy: empathyB,
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
