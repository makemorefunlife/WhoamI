"use client";

import {
  ANALYSIS_LEVEL_BADGE_BASE_CLASS,
  ANALYSIS_LEVEL_BADGE_LABELS,
  ANALYSIS_LEVEL_BADGE_STYLES,
  relationshipKindBadgeClassName,
  relationshipKindBadgeLabel,
  relationshipKindForBadge,
  RELATIONSHIP_KIND_BADGE_BASE_CLASS,
} from "@/lib/relationship/relationshipKindBadge";

type KindInput = RelationshipKind | "unspecified" | string | null | undefined;

type RelationshipKindBadgeProps = {
  kind: KindInput;
  className?: string;
};

export function RelationshipKindBadge({
  kind,
  className = "",
}: RelationshipKindBadgeProps) {
  const resolved = relationshipKindForBadge(kind);
  const label = relationshipKindBadgeLabel(resolved);
  const color = relationshipKindBadgeClassName(resolved);

  return (
    <span
      className={`${RELATIONSHIP_KIND_BADGE_BASE_CLASS} ${color} ${className}`.trim()}
    >
      {label}
    </span>
  );
}

type AnalysisLevelBadgeProps = {
  level: "basic" | "premium";
  className?: string;
};

export function AnalysisLevelBadge({
  level,
  className = "",
}: AnalysisLevelBadgeProps) {
  return (
    <span
      className={`${ANALYSIS_LEVEL_BADGE_BASE_CLASS} ${ANALYSIS_LEVEL_BADGE_STYLES[level]} ${className}`.trim()}
    >
      {ANALYSIS_LEVEL_BADGE_LABELS[level]}
    </span>
  );
}

type RelationshipAnalysisBadgeGroupProps = {
  kind: KindInput;
  level?: "basic" | "premium";
  className?: string;
};

/** 관계 카테고리 + 분석 등급 배지 묶음 */
export function RelationshipAnalysisBadgeGroup({
  kind,
  level,
  className = "",
}: RelationshipAnalysisBadgeGroupProps) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <RelationshipKindBadge kind={kind} />
      {level ? <AnalysisLevelBadge level={level} /> : null}
    </span>
  );
}
