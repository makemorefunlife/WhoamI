/**
 * Work Colleague comparison_table ×6 — typed canonical projection.
 * Resolver: resolveWorkComparisonTableTyped (sajuCompareTable.ts).
 * Labels derived from bands; never the reverse.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatWorkCompareBandLabel,
  resolveWorkComparisonTableTyped,
  type WorkCompareRowId,
  type WorkComparisonTableTypedValue,
} from "./sajuCompareTable";
import type { WorkColleagueContext } from "./buildWorkColleagueContext";

export const WORK_COMPARISON_TABLE_CANONICAL_SOURCE =
  "resolveWorkComparisonTableTyped" as const;

export const WORK_COMPARISON_TABLE_PERSISTENCE_PATH =
  "canonical_projections.comparison_table" as const;

export const WORK_COMPARISON_TABLE_CLIENT_PATH =
  "canonical_projections.comparison_table" as const;

export const WORK_COMPARISON_TABLE_PSYCH_MODE = "none" as const;

export type WorkComparisonTableValue = WorkComparisonTableTypedValue;

export type WorkComparisonTableCanonical =
  CanonicalJudgment<WorkComparisonTableValue>;

const ROW_IDS: WorkCompareRowId[] = [
  "boundary",
  "feedback",
  "synergy_position",
  "burnout",
  "risk_taking",
  "reporting_rhythm",
];

const BAND_SETS: Record<WorkCompareRowId, Set<string>> = {
  boundary: new Set(["재성", "관성", "식상", "인성", "비겁"]),
  feedback: new Set(["재성", "관성", "식상", "인성", "비겁"]),
  synergy_position: new Set(["wood", "fire", "earth", "metal", "water"]),
  burnout: new Set([
    "ja",
    "chuk",
    "in",
    "myo",
    "jin",
    "sa",
    "o",
    "mi",
    "sin",
    "yu",
    "sul",
    "hae",
  ]),
  risk_taking: new Set(["strong", "weak", "balanced"]),
  reporting_rhythm: new Set(["yang", "yin"]),
};

function cloneTable(v: WorkComparisonTableValue): WorkComparisonTableValue {
  return {
    boundary: { ...v.boundary },
    feedback: { ...v.feedback },
    synergy_position: { ...v.synergy_position },
    burnout: { ...v.burnout },
    risk_taking: { ...v.risk_taking },
    reporting_rhythm: { ...v.reporting_rhythm },
  };
}

export function comparisonTableValueFromResolver(
  ctx: WorkColleagueContext,
): WorkComparisonTableValue {
  return resolveWorkComparisonTableTyped(ctx);
}

export function buildWorkComparisonTableCanonical(
  finalized: WorkComparisonTableValue | null | undefined,
): WorkComparisonTableCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneTable(finalized),
    source: WORK_COMPARISON_TABLE_CANONICAL_SOURCE,
    psychMode: WORK_COMPARISON_TABLE_PSYCH_MODE,
    persistencePath: WORK_COMPARISON_TABLE_PERSISTENCE_PATH,
  };
}

export function buildWorkComparisonTableClientProjection(
  value: WorkComparisonTableValue | null | undefined,
): WorkComparisonTableValue | null {
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

export function injectWorkComparisonTableClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: WorkComparisonTableValue | null | undefined): T {
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
  rowId: WorkCompareRowId,
): { band_a: string; band_b: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const set = BAND_SETS[rowId];
  if (typeof o.band_a !== "string" || typeof o.band_b !== "string") return null;
  if (!set.has(o.band_a) || !set.has(o.band_b)) return null;
  return { band_a: o.band_a, band_b: o.band_b };
}

/** Malformed → null (never invent from shortLabel prose). */
export function readWorkComparisonTableCanonicalProjection(
  report:
    | { canonical_projections?: { comparison_table?: unknown } }
    | null
    | undefined,
): WorkComparisonTableValue | null {
  const raw = report?.canonical_projections?.comparison_table;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<WorkComparisonTableValue> = {};
  for (const id of ROW_IDS) {
    const row = parseRow(o[id], id);
    if (!row) return null;
    (out as Record<string, unknown>)[id] = row;
  }
  return out as WorkComparisonTableValue;
}

export function workCompareBandForViewer(
  row: { band_a: string; band_b: string } | null | undefined,
  viewerIsReportA: boolean,
  column: "me" | "partner",
): string | null {
  if (!row) return null;
  if (column === "me") return viewerIsReportA ? row.band_a : row.band_b;
  return viewerIsReportA ? row.band_b : row.band_a;
}

export function formatWorkCompareCanonicalLabel(
  rowId: WorkCompareRowId,
  band: string,
  locale?: string | null,
): string {
  const loc: Locale =
    locale === "en" || locale === "en-US" || locale?.startsWith("en")
      ? "en-US"
      : "ko-KR";
  return formatWorkCompareBandLabel(rowId, band, loc);
}

export { formatWorkCompareBandLabel };
