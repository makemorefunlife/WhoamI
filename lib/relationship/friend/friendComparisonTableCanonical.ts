/**
 * Friendship comparison_table ×6 — typed canonical projection.
 * Resolver: resolveFriendComparisonTableTyped (friendSajuCompareTable.ts).
 * Labels derived from bands; never the reverse.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatFriendCompareBandLabel,
  resolveFriendComparisonTableTyped,
  type FriendCompareRowId,
  type FriendComparisonTableTypedValue,
} from "./friendSajuCompareTable";
import type { FriendDnaProfile } from "@/lib/saju/friendAnalysis";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";

export const FRIEND_COMPARISON_TABLE_CANONICAL_SOURCE =
  "resolveFriendComparisonTableTyped" as const;

export const FRIEND_COMPARISON_TABLE_PERSISTENCE_PATH =
  "canonical_projections.comparison_table" as const;

export const FRIEND_COMPARISON_TABLE_CLIENT_PATH =
  "canonical_projections.comparison_table" as const;

export const FRIEND_COMPARISON_TABLE_PSYCH_MODE = "none" as const;

export type FriendComparisonTableValue = FriendComparisonTableTypedValue;

export type FriendComparisonTableCanonical =
  CanonicalJudgment<FriendComparisonTableValue>;

const ROW_IDS: FriendCompareRowId[] = [
  "daily_share_tempo",
  "upset_expression",
  "affection_language",
  "battery_recharge",
  "hangout_planning",
  "communication_rhythm",
];

const BAND_SETS: Record<FriendCompareRowId, Set<string>> = {
  daily_share_tempo: new Set(["active", "steady"]),
  upset_expression: new Set(["wealth", "officer", "food", "seal", "self"]),
  affection_language: new Set(["wood", "fire", "earth", "metal", "water"]),
  battery_recharge: new Set(["strong", "weak", "balanced"]),
  hangout_planning: new Set(["none", "some", "strong"]),
  communication_rhythm: new Set(["none", "some", "strong"]),
};

function cloneTable(
  v: FriendComparisonTableValue,
): FriendComparisonTableValue {
  return {
    daily_share_tempo: { ...v.daily_share_tempo },
    upset_expression: { ...v.upset_expression },
    affection_language: { ...v.affection_language },
    battery_recharge: { ...v.battery_recharge },
    hangout_planning: { ...v.hangout_planning },
    communication_rhythm: { ...v.communication_rhythm },
  };
}

export function comparisonTableValueFromResolver(params: {
  tenGodsA: TenGodCounts;
  tenGodsB: TenGodCounts;
  dnaA: FriendDnaProfile;
  dnaB: FriendDnaProfile;
  chartA: ChartContext;
  chartB: ChartContext;
}): FriendComparisonTableValue {
  return resolveFriendComparisonTableTyped(params);
}

export function buildFriendComparisonTableCanonical(
  finalized: FriendComparisonTableValue | null | undefined,
): FriendComparisonTableCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneTable(finalized),
    source: FRIEND_COMPARISON_TABLE_CANONICAL_SOURCE,
    psychMode: FRIEND_COMPARISON_TABLE_PSYCH_MODE,
    persistencePath: FRIEND_COMPARISON_TABLE_PERSISTENCE_PATH,
  };
}

export function buildFriendComparisonTableClientProjection(
  value: FriendComparisonTableValue | null | undefined,
): FriendComparisonTableValue | null {
  if (!value) return null;
  return cloneTable(value);
}

type ReportWithProjections = {
  canonical_projections?: {
    comparison_table?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectFriendComparisonTableClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: FriendComparisonTableValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const priorRest =
    prior && typeof prior === "object"
      ? Object.fromEntries(
          Object.entries(prior).filter(([k]) => k !== "comparison_table"),
        )
      : {};
  if (!projection) {
    if (Object.keys(priorRest).length === 0) return rest as T;
    return { ...(rest as T), canonical_projections: priorRest };
  }
  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      comparison_table: cloneTable(projection),
    },
  };
}

function parseRow(
  raw: unknown,
  rowId: FriendCompareRowId,
): { band_a: string; band_b: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const set = BAND_SETS[rowId];
  if (typeof o.band_a !== "string" || typeof o.band_b !== "string") return null;
  if (!set.has(o.band_a) || !set.has(o.band_b)) return null;
  return { band_a: o.band_a, band_b: o.band_b };
}

/** Malformed → null (never invent from shortLabel prose). */
export function readFriendComparisonTableCanonicalProjection(
  report:
    | { canonical_projections?: { comparison_table?: unknown } }
    | null
    | undefined,
): FriendComparisonTableValue | null {
  const raw = report?.canonical_projections?.comparison_table;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<FriendComparisonTableValue> = {};
  for (const id of ROW_IDS) {
    const row = parseRow(o[id], id);
    if (!row) return null;
    (out as Record<string, unknown>)[id] = row;
  }
  return out as FriendComparisonTableValue;
}

export function friendCompareBandForViewer(
  row: { band_a: string; band_b: string } | null | undefined,
  viewerIsReportA: boolean,
  column: "me" | "partner",
): string | null {
  if (!row) return null;
  if (column === "me") return viewerIsReportA ? row.band_a : row.band_b;
  return viewerIsReportA ? row.band_b : row.band_a;
}

export function formatFriendCompareCanonicalLabel(
  rowId: FriendCompareRowId,
  band: string,
  locale?: string | null,
): string {
  const loc: Locale =
    locale === "en" || locale === "en-US" || locale?.startsWith("en")
      ? "en-US"
      : "ko-KR";
  return formatFriendCompareBandLabel(rowId, band, loc);
}

export { formatFriendCompareBandLabel };
