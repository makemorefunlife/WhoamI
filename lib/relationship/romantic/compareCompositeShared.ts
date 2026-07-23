/**
 * Phase 5-3 — comparison_table 6행(affection/communication/conflict/decision/
 * expression/stress) composite에 공통되는 제어 흐름만 뽑은 generic resolver.
 *
 * 사주 축(officer/food/wealth/seal/heat 등) · psych 축(empathy/structure 등) 이름을
 * 알지 못한다 — 행별 base/psych/lock 계산은 각 compare*Composite.ts에 남아있고,
 * 이 파일은 이미 계산된 base lean / psych lean / opposite / locked 만 받아
 * 최종 lean·align·confidence를 결정한다.
 */

export type CompareCompositeAlign = "confirms" | "caution";
export type CompareCompositeConfidence = "high" | "low";

export type ResolvedCompareCompositeLean<TLean extends string> = {
  lean: TLean;
  flipped: boolean;
  align: CompareCompositeAlign;
  confidence: CompareCompositeConfidence;
};

/**
 * mid·잠금·충돌 시 base 유지. base가 중립(opposite 없음)이면 soft fill,
 * 약한 사주 + 반대 psych면 soft flip. 행별 의미는 호출부에서 이미 반영된 입력으로 처리.
 */
export function resolveCompareCompositeLean<TLean extends string>(params: {
  base: TLean;
  psychLean: TLean | "mid";
  oppositeOfBase: TLean | null;
  locked: boolean;
}): ResolvedCompareCompositeLean<TLean> {
  const { base, psychLean, oppositeOfBase, locked } = params;

  if (psychLean === "mid") {
    return { lean: base, flipped: false, align: "caution", confidence: "low" };
  }

  if (psychLean === base) {
    return { lean: base, flipped: false, align: "confirms", confidence: "high" };
  }

  if (oppositeOfBase == null) {
    return { lean: psychLean, flipped: true, align: "caution", confidence: "high" };
  }

  if (psychLean === oppositeOfBase) {
    if (locked) {
      return { lean: base, flipped: false, align: "caution", confidence: "low" };
    }
    return { lean: psychLean, flipped: true, align: "caution", confidence: "high" };
  }

  return { lean: base, flipped: false, align: "caution", confidence: "low" };
}

/** pair 집계 — 둘 다 confirms/high일 때만 confirms/high. */
export function resolveCompareCompositePairAlignment(
  personA: { align: CompareCompositeAlign; confidence: CompareCompositeConfidence },
  personB: { align: CompareCompositeAlign; confidence: CompareCompositeConfidence },
): { align: CompareCompositeAlign; confidence: CompareCompositeConfidence } {
  const bothConfirms =
    personA.align === "confirms" && personB.align === "confirms";
  const bothHigh =
    personA.confidence === "high" && personB.confidence === "high";

  return {
    align: bothConfirms ? "confirms" : "caution",
    confidence: bothHigh ? "high" : "low",
  };
}
