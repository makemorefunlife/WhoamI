import type { RelationshipKind } from "./relationshipKind";
import { getViewerPerspectiveSlice } from "./normalizeRelationshipPerspectives";
import {
  isRomanticSajuDeepReport,
  type RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";

/** kind별 premium 캐시 — 4축 perspectives 또는 연인 사주 심화 report */
export type PremiumKindPayload =
  | { perspectives?: Record<string, unknown> }
  | {
      format: typeof ROMANTIC_SAJU_DEEP_FORMAT;
      report: RomanticSajuDeepReport["report"];
    };

export type ResultPremiumByKind = Partial<
  Record<RelationshipKind, PremiumKindPayload>
>;

function legacyPremiumPayload(
  legacyPremium: unknown,
): PremiumKindPayload | undefined {
  if (!legacyPremium || typeof legacyPremium !== "object") return undefined;
  const legacy = legacyPremium as Record<string, unknown>;
  if (
    legacy.format === ROMANTIC_SAJU_DEEP_FORMAT &&
    isRomanticSajuDeepReport({ report: legacy.report })
  ) {
    return legacy as PremiumKindPayload;
  }
  if (legacy.perspectives) {
    return { perspectives: legacy.perspectives as Record<string, unknown> };
  }
  return undefined;
}

function kindPayloadHasCache(
  payload: PremiumKindPayload | undefined,
  kind: RelationshipKind,
  legacyPremium: unknown,
): boolean {
  if (!payload) {
    const legacy = legacyPremiumPayload(legacyPremium);
    if (!legacy) return false;
    if (kind === "romantic") {
      return (
        "format" in legacy &&
        legacy.format === ROMANTIC_SAJU_DEEP_FORMAT &&
        isRomanticSajuDeepReport({ report: legacy.report })
      );
    }
    if (kind === "friendship" || kind === "family" || kind === "work") {
      return Boolean(
        "perspectives" in legacy &&
          legacy.perspectives &&
          typeof legacy.perspectives === "object" &&
          Object.keys(legacy.perspectives).length > 0,
      );
    }
    return false;
  }
  if ("format" in payload && payload.format === ROMANTIC_SAJU_DEEP_FORMAT) {
    return isRomanticSajuDeepReport({ report: payload.report });
  }
  const block = payload.perspectives;
  return Boolean(block && typeof block === "object" && Object.keys(block).length > 0);
}

export function hasPremiumCacheForKind(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium: unknown,
  kind: RelationshipKind,
): boolean {
  return kindPayloadHasCache(byKind?.[kind], kind, legacyPremium);
}

export function getPremiumPerspectiveForKind(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium: unknown,
  kind: RelationshipKind,
  viewerReportId: string,
  reportIdA?: string,
  reportIdB?: string,
): Record<string, unknown> | null {
  const payload = byKind?.[kind];
  if (payload && "perspectives" in payload && payload.perspectives) {
    const block = payload.perspectives as Record<string, unknown>;
    if (reportIdA && reportIdB) {
      const slice = getViewerPerspectiveSlice(
        block,
        viewerReportId,
        reportIdA,
        reportIdB,
      );
      if (slice) return slice;
    } else {
      const p = block[viewerReportId];
      if (p && typeof p === "object") return p as Record<string, unknown>;
    }
  }
  const legacyPayload = legacyPremiumPayload(legacyPremium);
  if (
    legacyPayload &&
    "perspectives" in legacyPayload &&
    legacyPayload.perspectives &&
    kind !== "romantic"
  ) {
    if (reportIdA && reportIdB) {
      return getViewerPerspectiveSlice(
        legacyPayload.perspectives,
        viewerReportId,
        reportIdA,
        reportIdB,
      );
    }
    const p = legacyPayload.perspectives[viewerReportId];
    if (p && typeof p === "object") return p as Record<string, unknown>;
  }
  return null;
}

export function getRomanticSajuDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium?: unknown,
): RomanticSajuDeepReport["report"] | null {
  const payload = byKind?.romantic ?? legacyPremiumPayload(legacyPremium);
  if (
    payload &&
    "format" in payload &&
    payload.format === ROMANTIC_SAJU_DEEP_FORMAT &&
    isRomanticSajuDeepReport({ report: payload.report })
  ) {
    return payload.report;
  }
  return null;
}
