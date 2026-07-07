import type { RelationshipKind } from "./relationshipKind";
import { getViewerPerspectiveSlice } from "./normalizeRelationshipPerspectives";
import {
  isRomanticSajuDeepReport,
  type RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import {
  isWorkColleagueDeepReport,
  type WorkColleagueDeepReport,
} from "@/lib/prompts/relationshipPremium/workColleague/outputSchema";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import {
  isCohabitationDeepReport,
  type CohabitationDeepReport,
} from "@/lib/prompts/relationshipPremium/cohabitation/outputSchema";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import {
  isFamilyParentChildDeepReport,
  type FamilyParentChildDeepReport,
} from "@/lib/prompts/relationshipPremium/familyParentChild/outputSchema";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import {
  isFriendSocialDeepReport,
  type FriendSocialDeepReport,
} from "@/lib/prompts/relationshipPremium/friendSocial/outputSchema";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial";

/** kind별 premium 캐시 — perspectives LLM 또는 사주 심화(deep) report */
export type PremiumKindPayload =
  | { perspectives?: Record<string, unknown> }
  | {
      format: typeof ROMANTIC_SAJU_DEEP_FORMAT;
      report: RomanticSajuDeepReport["report"];
    }
  | {
      format: typeof WORK_COLLEAGUE_DEEP_FORMAT;
      report: WorkColleagueDeepReport["report"];
    }
  | {
      format: typeof COHABITATION_DEEP_FORMAT;
      report: CohabitationDeepReport["report"];
    }
  | {
      format: typeof FAMILY_PARENT_CHILD_DEEP_FORMAT;
      report: FamilyParentChildDeepReport["report"];
    }
  | {
      format: typeof FRIEND_SOCIAL_DEEP_FORMAT;
      report: FriendSocialDeepReport["report"];
    };

export type ResultPremiumByKind = Partial<
  Record<RelationshipKind, PremiumKindPayload>
>;

function isDeepFormatPayload(
  payload: PremiumKindPayload,
): payload is Extract<PremiumKindPayload, { format: string }> {
  return "format" in payload && Boolean(payload.format);
}

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
  if (
    legacy.format === WORK_COLLEAGUE_DEEP_FORMAT &&
    isWorkColleagueDeepReport({ format: legacy.format, report: legacy.report })
  ) {
    return legacy as PremiumKindPayload;
  }
  if (
    legacy.format === COHABITATION_DEEP_FORMAT &&
    isCohabitationDeepReport({ format: legacy.format, report: legacy.report })
  ) {
    return legacy as PremiumKindPayload;
  }
  if (legacy.perspectives) {
    return { perspectives: legacy.perspectives as Record<string, unknown> };
  }
  return undefined;
}

function deepReportValid(
  format: string,
  report: unknown,
): boolean {
  if (format === ROMANTIC_SAJU_DEEP_FORMAT) {
    return isRomanticSajuDeepReport({ report });
  }
  if (format === WORK_COLLEAGUE_DEEP_FORMAT) {
    return isWorkColleagueDeepReport({ format, report });
  }
  if (format === COHABITATION_DEEP_FORMAT) {
    return isCohabitationDeepReport({ format, report });
  }
  if (format === FAMILY_PARENT_CHILD_DEEP_FORMAT) {
    return isFamilyParentChildDeepReport({ format, report });
  }
  if (format === FRIEND_SOCIAL_DEEP_FORMAT) {
    return isFriendSocialDeepReport({ format, report });
  }
  return false;
}

function cohabitationDeepCacheValid(
  payload: PremiumKindPayload | undefined,
  legacyPremium: unknown,
): boolean {
  const pick = payload ?? legacyPremiumPayload(legacyPremium);
  if (!pick || !isDeepFormatPayload(pick)) return false;
  return (
    pick.format === COHABITATION_DEEP_FORMAT &&
    isCohabitationDeepReport({ format: pick.format, report: pick.report })
  );
}

function workDeepCacheValid(
  payload: PremiumKindPayload | undefined,
  legacyPremium: unknown,
): boolean {
  const pick = payload ?? legacyPremiumPayload(legacyPremium);
  if (!pick || !isDeepFormatPayload(pick)) return false;
  return (
    pick.format === WORK_COLLEAGUE_DEEP_FORMAT &&
    isWorkColleagueDeepReport({ format: pick.format, report: pick.report })
  );
}

