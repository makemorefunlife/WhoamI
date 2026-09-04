/** 심화 관계 분석 — 관계 유형 */
export const RELATIONSHIP_KINDS = [
  "romantic",
  "work",
  "cohabitation",
  "friendship",
  "family",
] as const;

export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];

/**
 * PRODUCT DOMAIN "Marriage" IS PERSISTENCE/API KIND "cohabitation".
 *
 * There is no `kind === "marriage"` anywhere in this codebase or database —
 * the Marriage product surface (buildMarriageReport, buildMarriageCanonicalEngine,
 * MarriageReportView, marriage_canonical_bundle, etc.) is generated, stored,
 * and requested entirely under `kind: "cohabitation"`
 * (POST /api/relationship/analyze/premium with relationship_kind:
 * "cohabitation" -> runCohabitationDeepAnalysis -> buildMarriageReport ->
 * result_premium_by_kind.cohabitation). This is intentional and NOT changed
 * by this constant — renaming the persisted kind would be a migration, not
 * a naming fix. `MARRIAGE_PRODUCT_KIND` exists only so a future branch on
 * "which kind is Marriage" can reference a named, greppable constant
 * instead of a bare "cohabitation" string literal that reads as unrelated
 * to the Marriage product.
 */
export const MARRIAGE_PRODUCT_KIND = "cohabitation" as const satisfies RelationshipKind;

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  romantic: "연인",
  work: "동료",
  cohabitation: "동거·결혼", // product-facing name: Marriage — see MARRIAGE_PRODUCT_KIND above
  friendship: "친구",
  family: "가족",
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
  getWorkColleagueDeepReport,
  getCohabitationDeepReport,
  getFamilyParentDeepReport,
  getFriendSocialDeepReport,
  getPremiumPayloadForKindLocale,
  hasPremiumCacheForKind,
  hasPremiumCacheForKindLocale,
  mergePremiumKindLocale,
} from "./premiumByKind";
export { isRelationshipFavorite } from "./analysisLog";
