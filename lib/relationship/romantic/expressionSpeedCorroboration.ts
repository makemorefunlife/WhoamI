/**
 * Phase 5-3 — expression_speed confirm-only refinement.
 *
 * base: psych `expression_speed_direction` (절대 불변)
 * residual: saju 약한 corroboration — align/confidence만 (flip/fill/lock 없음)
 *
 * residual은 expression speed의 직접 증거가 아님 → confidence는 항상 low.
 * compare shared resolver 재사용 금지.
 */

import type {
  ExpressionSpeedDirection,
  ResidualBand,
} from "@/lib/relationship/romanticRules/relationshipDynamics";

export type ExpressionSpeedAlign = "confirms" | "caution";
export type ExpressionSpeedConfidence = "high" | "low";

export type ExpressionSpeedCorroboration = {
  /** 입력 direction 그대로 — 절대 변경 없음 */
  direction: ExpressionSpeedDirection;
  /** balanced·residual 누락 시 null (Context omit) */
  align: ExpressionSpeedAlign | null;
  /** align이 있을 때만 low; 그 외 null */
  confidence: ExpressionSpeedConfidence | null;
};

function isResidualBand(v: unknown): v is ResidualBand {
  return v === "lingers" || v === "clears_fast" || v === "moderate";
}

/**
 * psych direction을 유지한 채 residual로 confirms/caution만 판정.
 * direction 필드는 항상 입력과 동일하게 반환한다.
 */
export function refineExpressionSpeedCorroboration(params: {
  direction: ExpressionSpeedDirection;
  residualA?: ResidualBand | null;
  residualB?: ResidualBand | null;
}): ExpressionSpeedCorroboration {
  const { direction, residualA, residualB } = params;

  if (!isResidualBand(residualA) || !isResidualBand(residualB)) {
    return { direction, align: null, confidence: null };
  }

  if (direction === "balanced") {
    return { direction, align: null, confidence: null };
  }

  if (direction === "A") {
    const confirms =
      residualA === "clears_fast" && residualB === "lingers";
    return {
      direction,
      align: confirms ? "confirms" : "caution",
      confidence: "low",
    };
  }

  // direction === "B"
  const confirms =
    residualB === "clears_fast" && residualA === "lingers";
  return {
    direction,
    align: confirms ? "confirms" : "caution",
    confidence: "low",
  };
}
