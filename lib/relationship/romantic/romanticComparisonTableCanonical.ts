/**
 * Phase 6-2d7 — Romantic comparison_table ×6 canonical → client projection.
 *
 * Chain (per row, independent domain):
 *   refineCompare*Pair → dominant_categories.compare_*_{a|b|align|confidence}
 *   → comparisonTableValueFromDominantCategories
 *   → buildRomanticComparisonTableCanonical
 *   → buildRomanticComparisonTableClientProjection
 *   → injectRomanticComparisonTableClientProjection
 *   → UI typed lean chips; LLM cell prose unchanged
 *
 * Does not call refineCompare*Pair / shared cross-row resolvers.
 * Does not parse LLM prose. Does not touch Friend/Work/Marriage/Family.
 */
import type { AffectionBand } from "@/lib/personCore/sajuSignals/types";
import type { CommunicationBand } from "@/lib/personCore/sajuSignals/types";
import type { ConflictBand } from "@/lib/personCore/sajuSignals/types";
import type { DecisionBand } from "@/lib/personCore/sajuSignals/types";
import type { ExpressionBand } from "@/lib/personCore/sajuSignals/types";
import type { StressReactionBand } from "@/lib/personCore/sajuSignals/types";
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { RomanticContextDominantCategory } from "./romanticContextInput";

export const ROMANTIC_COMPARISON_TABLE_CANONICAL_SOURCE =
  "prepareRomanticSajuDeepRun" as const;

export const ROMANTIC_COMPARISON_TABLE_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_COMPARISON_TABLE_CLIENT_PATH =
  "canonical_projections.comparison_table" as const;

export const ROMANTIC_COMPARISON_TABLE_PSYCH_MODE = "primary" as const;

export type RomanticCompareAlign = "confirms" | "caution";
export type RomanticCompareConfidence = "high" | "low";

export type RomanticCompareRowKey =
  | "conflict"
  | "affection"
  | "stress"
  | "expression"
  | "decision"
  | "communication";

/** UI aspect label (ko keys used in report JSON) → row key */
export const ROMANTIC_COMPARISON_ASPECT_TO_ROW = {
  "갈등 반응": "conflict",
  "애정 언어": "affection",
  "스트레스 패턴": "stress",
  "감정 표현": "expression",
  "의사결정": "decision",
  "소통 방식": "communication",
} as const satisfies Record<string, RomanticCompareRowKey>;

