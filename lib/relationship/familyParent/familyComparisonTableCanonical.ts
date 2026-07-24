/**
 * Family comparison_table ×6 — typed canonical projection.
 * Uses band_parent / band_child (directional). parentRole never mutates bands.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatFamilyCompareBandLabel,
  resolveFamilyComparisonTableTyped,
  type FamilyCompareRowId,
  type FamilyCompareTableResolverParams,
  type FamilyComparisonTableTypedValue,
} from "./familySajuCompareTable";

export const FAMILY_COMPARISON_TABLE_CANONICAL_SOURCE =
  "resolveFamilyComparisonTableTyped" as const;

export const FAMILY_COMPARISON_TABLE_PERSISTENCE_PATH =
  "canonical_projections.comparison_table" as const;

export const FAMILY_COMPARISON_TABLE_CLIENT_PATH =
  "canonical_projections.comparison_table" as const;

export const FAMILY_COMPARISON_TABLE_PSYCH_MODE = "none" as const;

export type FamilyComparisonTableValue = FamilyComparisonTableTypedValue;

export type FamilyComparisonTableCanonical =
  CanonicalJudgment<FamilyComparisonTableValue>;

const ROW_IDS: FamilyCompareRowId[] = [
  "correction_style",
  "bond_distance",
  "affection_expression",
  "guidance_balance",
  "gathering_recovery",
  "home_climate",
];

const BAND_SETS: Record<FamilyCompareRowId, Set<string>> = {
  correction_style: new Set(["wealth", "officer", "food", "seal", "self"]),
  bond_distance: new Set(["distant", "balanced", "smothering"]),
  affection_expression: new Set(["wood", "fire", "earth", "metal", "water"]),
  guidance_balance: new Set([
    "receptive",
    "explanatory",
    "standards",
    "mixed",
  ]),
  gathering_recovery: new Set(["weak", "balanced", "strong"]),
  home_climate: new Set(["low", "medium", "high"]),
};

function cloneTable(
  v: FamilyComparisonTableValue,
): FamilyComparisonTableValue {
  return {
    correction_style: { ...v.correction_style },
    bond_distance: { ...v.bond_distance },
    affection_expression: { ...v.affection_expression },
    guidance_balance: { ...v.guidance_balance },
    gathering_recovery: { ...v.gathering_recovery },
    home_climate: { ...v.home_climate },
  };
}

export function comparisonTableValueFromResolver(
  params: FamilyCompareTableResolverParams,
): FamilyComparisonTableValue {
  return resolveFamilyComparisonTableTyped(params);
}

export function buildFamilyComparisonTableCanonical(
  finalized: FamilyComparisonTableValue | null | undefined,
): FamilyComparisonTableCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneTable(finalized),
    source: FAMILY_COMPARISON_TABLE_CANONICAL_SOURCE,
    psychMode: FAMILY_COMPARISON_TABLE_PSYCH_MODE,
    persistencePath: FAMILY_COMPARISON_TABLE_PERSISTENCE_PATH,
  };
}

export function buildFamilyComparisonTableClientProjection(
  value: FamilyComparisonTableValue | null | undefined,
): FamilyComparisonTableValue | null {
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

export function injectFamilyComparisonTableClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: FamilyComparisonTableValue | null | undefined): T {
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
  rowId: FamilyCompareRowId,
): { band_parent: string; band_child: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const set = BAND_SETS[rowId];
  if (typeof o.band_parent !== "string" || typeof o.band_child !== "string") {
    return null;
  }
  if (!set.has(o.band_parent) || !set.has(o.band_child)) return null;
  return { band_parent: o.band_parent, band_child: o.band_child };
}

/** Malformed → null (never invent from shortLabel). */
export function readFamilyComparisonTableCanonicalProjection(
  report:
    | { canonical_projections?: { comparison_table?: unknown } }
    | null
    | undefined,
): FamilyComparisonTableValue | null {
  const raw = report?.canonical_projections?.comparison_table;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<FamilyComparisonTableValue> = {};
  for (const id of ROW_IDS) {
    const row = parseRow(o[id], id);
    if (!row) return null;
    (out as Record<string, unknown>)[id] = row;
  }
  return out as FamilyComparisonTableValue;
}

export function formatFamilyCompareCanonicalLabel(
  rowId: FamilyCompareRowId,
  band: string,
  locale?: string | null,
): string {
  const loc: Locale =
    locale === "en" || locale === "en-US" || locale?.startsWith("en")
      ? "en-US"
      : "ko-KR";
  return formatFamilyCompareBandLabel(rowId, band, loc);
}

export { formatFamilyCompareBandLabel };
