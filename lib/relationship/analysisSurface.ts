import {
  isRelationshipKind,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

/** 리포트 화면 상단 탭 / 허브 종류 선택 — 기본(무료) vs 심화 kind */
export type AnalysisSurface = "basic" | RelationshipKind;

export function isAnalysisSurface(v: unknown): v is AnalysisSurface {
  return v === "basic" || isRelationshipKind(v);
}

export function parseAnalysisSurface(
  v: unknown,
  fallback: AnalysisSurface = "basic",
): AnalysisSurface {
  return isAnalysisSurface(v) ? v : fallback;
}

export function isPremiumAnalysisSurface(
  surface: AnalysisSurface,
): surface is RelationshipKind {
  return surface !== "basic";
}

/** 허브·탭 표시 순서: 기본 → 가족 → 연인 → 친구 → 동료 → 부부 */
export const ANALYSIS_SURFACE_ORDER: readonly AnalysisSurface[] = [
  "basic",
  "family",
  "romantic",
  "friendship",
  "work",
  "cohabitation",
] as const;
