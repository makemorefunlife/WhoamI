/** 심화 관계 분석 — 관계 유형 (v2 문서 romantic|family|work|friendship 와 동일) */
export const RELATIONSHIP_KINDS = [
  "romantic",
  "family",
  "work",
  "friendship",
] as const;

export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  romantic: "연인",
  family: "가족",
  work: "동료",
  friendship: "친구",
};

export function isRelationshipKind(v: unknown): v is RelationshipKind {
  return (
    typeof v === "string" &&
    (RELATIONSHIP_KINDS as readonly string[]).includes(v)
  );
}

export function parseRelationshipKind(
  v: unknown,
  fallback: RelationshipKind = "friendship",
): RelationshipKind {
  return isRelationshipKind(v) ? v : fallback;
}

export type { PremiumKindPayload, ResultPremiumByKind } from "./premiumByKind";
export {
  getPremiumPerspectiveForKind,
  getRomanticSajuDeepReport,
  hasPremiumCacheForKind,
} from "./premiumByKind";
export { isRelationshipFavorite } from "./analysisLog";
