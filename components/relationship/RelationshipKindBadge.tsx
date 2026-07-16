"use client";

import {
  ANALYSIS_LEVEL_BADGE_BASE_CLASS,
  ANALYSIS_LEVEL_BADGE_STYLES,
  relationshipKindBadgeClassName,
  relationshipKindForBadge,
  RELATIONSHIP_KIND_BADGE_BASE_CLASS,
} from "@/lib/relationship/relationshipKindBadge";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n/messages";

type KindInput = RelationshipKind | "unspecified" | string | null | undefined;

type RelationshipKindBadgeProps = {
  kind: KindInput;
  className?: string;
};

function localizedKindBadgeLabel(
  kind: RelationshipKind | "unspecified",
  messages: MessageCatalog,
): string {
  if (kind === "unspecified") return messages.hub.badgeOtherRelationship;
  const map: Record<RelationshipKind, string> = {
    romantic: messages.hub.kindBadgeRomantic,
    work: messages.hub.kindBadgeWork,
    cohabitation: messages.hub.kindBadgeCohabitation,
    friendship: messages.hub.kindBadgeFriendship,
    family: messages.hub.kindBadgeFamily,
  };
  return map[kind];
}

export function RelationshipKindBadge({
  kind,
  className = "",
}: RelationshipKindBadgeProps) {
  const messages = useMessages();
  const resolved = relationshipKindForBadge(kind);
  const label = localizedKindBadgeLabel(resolved, messages);
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
  const messages = useMessages();
  const label =
    level === "premium"
      ? messages.hub.analysisLevelPremium
      : messages.hub.analysisLevelBasic;
  return (
    <span
      className={`${ANALYSIS_LEVEL_BADGE_BASE_CLASS} ${ANALYSIS_LEVEL_BADGE_STYLES[level]} ${className}`.trim()}
    >
      {label}
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
