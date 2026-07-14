import {
  hasPremiumCacheForKind,
  parseRelationshipKind,
  type ResultPremiumByKind,
} from "./relationshipKind";

/**
 * 관계 심화(premium) 완료 여부 — 활성(요청/행) kind가 by_kind에 유효 캐시일 때만.
 * 다른 kind·레거시 perspectives-only는 완료로 보지 않음.
 */
export function isRelationshipPremiumComplete(
  analysisType: string,
  resultPremiumByKind: unknown,
  relationshipKindRaw?: string | null,
): boolean {
  if (analysisType !== "premium") return false;

  const byKind = (resultPremiumByKind ?? {}) as ResultPremiumByKind;
  const activeKind = parseRelationshipKind(relationshipKindRaw);
  return hasPremiumCacheForKind(byKind, activeKind);
}
