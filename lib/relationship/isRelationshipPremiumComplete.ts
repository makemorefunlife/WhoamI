import {
  RELATIONSHIP_KINDS,
  hasPremiumCacheForKind,
  parseRelationshipKind,
  type ResultPremiumByKind,
} from "./relationshipKind";

/** 관계 심화(premium) 분석 완료 여부 — list·홈 허브 카운트 SSOT */
export function isRelationshipPremiumComplete(
  analysisType: string,
  resultPremium: unknown,
  resultPremiumByKind: unknown,
  relationshipKindRaw?: string | null,
): boolean {
  if (analysisType !== "premium") return false;

  const byKind = (resultPremiumByKind ?? {}) as ResultPremiumByKind;
  const primaryKind = parseRelationshipKind(relationshipKindRaw);

  if (hasPremiumCacheForKind(byKind, resultPremium, primaryKind)) {
    return true;
  }

  for (const kind of RELATIONSHIP_KINDS) {
    if (kind === primaryKind) continue;
    if (hasPremiumCacheForKind(byKind, resultPremium, kind)) return true;
  }

  const prem = resultPremium as { perspectives?: unknown } | null;
  return (
    prem != null &&
    typeof prem === "object" &&
    prem.perspectives != null &&
    typeof prem.perspectives === "object"
  );
}
