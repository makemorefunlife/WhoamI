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

function deepReportValid(format: string, report: unknown): boolean {
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

function kindPayloadHasCache(
  payload: PremiumKindPayload | undefined,
  kind: RelationshipKind,
): boolean {
  if (!payload) return false;

  if (kind === "work") {
    return (
      isDeepFormatPayload(payload) &&
      payload.format === WORK_COLLEAGUE_DEEP_FORMAT &&
      isWorkColleagueDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "cohabitation") {
    return (
      isDeepFormatPayload(payload) &&
      payload.format === COHABITATION_DEEP_FORMAT &&
      isCohabitationDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "family") {
    return (
      isDeepFormatPayload(payload) &&
      payload.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
      isFamilyParentChildDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "friendship") {
    return (
      isDeepFormatPayload(payload) &&
      payload.format === FRIEND_SOCIAL_DEEP_FORMAT &&
      isFriendSocialDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }

  // romantic (and any remaining kind): deep format or non-empty perspectives
  if (isDeepFormatPayload(payload)) {
    if (kind === "romantic" && payload.format === ROMANTIC_SAJU_DEEP_FORMAT) {
      return isRomanticSajuDeepReport({ report: payload.report });
    }
    return deepReportValid(payload.format, payload.report);
  }
  const block = payload.perspectives;
  return Boolean(
    block && typeof block === "object" && Object.keys(block).length > 0,
  );
}

/** True when by_kind[kind] holds a valid premium cache for that kind. */
export function hasPremiumCacheForKind(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
): boolean {
  return kindPayloadHasCache(byKind?.[kind], kind);
}

export function getPremiumPerspectiveForKind(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  viewerReportId: string,
  reportIdA?: string,
  reportIdB?: string,
  options?: { partnerReportName?: string | null },
): Record<string, unknown> | null {
  const sliceOptions = options?.partnerReportName
    ? { partnerReportName: options.partnerReportName }
    : undefined;
  const payload = byKind?.[kind];
  if (payload && "perspectives" in payload && payload.perspectives) {
    const block = payload.perspectives as Record<string, unknown>;
    if (reportIdA && reportIdB) {
      const slice = getViewerPerspectiveSlice(
        block,
        viewerReportId,
        reportIdA,
        reportIdB,
        sliceOptions,
      );
      if (slice) return slice;
    } else {
      const p = block[viewerReportId];
      if (p && typeof p === "object") return p as Record<string, unknown>;
    }
  }
  return null;
}

export function getRomanticSajuDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
): RomanticSajuDeepReport["report"] | null {
  const payload = byKind?.romantic;
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
): WorkColleagueDeepReport["report"] | null {
  const payload = byKind?.work;
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
): CohabitationDeepReport["report"] | null {
  const payload = byKind?.cohabitation;
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
): FamilyParentChildDeepReport["report"] | null {
  const payload = byKind?.family;
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
): FriendSocialDeepReport["report"] | null {
  const payload = byKind?.friendship;
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
