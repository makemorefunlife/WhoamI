/**
 * Phase 5-3 — comparison_table 「갈등 반응」 1행 서버 composite.
 * conflict_band를 base로 유지하고 conflict_style로만 보정.
 * 강한 사주(|officer−food|≥2)는 flip 금지.
 */

import type { ConflictBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type ConflictLean = ConflictBand;

export type CompareConflictAlign = "confirms" | "caution";
export type CompareConflictConfidence = "high" | "low";

export type ConflictResponseSlice = {
  officer_count: number;
  food_count: number;
  conflict_band: ConflictBand;
};

export type RefinedCompareConflictPerson = {
  /** 서버 확정 lean — context_input compare_conflict_{a|b}.category */
  lean: ConflictLean;
  /** 사주 base (변경 없음) */
  base: ConflictBand;
  flipped: boolean;
  align: CompareConflictAlign;
  confidence: CompareConflictConfidence;
  scores: {
    officer_count: number;
    food_count: number;
    conflict_style: number;
    saju_margin: number;
  };
};

export type RefinedCompareConflictPair = {
  leanA: ConflictLean;
  leanB: ConflictLean;
  baseA: ConflictBand;
  baseB: ConflictBand;
  flippedA: boolean;
  flippedB: boolean;
  /** pair 집계 — compare_conflict_align */
  align: CompareConflictAlign;
  /** pair 집계 — compare_conflict_confidence */
  confidence: CompareConflictConfidence;
  personA: RefinedCompareConflictPerson;
  personB: RefinedCompareConflictPerson;
};

/** 관성−식상 절대차 — treasurer SAJU_LOCK=2와 동일 스케일 */
const SAJU_LOCK_MARGIN = 2;
/** 갈등직면성 상단 — direct lean */
const PSYCH_DIRECT = 60;
/** 갈등직면성 하단 — principled lean */
const PSYCH_PRINCIPLED = 40;

function sajuMargin(officer: number, food: number): number {
  return Math.abs(officer - food);
}

function isSajuLocked(officer: number, food: number): boolean {
  return sajuMargin(officer, food) >= SAJU_LOCK_MARGIN;
}

function psychLean(conflictStyle: number): ConflictLean | "mid" {
  if (conflictStyle >= PSYCH_DIRECT) return "direct";
  if (conflictStyle <= PSYCH_PRINCIPLED) return "principled";
  return "mid";
}

function oppositeLean(band: ConflictBand): ConflictLean | null {
  if (band === "direct") return "principled";
  if (band === "principled") return "direct";
  return null;
}

/**
 * 1인 보정. conflict_style 없으면 호출하지 말 것.
 * base=conflict_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareConflictPerson(params: {
  conflict: ConflictResponseSlice;
  conflictStyle: number;
}): RefinedCompareConflictPerson {
  const { conflict, conflictStyle } = params;
  const base = conflict.conflict_band;
  const margin = sajuMargin(conflict.officer_count, conflict.food_count);
  const locked = isSajuLocked(conflict.officer_count, conflict.food_count);
  const pLean = psychLean(conflictStyle);
  const scores = {
    officer_count: conflict.officer_count,
    food_count: conflict.food_count,
    conflict_style: conflictStyle,
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
 * A/B 모두 conflict_style이 있을 때만 pair 확정.
 * 한쪽이라도 없으면 null → legacy(사주 band만, align/confidence omit).
 */
export function refineCompareConflictPair(params: {
  conflictA: ConflictResponseSlice;
  conflictB: ConflictResponseSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareConflictPair | null {
  const styleA = params.profileA?.secondary_axes?.conflict_style;
  const styleB = params.profileB?.secondary_axes?.conflict_style;
  if (typeof styleA !== "number" || typeof styleB !== "number") return null;

  const personA = refineCompareConflictPerson({
    conflict: params.conflictA,
    conflictStyle: styleA,
  });
  const personB = refineCompareConflictPerson({
    conflict: params.conflictB,
    conflictStyle: styleB,
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
