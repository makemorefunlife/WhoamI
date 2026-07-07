import type { DecisionEntry } from "@/lib/decision/types";
import { needsDecisionReview } from "@/lib/decision/types";

/** 리뷰 대시보드 미리보기: 리뷰 필요 항목 우선, 최신순 */
export function sortDecisionsForReview(entries: DecisionEntry[]): DecisionEntry[] {
  return [...entries].sort((a, b) => {
    const aPending = needsDecisionReview(a);
    const bPending = needsDecisionReview(b);
    if (aPending !== bPending) return aPending ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
