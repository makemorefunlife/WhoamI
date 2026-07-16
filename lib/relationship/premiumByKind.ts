import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
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

/**
 * kind별 premium 캐시.
 * perspectives-only는 레거시 잔여물 — cache hit로 보지 않음 (deep format만 완료).
 *
 * Locale: prefer `byLocale["en-US"|"ko-KR"]`. Flat legacy deep payloads are
 * treated as cache **miss** for locale-strict hits (safe default).
 */
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

export type PremiumKindSlot = {
  byLocale?: Partial<Record<Locale, PremiumKindPayload>>;
  perspectives?: Record<string, unknown>;
  /** @deprecated Legacy flat deep — not a locale-safe hit */
  format?: string;
  report?: unknown;
};

export type ResultPremiumByKind = Partial<
  Record<RelationshipKind, PremiumKindSlot | PremiumKindPayload>
>;

function isDeepFormatPayload(
  payload: PremiumKindPayload | PremiumKindSlot | undefined,
): payload is Extract<PremiumKindPayload, { format: string }> {
  return (
    !!payload &&
    typeof payload === "object" &&
    "format" in payload &&
    Boolean((payload as { format?: string }).format) &&
    !("byLocale" in payload && (payload as PremiumKindSlot).byLocale)
  );
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
  if (!payload || !isDeepFormatPayload(payload)) return false;

  if (kind === "work") {
    return (
      payload.format === WORK_COLLEAGUE_DEEP_FORMAT &&
      isWorkColleagueDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "cohabitation") {
    return (
      payload.format === COHABITATION_DEEP_FORMAT &&
      isCohabitationDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "family") {
    return (
      payload.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
      isFamilyParentChildDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }
  if (kind === "friendship") {
    return (
      payload.format === FRIEND_SOCIAL_DEEP_FORMAT &&
      isFriendSocialDeepReport({
        format: payload.format,
        report: payload.report,
      })
    );
  }

  if (kind === "romantic" && payload.format === ROMANTIC_SAJU_DEEP_FORMAT) {
    return isRomanticSajuDeepReport({ report: payload.report });
  }
  return deepReportValid(payload.format, payload.report);
}

function asSlot(
  raw: PremiumKindSlot | PremiumKindPayload | undefined,
): PremiumKindSlot | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return raw as PremiumKindSlot;
}

/** Resolve deep payload for a kind + locale (strict — legacy flat = miss). */
export function getPremiumPayloadForKindLocale(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  locale: Locale | string,
): PremiumKindPayload | null {
  const resolved = normalizeLocale(locale);
  const slot = asSlot(byKind?.[kind]);
  if (!slot) return null;

  const fromBucket = slot.byLocale?.[resolved];
  if (fromBucket && kindPayloadHasCache(fromBucket, kind)) {
    return fromBucket;
  }

  // Optional: migrate-safe hit when legacy meta.locale matches
  if (isDeepFormatPayload(slot)) {
    const meta = (slot.report as { meta?: Record<string, unknown> } | undefined)
      ?.meta;
    const metaLocale = normalizeLocale(
      meta?.locale ?? meta?.language ?? null,
    );
    if (
      meta?.locale != null ||
      meta?.language != null
    ) {
      if (metaLocale === resolved && kindPayloadHasCache(slot, kind)) {
        return slot;
      }
    }
    // No locale meta → miss (safe)
  }

  return null;
}

/**
 * Locale-strict cache hit.
 * @deprecated Prefer hasPremiumCacheForKindLocale — kept for callers that pass locale as 3rd arg.
 */
export function hasPremiumCacheForKind(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  locale?: Locale | string,
): boolean {
  if (locale != null) {
    return getPremiumPayloadForKindLocale(byKind, kind, locale) != null;
  }
  // Locale omitted: true if any byLocale entry OR legacy deep (completion checks)
  const slot = asSlot(byKind?.[kind]);
  if (!slot) return false;
  if (slot.byLocale) {
    return (Object.keys(slot.byLocale) as Locale[]).some((loc) =>
      kindPayloadHasCache(slot.byLocale?.[loc], kind),
    );
  }
  return kindPayloadHasCache(slot as PremiumKindPayload, kind);
}

export function hasPremiumCacheForKindLocale(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  locale: Locale | string,
): boolean {
  return getPremiumPayloadForKindLocale(byKind, kind, locale) != null;
}

/** Atomic merge: write one locale without wiping other locales or other kinds. */
export function mergePremiumKindLocale(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  locale: Locale | string,
  payload: PremiumKindPayload,
): ResultPremiumByKind {
  const resolved = normalizeLocale(locale);
  const prev = { ...(byKind ?? {}) };
  const rawSlot = prev[kind];
  const prevSlot: PremiumKindSlot = asSlot(rawSlot) ?? {};
  const prevByLocale: Partial<Record<Locale, PremiumKindPayload>> = {
    ...(prevSlot.byLocale ?? {}),
  };

  // Lift legacy flat deep into byLocale once (under its meta locale or skip)
  if (isDeepFormatPayload(rawSlot) && !prevSlot.byLocale) {
    const meta = (rawSlot.report as { meta?: Record<string, unknown> })?.meta;
    if (meta?.locale != null || meta?.language != null) {
      const lift = normalizeLocale(meta.locale ?? meta.language);
      prevByLocale[lift] = rawSlot;
    }
  }

  prevByLocale[resolved] = payload;

  const nextSlot: PremiumKindSlot = {
    byLocale: prevByLocale,
  };
  const prevPerspectives =
    prevSlot.perspectives ??
    (rawSlot &&
    typeof rawSlot === "object" &&
    "perspectives" in rawSlot
      ? (rawSlot as { perspectives?: Record<string, unknown> }).perspectives
      : undefined);
  if (prevPerspectives) {
    nextSlot.perspectives = prevPerspectives;
  }

  prev[kind] = nextSlot;
  return prev;
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
  const slot = asSlot(byKind?.[kind]);
  const perspectives =
    slot?.perspectives ??
    (slot && "perspectives" in slot
      ? (slot as { perspectives?: Record<string, unknown> }).perspectives
      : undefined);
  if (perspectives) {
    const block = perspectives;
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

function reportFromLocaleOrLegacy(
  byKind: ResultPremiumByKind | null | undefined,
  kind: RelationshipKind,
  format: string,
  locale?: Locale | string,
): unknown | null {
  if (locale != null) {
    const payload = getPremiumPayloadForKindLocale(byKind, kind, locale);
    if (
      payload &&
      isDeepFormatPayload(payload) &&
      payload.format === format
    ) {
      return payload.report;
    }
    return null;
  }
  const slot = asSlot(byKind?.[kind]);
  if (!slot) return null;
  if (slot.byLocale) {
    for (const p of Object.values(slot.byLocale)) {
      if (p && isDeepFormatPayload(p) && p.format === format) {
        return p.report;
      }
    }
  }
  if (isDeepFormatPayload(slot) && slot.format === format) {
    return slot.report;
  }
  return null;
}

export function getRomanticSajuDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  locale?: Locale | string,
): RomanticSajuDeepReport["report"] | null {
  const report = reportFromLocaleOrLegacy(
    byKind,
    "romantic",
    ROMANTIC_SAJU_DEEP_FORMAT,
    locale,
  );
  if (report && isRomanticSajuDeepReport({ report })) {
    return report as RomanticSajuDeepReport["report"];
  }
  return null;
}

export function getWorkColleagueDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  locale?: Locale | string,
): WorkColleagueDeepReport["report"] | null {
  const report = reportFromLocaleOrLegacy(
    byKind,
    "work",
    WORK_COLLEAGUE_DEEP_FORMAT,
    locale,
  );
  if (
    report &&
    isWorkColleagueDeepReport({
      format: WORK_COLLEAGUE_DEEP_FORMAT,
      report,
    })
  ) {
    return report as WorkColleagueDeepReport["report"];
  }
  return null;
}

export function getCohabitationDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  locale?: Locale | string,
): CohabitationDeepReport["report"] | null {
  const report = reportFromLocaleOrLegacy(
    byKind,
    "cohabitation",
    COHABITATION_DEEP_FORMAT,
    locale,
  );
  if (
    report &&
    isCohabitationDeepReport({
      format: COHABITATION_DEEP_FORMAT,
      report,
    })
  ) {
    return report as CohabitationDeepReport["report"];
  }
  return null;
}

export function getFamilyParentDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  locale?: Locale | string,
): FamilyParentChildDeepReport["report"] | null {
  const report = reportFromLocaleOrLegacy(
    byKind,
    "family",
    FAMILY_PARENT_CHILD_DEEP_FORMAT,
    locale,
  );
  if (
    report &&
    isFamilyParentChildDeepReport({
      format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
      report,
    })
  ) {
    return report as FamilyParentChildDeepReport["report"];
  }
  return null;
}

export function getFriendSocialDeepReport(
  byKind: ResultPremiumByKind | null | undefined,
  locale?: Locale | string,
): FriendSocialDeepReport["report"] | null {
  const report = reportFromLocaleOrLegacy(
    byKind,
    "friendship",
    FRIEND_SOCIAL_DEEP_FORMAT,
    locale,
  );
  if (
    report &&
    isFriendSocialDeepReport({
      format: FRIEND_SOCIAL_DEEP_FORMAT,
      report,
    })
  ) {
    return report as FriendSocialDeepReport["report"];
  }
  return null;
}
