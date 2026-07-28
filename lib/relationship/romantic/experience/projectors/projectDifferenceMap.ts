/**
 * M3 Difference Map projector.
 * Canonical comparison_table leans only — no grade, scores, or why_special copy.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  formatRomanticCompareLeanLabel,
  readRomanticComparisonTableCanonicalProjection,
  romanticCompareLeanForViewerColumn,
  romanticComparisonRowKeyForAspect,
  type RomanticCompareAlign,
  type RomanticCompareConfidence,
  type RomanticCompareRowKey,
  type RomanticComparisonTableValue,
  ROMANTIC_COMPARISON_ASPECT_TO_ROW,
} from "@/lib/relationship/romantic/romanticComparisonTableCanonical";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import type {
  ConfidenceLevel,
  DifferenceBucketKind,
  DifferenceBucketVM,
  DifferenceDynamicsNarrativeVM,
  DifferenceItemVM,
  DifferenceMapVM,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyDifferenceMap } from "./_empty";

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? polishRomanticDisplayText(value).trim() : "";
  return t ? t : null;
}

/** Sprint 2 — legacy section_1_relationship_dynamics narrative (additive). */
function readDynamicsNarrative(
  report: RomanticSajuDeepReport["report"],
): { narrative: DifferenceDynamicsNarrativeVM | null; hasContent: boolean } {
  const dynamics = report.section_1_relationship_dynamics;
  const balance = trimOrNull(dynamics?.balance_of_power?.body);
  const recovery = trimOrNull(dynamics?.recovery_speed?.body);
  if (!balance && !recovery) return { narrative: null, hasContent: false };
  return { narrative: { balance, recovery }, hasContent: true };
}

export type ProjectDifferenceMapInput = {
  report: RomanticSajuDeepReport["report"];
  viewerIsReportA: boolean;
  locale?: string;
};

const ROW_ASPECT_LABEL: Record<RomanticCompareRowKey, string> = {
  conflict: "갈등 반응",
  affection: "애정 언어",
  stress: "스트레스 패턴",
  expression: "감정 표현",
  decision: "의사결정",
  communication: "소통 방식",
};

const BUCKET_LABEL: Record<DifferenceBucketKind, string> = {
  shared: "비슷한 지점",
  complementary: "보완되는 차이",
  translation_required: "번역이 필요한 마찰",
};

function mapConfidence(
  c: RomanticCompareConfidence | null | undefined,
): ConfidenceLevel | null {
  if (c === "high") return "high";
  if (c === "low") return "low";
  return null;
}

function classifyBucket(
  leanA: string,
  leanB: string,
  align: RomanticCompareAlign,
): DifferenceBucketKind | null {
  if (leanA === leanB) {
    // Same lean is only "shared" when both are non-balanced (meaningful sameness).
    if (leanA === "balanced") return null;
    return "shared";
  }
  if (align === "caution") return "translation_required";
  return "complementary";
}

function rowFromTable(
  table: RomanticComparisonTableValue,
  key: RomanticCompareRowKey,
):
  | {
      lean_a: string;
      lean_b: string;
      align: RomanticCompareAlign;
      confidence: RomanticCompareConfidence;
    }
  | undefined {
  return table[key];
}

/**
 * Availability: ≥1 meaningful bucket item from canonical comparison rows.
 */
export function projectDifferenceMap(
  input: ProjectDifferenceMapInput,
): DifferenceMapVM {
  const base = emptyDifferenceMap();
  const table = readRomanticComparisonTableCanonicalProjection(input.report);
  if (!table) return base;

  const byKind: Record<DifferenceBucketKind, DifferenceItemVM[]> = {
    shared: [],
    complementary: [],
    translation_required: [],
  };

  const evidence: EvidenceRef[] = [
    {
      path: "canonical_projections.comparison_table",
      summary: "typed comparison leans",
    },
  ];

  const keys = Object.keys(
    ROMANTIC_COMPARISON_ASPECT_TO_ROW,
  ) as Array<keyof typeof ROMANTIC_COMPARISON_ASPECT_TO_ROW>;
  const seen = new Set<RomanticCompareRowKey>();

  for (const aspect of keys) {
    const rowKey = romanticComparisonRowKeyForAspect(aspect);
    if (!rowKey || seen.has(rowKey)) continue;
    seen.add(rowKey);
    const row = rowFromTable(table, rowKey);
    if (!row) continue;

    const leanMe = romanticCompareLeanForViewerColumn(
      row,
      input.viewerIsReportA,
      "me",
    );
    const leanPartner = romanticCompareLeanForViewerColumn(
      row,
      input.viewerIsReportA,
      "partner",
    );
    if (!leanMe || !leanPartner) continue;

    const bucket = classifyBucket(row.lean_a, row.lean_b, row.align);
    if (!bucket) continue;

    const meLabel = formatRomanticCompareLeanLabel(
      leanMe,
      input.locale,
      rowKey,
    );
    const partnerLabel = formatRomanticCompareLeanLabel(
      leanPartner,
      input.locale,
      rowKey,
    );

    byKind[bucket].push({
      aspect: ROW_ASPECT_LABEL[rowKey],
      me: meLabel,
      partner: partnerLabel,
      rowKey,
      align: row.align,
      confidence: mapConfidence(row.confidence),
      sourceKeys: [`canonical_projections.comparison_table.${rowKey}`],
    });
  }

  const buckets: DifferenceBucketVM[] = (
    ["translation_required", "complementary", "shared"] as DifferenceBucketKind[]
  )
    .filter((kind) => byKind[kind].length > 0)
    .map((kind) => ({
      kind,
      label: BUCKET_LABEL[kind],
      items: byKind[kind],
    }));

  if (buckets.length === 0) return base;

  const friction = byKind.translation_required[0];
  const complement = byKind.complementary[0];
  const openingContrast = friction
    ? `${friction.aspect}: ${friction.me} ↔ ${friction.partner}`
    : complement
      ? `${complement.aspect}: ${complement.me} ↔ ${complement.partner}`
      : null;

  let confidence: ConfidenceLevel = "medium";
  const anyHigh = buckets.some((b) =>
    b.items.some((i) => i.confidence === "high"),
  );
  const anyCaution = byKind.translation_required.length > 0;
  if (anyHigh && anyCaution) confidence = "high";
  else if (anyHigh) confidence = "high";
  else if (buckets.length === 1 && byKind.shared.length) confidence = "low";

  const dynamics = readDynamicsNarrative(input.report);
  if (dynamics.hasContent) {
    evidence.push({
      path: "section_1_relationship_dynamics",
      summary: "balance/recovery narrative",
    });
  }

  return {
    ...base,
    title: "Difference Map",
    available: true,
    confidence,
    evidence,
    dynamicsNarrative: dynamics.narrative,
    buckets,
    hasRadar: false,
    openingContrast,
  };
}
