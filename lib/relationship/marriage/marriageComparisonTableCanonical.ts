/**
 * Marriage comparison_table ×6 — typed canonical projection.
 * Resolver: resolveMarriageComparisonTableTyped (marriageSajuCompareTable.ts).
 * Labels derived from bands; never the reverse.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatMarriageCompareBandLabel,
  resolveMarriageComparisonTableTyped,
  type MarriageCompareRowId,
  type MarriageCompareTableResolverParams,
  type MarriageComparisonTableTypedValue,
} from "./marriageSajuCompareTable";

export const MARRIAGE_COMPARISON_TABLE_CANONICAL_SOURCE =
  "resolveMarriageComparisonTableTyped" as const;

export const MARRIAGE_COMPARISON_TABLE_PERSISTENCE_PATH =
  "canonical_projections.comparison_table" as const;

export const MARRIAGE_COMPARISON_TABLE_CLIENT_PATH =
  "canonical_projections.comparison_table" as const;

export const MARRIAGE_COMPARISON_TABLE_PSYCH_MODE = "none" as const;

export type MarriageComparisonTableValue = MarriageComparisonTableTypedValue;

export type MarriageComparisonTableCanonical =
  CanonicalJudgment<MarriageComparisonTableValue>;

const ROW_IDS: MarriageCompareRowId[] = [
  "household_stress",
  "marital_conflict",
  "bedroom_lead",
  "family_boundary",
  "asset_management",
  "parenting_style",
];

const BAND_SETS: Record<MarriageCompareRowId, Set<string>> = {
  household_stress: new Set(["wealth", "officer", "food", "seal", "self"]),
  marital_conflict: new Set(["explosive", "stonewall", "balanced"]),
  bedroom_lead: new Set(["sweet_guide", "power_leader"]),
  family_boundary: new Set(["true", "false"]),
  asset_management: new Set(["high", "medium", "low"]),
  parenting_style: new Set(["empathy", "structure"]),
};

function cloneTable(
  v: MarriageComparisonTableValue,
): MarriageComparisonTableValue {
  return {
    household_stress: { ...v.household_stress },
    marital_conflict: { ...v.marital_conflict },
    bedroom_lead: { ...v.bedroom_lead },
    family_boundary: { ...v.family_boundary },
    asset_management: { ...v.asset_management },
    parenting_style: { ...v.parenting_style },
  };
}

export function comparisonTableValueFromResolver(
  params: MarriageCompareTableResolverParams,
): MarriageComparisonTableValue {
  return resolveMarriageComparisonTableTyped(params);
}

export function buildMarriageComparisonTableCanonical(
  finalized: MarriageComparisonTableValue | null | undefined,
): MarriageComparisonTableCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneTable(finalized),
    source: MARRIAGE_COMPARISON_TABLE_CANONICAL_SOURCE,
    psychMode: MARRIAGE_COMPARISON_TABLE_PSYCH_MODE,
    persistencePath: MARRIAGE_COMPARISON_TABLE_PERSISTENCE_PATH,
  };
}

export function buildMarriageComparisonTableClientProjection(
  value: MarriageComparisonTableValue | null | undefined,
): MarriageComparisonTableValue | null {
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

export function injectMarriageComparisonTableClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: MarriageComparisonTableValue | null | undefined): T {
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
  rowId: MarriageCompareRowId,
): { band_a: string; band_b: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const set = BAND_SETS[rowId];
  if (typeof o.band_a !== "string" || typeof o.band_b !== "string") return null;
  if (!set.has(o.band_a) || !set.has(o.band_b)) return null;
  return { band_a: o.band_a, band_b: o.band_b };
}

/** Malformed → null (never invent from shortLabel prose). */
export function readMarriageComparisonTableCanonicalProjection(
  report:
    | { canonical_projections?: { comparison_table?: unknown } }
    | null
    | undefined,
): MarriageComparisonTableValue | null {
  const raw = report?.canonical_projections?.comparison_table;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<MarriageComparisonTableValue> = {};
  for (const id of ROW_IDS) {
    const row = parseRow(o[id], id);
    if (!row) return null;
    (out as Record<string, unknown>)[id] = row;
  }
  return out as MarriageComparisonTableValue;
}

export function formatMarriageCompareCanonicalLabel(
  rowId: MarriageCompareRowId,
  band: string,
  locale?: string | null,
): string {
  const loc: Locale =
    locale === "en" || locale === "en-US" || locale?.startsWith("en")
      ? "en-US"
      : "ko-KR";
  return formatMarriageCompareBandLabel(rowId, band, loc);
}

export { formatMarriageCompareBandLabel };
