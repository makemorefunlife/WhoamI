import {
  parseRelationshipKind,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

/** 노션 스타일 배지 라벨 (Relation Lab) */
export const RELATIONSHIP_KIND_BADGE_LABELS: Record<RelationshipKind, string> =
  {
    cohabitation: "부부",
    romantic: "연인",
    family: "가족",
    friendship: "친구",
    work: "동료",
  };

export const RELATIONSHIP_KIND_BADGE_STYLES: Record<RelationshipKind, string> = {
  cohabitation: "bg-rose-50 text-rose-700",
  romantic: "bg-amber-50 text-amber-700",
  family: "bg-emerald-50 text-emerald-700",
  friendship: "bg-yellow-50 text-yellow-700",
  work: "bg-slate-100 text-slate-700",
};

const UNSPECIFIED_BADGE_STYLE = "bg-gray-100 text-gray-600";

export const ANALYSIS_LEVEL_BADGE_STYLES = {
  basic: "bg-surface-container-high text-on-surface-variant",
  premium: "bg-violet-50 text-violet-700",
} as const;

export const ANALYSIS_LEVEL_BADGE_LABELS = {
  basic: "기본",
  premium: "심화",
} as const;

export function relationshipKindForBadge(
  kind: RelationshipKind | "unspecified" | string | null | undefined,
): RelationshipKind | "unspecified" {
  if (kind === "unspecified" || kind == null || kind === "") {
    return "unspecified";
  }
  return parseRelationshipKind(kind);
}

export function relationshipKindBadgeLabel(
  kind: RelationshipKind | "unspecified",
): string {
  if (kind === "unspecified") return "관계";
  return RELATIONSHIP_KIND_BADGE_LABELS[kind];
}

export function relationshipKindBadgeClassName(
  kind: RelationshipKind | "unspecified",
): string {
  if (kind === "unspecified") return UNSPECIFIED_BADGE_STYLE;
  return RELATIONSHIP_KIND_BADGE_STYLES[kind];
}

/** 선택 카드 등에서 쓰는 짧은 설명 */
export function relationshipKindBadgeHint(kind: RelationshipKind): string {
  return RELATIONSHIP_KIND_LABELS[kind];
}

export const RELATIONSHIP_KIND_BADGE_BASE_CLASS =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";

export const ANALYSIS_LEVEL_BADGE_BASE_CLASS =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