export type RomanticCompareConflictRowValue = {
  lean_a: ConflictBand;
  lean_b: ConflictBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticCompareAffectionRowValue = {
  lean_a: AffectionBand;
  lean_b: AffectionBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticCompareStressRowValue = {
  lean_a: StressReactionBand;
  lean_b: StressReactionBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticCompareExpressionRowValue = {
  lean_a: ExpressionBand;
  lean_b: ExpressionBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticCompareDecisionRowValue = {
  lean_a: DecisionBand;
  lean_b: DecisionBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticCompareCommunicationRowValue = {
  lean_a: CommunicationBand;
  lean_b: CommunicationBand;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
};

export type RomanticComparisonTableValue = {
  conflict?: RomanticCompareConflictRowValue;
  affection?: RomanticCompareAffectionRowValue;
  stress?: RomanticCompareStressRowValue;
  expression?: RomanticCompareExpressionRowValue;
  decision?: RomanticCompareDecisionRowValue;
  communication?: RomanticCompareCommunicationRowValue;
};

export type RomanticComparisonTableCanonical =
  CanonicalJudgment<RomanticComparisonTableValue>;

const ALIGN = new Set<RomanticCompareAlign>(["confirms", "caution"]);
const CONFIDENCE = new Set<RomanticCompareConfidence>(["high", "low"]);

const CONFLICT_LEANS = new Set<ConflictBand>([
  "principled",
  "balanced",
  "direct",
]);
const AFFECTION_LEANS = new Set<AffectionBand>([
  "action_gift",
  "balanced",
  "emotional_care",
]);
const STRESS_LEANS = new Set<StressReactionBand>([
  "explosive",
  "steady",
  "withdrawn",
]);
const EXPRESSION_LEANS = new Set<ExpressionBand>([
  "expressive",
  "balanced",
  "reserved",
]);
const DECISION_LEANS = new Set<DecisionBand>([
  "independent",
  "balanced",
  "consultative",
]);
const COMMUNICATION_LEANS = new Set<CommunicationBand>([
  "direct",
  "balanced",
  "considerate",
]);

function asAlign(v: unknown): RomanticCompareAlign | null {
  return typeof v === "string" && ALIGN.has(v as RomanticCompareAlign)
    ? (v as RomanticCompareAlign)
    : null;
}

function asConfidence(v: unknown): RomanticCompareConfidence | null {
  return typeof v === "string" &&
    CONFIDENCE.has(v as RomanticCompareConfidence)
    ? (v as RomanticCompareConfidence)
    : null;
}

function asInSet<T extends string>(v: unknown, set: Set<T>): T | null {
  return typeof v === "string" && set.has(v as T) ? (v as T) : null;
}

function cloneConflictRow(
  row: RomanticCompareConflictRowValue,
): RomanticCompareConflictRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneAffectionRow(
  row: RomanticCompareAffectionRowValue,
): RomanticCompareAffectionRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneStressRow(
  row: RomanticCompareStressRowValue,
): RomanticCompareStressRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneExpressionRow(
  row: RomanticCompareExpressionRowValue,
): RomanticCompareExpressionRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneDecisionRow(
  row: RomanticCompareDecisionRowValue,
): RomanticCompareDecisionRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneCommunicationRow(
  row: RomanticCompareCommunicationRowValue,
): RomanticCompareCommunicationRowValue {
  return {
    lean_a: row.lean_a,
    lean_b: row.lean_b,
    align: row.align,
    confidence: row.confidence,
  };
}

function cloneComparisonTableValue(
  v: RomanticComparisonTableValue,
): RomanticComparisonTableValue {
  const out: RomanticComparisonTableValue = {};
  if (v.conflict) out.conflict = cloneConflictRow(v.conflict);
  if (v.affection) out.affection = cloneAffectionRow(v.affection);
  if (v.stress) out.stress = cloneStressRow(v.stress);
  if (v.expression) out.expression = cloneExpressionRow(v.expression);
  if (v.decision) out.decision = cloneDecisionRow(v.decision);
  if (v.communication) out.communication = cloneCommunicationRow(v.communication);
  return out;
}

function readTypedRow<TLean extends string>(
  cats: Record<string, RomanticContextDominantCategory>,
  key: RomanticCompareRowKey,
  leanSet: Set<TLean>,
): {
  lean_a: TLean;
  lean_b: TLean;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
} | null {
  const lean_a = asInSet(cats[`compare_${key}_a`]?.category, leanSet);
  const lean_b = asInSet(cats[`compare_${key}_b`]?.category, leanSet);
  const align = asAlign(cats[`compare_${key}_align`]?.category);
  const confidence = asConfidence(
    cats[`compare_${key}_confidence`]?.category,
  );
  if (!lean_a || !lean_b || !align || !confidence) return null;
  return { lean_a, lean_b, align, confidence };
}

/**
 * Map context dominant_categories → finalized comparison_table value.
 * Each row is independent; incomplete rows are omitted (not invented).
 * Empty envelope → null.
 */
export function comparisonTableValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticComparisonTableValue | null {
  if (!cats) return null;
  const out: RomanticComparisonTableValue = {};
  const conflict = readTypedRow(cats, "conflict", CONFLICT_LEANS);
  if (conflict) out.conflict = conflict;
  const affection = readTypedRow(cats, "affection", AFFECTION_LEANS);
  if (affection) out.affection = affection;
  const stress = readTypedRow(cats, "stress", STRESS_LEANS);
  if (stress) out.stress = stress;
  const expression = readTypedRow(cats, "expression", EXPRESSION_LEANS);
  if (expression) out.expression = expression;
  const decision = readTypedRow(cats, "decision", DECISION_LEANS);
  if (decision) out.decision = decision;
  const communication = readTypedRow(cats, "communication", COMMUNICATION_LEANS);
  if (communication) out.communication = communication;
  return Object.keys(out).length > 0 ? out : null;
}

/** Wrap an already-finalized comparison_table judgment. */
export function buildRomanticComparisonTableCanonical(
  finalized: RomanticComparisonTableValue | null | undefined,
): RomanticComparisonTableCanonical | null {
  if (!finalized || Object.keys(finalized).length === 0) return null;
  return {
    value: cloneComparisonTableValue(finalized),
    source: ROMANTIC_COMPARISON_TABLE_CANONICAL_SOURCE,
    psychMode: ROMANTIC_COMPARISON_TABLE_PSYCH_MODE,
    persistencePath: ROMANTIC_COMPARISON_TABLE_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no scores, flipped flags, or prose. */
export function buildRomanticComparisonTableClientProjection(
  value: RomanticComparisonTableValue | null | undefined,
): RomanticComparisonTableValue | null {
  if (!value || Object.keys(value).length === 0) return null;
  return cloneComparisonTableValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    comparison_table?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server comparison_table projection.
 * Preserves all other canonical keys. Server wins over LLM fake projections.
 */
export function injectRomanticComparisonTableClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticComparisonTableValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "comparison_table",
          ),
        )
      : {};

  if (!projection || Object.keys(projection).length === 0) {
    if (Object.keys(priorRest).length === 0) {
      return rest as T;
    }
    return {
      ...(rest as T),
      canonical_projections: priorRest,
    };
  }

  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      comparison_table: cloneComparisonTableValue(projection),
    },
  };
}

export function comparisonTableJudgmentFields(
  v: RomanticComparisonTableValue | null | undefined,
): RomanticComparisonTableValue | null {
  if (!v || Object.keys(v).length === 0) return null;
  return cloneComparisonTableValue(v);
}

function parseRowUnknown<TLean extends string>(
  raw: unknown,
  leanSet: Set<TLean>,
): {
  lean_a: TLean;
  lean_b: TLean;
  align: RomanticCompareAlign;
  confidence: RomanticCompareConfidence;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const lean_a = asInSet(o.lean_a, leanSet);
  const lean_b = asInSet(o.lean_b, leanSet);
  const align = asAlign(o.align);
  const confidence = asConfidence(o.confidence);
  if (!lean_a || !lean_b || !align || !confidence) return null;
  return { lean_a, lean_b, align, confidence };
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticComparisonTableCanonicalProjection(
  report:
    | { canonical_projections?: { comparison_table?: unknown } }
    | null
    | undefined,
): RomanticComparisonTableValue | null {
  const raw = report?.canonical_projections?.comparison_table;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: RomanticComparisonTableValue = {};
  const conflict = parseRowUnknown(o.conflict, CONFLICT_LEANS);
  if (conflict) out.conflict = conflict;
  const affection = parseRowUnknown(o.affection, AFFECTION_LEANS);
  if (affection) out.affection = affection;
  const stress = parseRowUnknown(o.stress, STRESS_LEANS);
  if (stress) out.stress = stress;
  const expression = parseRowUnknown(o.expression, EXPRESSION_LEANS);
  if (expression) out.expression = expression;
  const decision = parseRowUnknown(o.decision, DECISION_LEANS);
  if (decision) out.decision = decision;
  const communication = parseRowUnknown(o.communication, COMMUNICATION_LEANS);
  if (communication) out.communication = communication;
  return Object.keys(out).length > 0 ? out : null;
}

function localeIsEn(locale?: string | null): boolean {
  return (
    locale === "en" ||
    locale === "en-US" ||
    Boolean(locale?.startsWith("en"))
  );
}

const CONFLICT_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  principled: { ko: "원칙형", en: "Principled" },
  balanced: { ko: "균형", en: "Balanced" },
  direct: { ko: "직면형", en: "Direct" },
};

const AFFECTION_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  action_gift: { ko: "행동·선물형", en: "Action & gifts" },
  balanced: { ko: "균형", en: "Balanced" },
  emotional_care: { ko: "정서 돌봄형", en: "Emotional care" },
};

const STRESS_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  explosive: { ko: "폭발형", en: "Explosive" },
  steady: { ko: "안정형", en: "Steady" },
  withdrawn: { ko: "철수형", en: "Withdrawn" },
};

const EXPRESSION_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  expressive: { ko: "표현형", en: "Expressive" },
  balanced: { ko: "균형", en: "Balanced" },
  reserved: { ko: "절제형", en: "Reserved" },
};

