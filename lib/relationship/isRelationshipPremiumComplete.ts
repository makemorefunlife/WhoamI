import {
  hasPremiumCacheForKind,
  parseRelationshipKind,
  type ResultPremiumByKind,
} from "./relationshipKind";

/**
 * 관계 심화(premium) 완료 여부 — 활성(요청/행) kind가 by_kind에 유효 캐시일 때만.
 * 다른 kind·레거시 perspectives-only는 완료로 보지 않음.
 *
 * locale을 넘기면 그 언어 보고서가 있을 때만 완료(다른 언어 보고서만 있으면
 * 미완료 — 다른 언어는 별도 생성). locale 생략은 언어 무관(“어느 언어로든
 * 있음”)으로, 언어 정보 없이 캐시되는 관계 지도 등에서만 쓴다.
 */
/**
 * accessibleKinds (2026-10-11): kinds of NEW per-creator reports this viewer
 * can open (own + actively shared to them; fetchAccessiblePremiumKinds). A
 * partner's report that is not shared to the viewer is not in it, so it is
 * never "ready" for them. Legacy result_premium_by_kind is judged as before
 * until the separate legacy decision.
 */
export function isRelationshipPremiumComplete(
  analysisType: string,
  resultPremiumByKind: unknown,
  relationshipKindRaw?: string | null,
  locale?: string,
  accessibleKinds?: ReadonlySet<string> | null,
): boolean {
  if (analysisType !== "premium") return false;

  const byKind = (resultPremiumByKind ?? {}) as ResultPremiumByKind;
  const activeKind = parseRelationshipKind(relationshipKindRaw);
  if (accessibleKinds?.has(activeKind)) return true;
  return hasPremiumCacheForKind(byKind, activeKind, locale);
}
