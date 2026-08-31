/**
 * Phase 5-3 — comparison_table 「소통 방식」 1행 서버 composite.
 * communication_band를 base로 유지하고 structure로만 보정.
 *
 * Work reporting / Friend communication_rhythm과 도메인·판정 비공유.
 * Romantic 내 self/seal raw는 reassurance give(solidarity)·role structure에
 * 쓰이지만 communication_band(self vs seal) lean과는 출력이 다름 —
 * resolveReporting* / friend rhythm / resolveGiveStyle 재호출 없음.
 */

import type { CommunicationBand } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "./compareCompositeShared";

export type CommunicationLean = CommunicationBand;

export type CompareCommunicationAlign = "confirms" | "caution";
export type CompareCommunicationConfidence = "high" | "low";

export type CommunicationStyleSlice = {
  self_count: number;
  seal_count: number;
  communication_band: CommunicationBand;
};

export type RefinedCompareCommunicationPerson = {
  lean: CommunicationLean;
  base: CommunicationBand;
  flipped: boolean;
  align: CompareCommunicationAlign;
  confidence: CompareCommunicationConfidence;
  scores: {
    self_count: number;
    seal_count: number;
    structure: number;
    saju_margin: number;
  };
};

export type RefinedCompareCommunicationPair = {
  leanA: CommunicationLean;
  leanB: CommunicationLean;
  baseA: CommunicationBand;
  baseB: CommunicationBand;
  flippedA: boolean;
  flippedB: boolean;
  align: CompareCommunicationAlign;
  confidence: CompareCommunicationConfidence;
  personA: RefinedCompareCommunicationPerson;
  personB: RefinedCompareCommunicationPerson;
};

const SAJU_LOCK_MARGIN = 2;
/** 계획성 상단 — considerate lean */
const PSYCH_CONSIDERATE = 60;
/** 계획성 하단 — direct lean */
const PSYCH_DIRECT = 40;

function sajuMargin(selfCount: number, sealCount: number): number {
  return Math.abs(selfCount - sealCount);
}

function isSajuLocked(selfCount: number, sealCount: number): boolean {
  return sajuMargin(selfCount, sealCount) >= SAJU_LOCK_MARGIN;
}

function psychLean(structure: number): CommunicationLean | "mid" {
  if (structure >= PSYCH_CONSIDERATE) return "considerate";
  if (structure <= PSYCH_DIRECT) return "direct";
  return "mid";
}

function oppositeLean(band: CommunicationBand): CommunicationLean | null {
  if (band === "direct") return "considerate";
  if (band === "considerate") return "direct";
  return null;
}

/**
 * 1인 보정. structure 없으면 호출하지 말 것.
 * base=communication_band. mid·잠금·충돌 시 base 유지.
 */
export function refineCompareCommunicationPerson(params: {
  communication: CommunicationStyleSlice;
  structure: number;
}): RefinedCompareCommunicationPerson {
  const { communication, structure } = params;
  const base = communication.communication_band;
  const margin = sajuMargin(
    communication.self_count,
    communication.seal_count,
  );
  const locked = isSajuLocked(
    communication.self_count,
    communication.seal_count,
  );
  const pLean = psychLean(structure);
  const scores = {
    self_count: communication.self_count,
    seal_count: communication.seal_count,
    structure,
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
 * A/B 모두 structure가 있을 때만 pair 확정.
 */
export function refineCompareCommunicationPair(params: {
  communicationA: CommunicationStyleSlice;
  communicationB: CommunicationStyleSlice;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
}): RefinedCompareCommunicationPair | null {
  const structA = params.profileA?.secondary_axes?.structure;
  const structB = params.profileB?.secondary_axes?.structure;
  if (typeof structA !== "number" || typeof structB !== "number") return null;

  const personA = refineCompareCommunicationPerson({
    communication: params.communicationA,
    structure: structA,
  });
  const personB = refineCompareCommunicationPerson({
    communication: params.communicationB,
    structure: structB,
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