const DECISION_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  independent: { ko: "독립형", en: "Independent" },
  balanced: { ko: "균형", en: "Balanced" },
  consultative: { ko: "상의형", en: "Consultative" },
};

const COMMUNICATION_LEAN_LABELS: Record<string, { ko: string; en: string }> = {
  direct: { ko: "직접형", en: "Direct" },
  balanced: { ko: "균형", en: "Balanced" },
  considerate: { ko: "배려형", en: "Considerate" },
};

const ROW_LEAN_LABELS: Record<
  RomanticCompareRowKey,
  Record<string, { ko: string; en: string }>
> = {
  conflict: CONFLICT_LEAN_LABELS,
  affection: AFFECTION_LEAN_LABELS,
  stress: STRESS_LEAN_LABELS,
  expression: EXPRESSION_LEAN_LABELS,
  decision: DECISION_LEAN_LABELS,
  communication: COMMUNICATION_LEAN_LABELS,
};

/** Typed lean label — never from LLM cell prose. Row key disambiguates shared tokens. */
export function formatRomanticCompareLeanLabel(
  lean: string,
  locale?: string | null,
  rowKey?: RomanticCompareRowKey | null,
): string {
  const en = localeIsEn(locale);
  if (rowKey) {
    const hit = ROW_LEAN_LABELS[rowKey]?.[lean];
    if (hit) return en ? hit.en : hit.ko;
  }
  for (const table of Object.values(ROW_LEAN_LABELS)) {
    const hit = table[lean];
    if (hit) return en ? hit.en : hit.ko;
  }
  return lean;
}

/**
 * Resolve row key from comparison aspect string (ko aspect keys).
 * Unknown aspect → null (do not invent).
 */
export function romanticComparisonRowKeyForAspect(
  aspect: string,
): RomanticCompareRowKey | null {
  const key =
    ROMANTIC_COMPARISON_ASPECT_TO_ROW[
      aspect as keyof typeof ROMANTIC_COMPARISON_ASPECT_TO_ROW
    ];
  return key ?? null;
}

/** Viewer-oriented lean for one person column (typed only). */
export function romanticCompareLeanForViewerColumn(
  row:
    | { lean_a: string; lean_b: string }
    | null
    | undefined,
  viewerIsReportA: boolean,
  column: "me" | "partner",
): string | null {
  if (!row) return null;
  if (column === "me") {
    return viewerIsReportA ? row.lean_a : row.lean_b;
  }
  return viewerIsReportA ? row.lean_b : row.lean_a;
}