function familyDeepCacheValid(
  payload: PremiumKindPayload | undefined,
  legacyPremium: unknown,
): boolean {
  const pick = payload ?? legacyPremiumPayload(legacyPremium);
  if (!pick || !isDeepFormatPayload(pick)) return false;
  return (
    pick.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
    isFamilyParentChildDeepReport({ format: pick.format, report: pick.report })
  );
}

function friendshipDeepCacheValid(
  payload: PremiumKindPayload | undefined,
  legacyPremium: unknown,
): boolean {
  const pick = payload ?? legacyPremiumPayload(legacyPremium);
  if (!pick || !isDeepFormatPayload(pick)) return false;
  return (
    pick.format === FRIEND_SOCIAL_DEEP_FORMAT &&
    isFriendSocialDeepReport({ format: pick.format, report: pick.report })
  );
}

function kindPayloadHasCache(
  payload: PremiumKindPayload | undefined,
  kind: RelationshipKind,
  legacyPremium: unknown,
): boolean {
  if (kind === "work") {
    return workDeepCacheValid(payload, legacyPremium);
  }
  if (kind === "cohabitation") {
    return cohabitationDeepCacheValid(payload, legacyPremium);
  }
  if (kind === "family") {
    return familyDeepCacheValid(payload, legacyPremium);
  }
  if (kind === "friendship") {
    return friendshipDeepCacheValid(payload, legacyPremium);
  }

  if (!payload) {
    const legacy = legacyPremiumPayload(legacyPremium);
    if (!legacy) return false;
    if (kind === "romantic") {
      return (
        isDeepFormatPayload(legacy) &&
        legacy.format === ROMANTIC_SAJU_DEEP_FORMAT &&
        isRomanticSajuDeepReport({ report: legacy.report })
      );
    }
    if (kind === "family") {
      return familyDeepCacheValid(undefined, legacyPremium);
    }
    return false;
  }
  if (isDeepFormatPayload(payload)) {
    if (kind === "romantic" && payload.format === ROMANTIC_SAJU_DEEP_FORMAT) {
      return isRomanticSajuDeepReport({ report: payload.report });
    }
    return deepReportValid(payload.format, payload.report);
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
    kind !== "romantic" &&
    kind !== "work" &&
    kind !== "cohabitation" &&
    kind !== "friendship" &&
    kind !== "family"
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
    isDeepFormatPayload(payload) &&
    payload.format === ROMANTIC_SAJU_DEEP_FORMAT &&
    isRomanticSajuDeepReport({ report: payload.report })
  ) {
    return payload.report;
  }
  return null;
}

export function getWorkColleagueDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium?: unknown,
): WorkColleagueDeepReport["report"] | null {
  const payload = byKind?.work ?? legacyPremiumPayload(legacyPremium);
  if (
    payload &&
    isDeepFormatPayload(payload) &&
    payload.format === WORK_COLLEAGUE_DEEP_FORMAT &&
    isWorkColleagueDeepReport({
      format: payload.format,
      report: payload.report,
    })
  ) {
    return payload.report;
  }
  return null;
}

export function getCohabitationDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium?: unknown,
): CohabitationDeepReport["report"] | null {
  const payload = byKind?.cohabitation ?? legacyPremiumPayload(legacyPremium);
  if (
    payload &&
    isDeepFormatPayload(payload) &&
    payload.format === COHABITATION_DEEP_FORMAT &&
    isCohabitationDeepReport({
      format: payload.format,
      report: payload.report,
    })
  ) {
    return payload.report;
  }
  return null;
}

export function getFamilyParentDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium?: unknown,
): FamilyParentChildDeepReport["report"] | null {
  const payload = byKind?.family ?? legacyPremiumPayload(legacyPremium);
  if (
    payload &&
    isDeepFormatPayload(payload) &&
    payload.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
    isFamilyParentChildDeepReport({
      format: payload.format,
      report: payload.report,
    })
  ) {
    return payload.report;
  }
  return null;
}

export function getFriendSocialDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  legacyPremium?: unknown,
): FriendSocialDeepReport["report"] | null {
  const payload = byKind?.friendship ?? legacyPremiumPayload(legacyPremium);
  if (
    payload &&
    isDeepFormatPayload(payload) &&
    payload.format === FRIEND_SOCIAL_DEEP_FORMAT &&
    isFriendSocialDeepReport({
      format: payload.format,
      report: payload.report,
    })
  ) {
    return payload.report;
  }
  return null;
}
