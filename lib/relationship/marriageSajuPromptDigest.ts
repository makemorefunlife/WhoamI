/**
 * Marriage / Cohabitation CE → LLM prompt digest (explain-only).
 * Reads canonical_projections (+ optional context_output). Does not re-resolve judgments.
 * Independent of romanticSajuPromptDigest.
 */

import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { MarriageComparisonTableValue } from "@/lib/relationship/marriage/marriageComparisonTableCanonical";
import type { MarriageOperatingCfoClientValue } from "@/lib/relationship/marriage/marriageOperatingCfoCanonical";
import type { MarriageContextOutput } from "@/lib/relationship/marriage/marriageContextOutput";
import type { MarriageCompareRowId } from "@/lib/relationship/marriage/marriageSajuCompareTable";

const ROW_LABEL_KO: Record<MarriageCompareRowId, string> = {
  household_stress: "가사·루틴 스트레스",
  marital_conflict: "부부 갈등 반응",
  bedroom_lead: "침실 리드 성향",
  family_boundary: "원가족 경계",
  asset_management: "자산관리 기질",
  parenting_style: "육아·교육 가치",
};

const BAND_LABEL_KO: Record<string, string> = {
  wealth: "재성 쪽 스트레스 표출",
  officer: "관성 쪽 스트레스 표출",
  food: "식상 쪽 스트레스 표출",
  seal: "인성 쪽 스트레스 표출",
  self: "비겁 쪽 스트레스 표출",
  explosive: "폭발형",
  stonewall: "침묵형",
  balanced: "균형형",
  sweet_guide: "다정 가이드",
  power_leader: "주도 리드",
  true: "거리 필요",
  false: "편안",
  high: "높음",
  medium: "중간",
  low: "낮음",
  empathy: "공감형",
  structure: "원칙형",
};

export type MarriedDigestLeanRow = {
  band_a: string;
  band_b: string;
  confidence?: string | null;
  align?: string | null;
};

export type MarriedDigestLeans = Partial<
  Record<MarriageCompareRowId | "operating_cfo", MarriedDigestLeanRow>
>;

function bandKo(band: string): string {
  return BAND_LABEL_KO[band] ?? band;
}

function rowMismatch(a: string, b: string): boolean {
  return Boolean(a && b && a !== b);
}

/** True when household ops / conflict / money / boundary rows disagree (or dual CFO). */
export function inferMarriageMismatchRoles(params: {
  comparison?: MarriageComparisonTableValue | null;
  operatingCfo?: MarriageOperatingCfoClientValue | null;
}): boolean {
  const t = params.comparison;
  if (params.operatingCfo?.dual) return true;
  if (!t) return false;
  return (
    rowMismatch(t.household_stress.band_a, t.household_stress.band_b) ||
    rowMismatch(t.marital_conflict.band_a, t.marital_conflict.band_b) ||
    rowMismatch(t.asset_management.band_a, t.asset_management.band_b) ||
    rowMismatch(t.family_boundary.band_a, t.family_boundary.band_b) ||
    rowMismatch(t.parenting_style.band_a, t.parenting_style.band_b) ||
    rowMismatch(t.bedroom_lead.band_a, t.bedroom_lead.band_b)
  );
}

export function comparisonLeansFromMarriageProjections(
  comparison?: MarriageComparisonTableValue | null,
  context?: MarriageContextOutput | null,
): MarriedDigestLeans {
  if (!comparison) return {};
  const dc = context?.dominant_categories;
  const parentingConf =
    (dc?.parenting_a_confidence?.category as string | undefined) ??
    (dc?.parenting_b_confidence?.category as string | undefined);
  const parentingAlign =
    (dc?.parenting_a_align?.category as string | undefined) ??
    (dc?.parenting_b_align?.category as string | undefined);

  const out: MarriedDigestLeans = {};
  const ids: MarriageCompareRowId[] = [
    "household_stress",
    "marital_conflict",
    "bedroom_lead",
    "family_boundary",
    "asset_management",
    "parenting_style",
  ];
  for (const id of ids) {
    const row = comparison[id];
    out[id] = {
      band_a: row.band_a,
      band_b: row.band_b,
      confidence:
        id === "parenting_style" ? parentingConf ?? null : null,
      align: id === "parenting_style" ? parentingAlign ?? null : null,
    };
  }
  return out;
}

/**
 * Build user-facing digest block for marriedSajuDeep prompts.
 * Canonical only — never invent bands.
 */
export function buildMarriedHouseholdDigest(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<
    MarriageReportBody,
    "canonical_projections" | "context_output" | "meta"
  >;
}): string {
  const { nicknameA, nicknameB, report } = params;
  const table = report.canonical_projections?.comparison_table ?? null;
  const cfo = report.canonical_projections?.operating_cfo ?? null;
  const ctx = report.context_output ?? null;
  const mismatch = inferMarriageMismatchRoles({
    comparison: table,
    operatingCfo: cfo,
  });

  const lines: string[] = [
    `# household_digest (canonical — explain only)`,
    `pair: ${nicknameA} × ${nicknameB}`,
    `domain: cohabitation / married`,
    `mismatch_roles: ${mismatch}`,
    `grade: ${report.meta?.grade ?? "(n/a)"}`,
  ];

  if (cfo) {
    const sideName = cfo.side === "a" ? nicknameA : nicknameB;
    lines.push(
      `operating_cfo: side=${cfo.side} (${sideName})` +
        (cfo.dual ? `, dual=true` : "") +
        (cfo.confidence ? `, confidence=${cfo.confidence}` : "") +
        (cfo.align ? `, align=${cfo.align}` : ""),
    );
    lines.push(
      `  → 일상 재정 운영(예산·계좌·큰 지출) 담당이 ${sideName} 쪽으로 잡힘. asset_management 행과 혼동 금지.`,
    );
  } else {
    lines.push(`operating_cfo: (없음)`);
  }

  lines.push(`comparison_table:`);
  if (!table) {
    lines.push(`  (canonical comparison_table 없음 — 추측 금지)`);
  } else {
    const ids: MarriageCompareRowId[] = [
      "household_stress",
      "marital_conflict",
      "bedroom_lead",
      "family_boundary",
      "asset_management",
      "parenting_style",
    ];
    for (const id of ids) {
      const row = table[id];
      const same = row.band_a === row.band_b;
      lines.push(
        `- ${id} (${ROW_LABEL_KO[id]}): ` +
          `${nicknameA}=${row.band_a}(${bandKo(row.band_a)}), ` +
          `${nicknameB}=${row.band_b}(${bandKo(row.band_b)})` +
          ` | ${same ? "same_lean" : "different"}`,
      );
    }
  }

  const dc = ctx?.dominant_categories;
  if (dc?.cfo_confidence?.category || dc?.parenting_a_confidence?.category) {
    lines.push(`context_hints (optional corroboration — not re-classification):`);
    if (dc.cfo_confidence?.category) {
      lines.push(
        `- cfo_confidence=${dc.cfo_confidence.category}` +
          (dc.cfo_align?.category ? `, cfo_align=${dc.cfo_align.category}` : ""),
      );
    }
    if (dc.parenting_a_confidence?.category) {
      lines.push(
        `- parenting confidence A=${dc.parenting_a_confidence.category}` +
          (dc.parenting_a_align?.category
            ? `, alignA=${dc.parenting_a_align.category}`
            : ""),
      );
    }
    if (dc.parenting_b_confidence?.category) {
      lines.push(
        `- parenting confidence B=${dc.parenting_b_confidence.category}` +
          (dc.parenting_b_align?.category
            ? `, alignB=${dc.parenting_b_align.category}`
            : ""),
      );
    }
  }

  if (report.meta?.uncertain_items?.length) {
    lines.push(
      `uncertain_items: ${report.meta.uncertain_items.slice(0, 6).join(" | ")}`,
    );
  }

  lines.push(
    `RULES: Never print internal keys (household_stress, operating_cfo, …) in user-facing prose.`,
    `Translate to natural Korean evidence bridges. Do not invent Romantic axes (affection, dating recovery).`,
    `Do not contradict bands / CFO side / mismatch_roles.`,
  );

  return lines.join("\n");
}

/** Params for postValidate from the same CE snapshot. */
export function marriedPostValidateParamsFromReport(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<MarriageReportBody, "canonical_projections" | "context_output">;
}): {
  nicknameA: string;
  nicknameB: string;
  mismatchRoles: boolean;
  operatingCfoSide: string | null;
  comparisonLeans: MarriedDigestLeans;
} {
  const comparison = params.report.canonical_projections?.comparison_table ?? null;
  const cfo = params.report.canonical_projections?.operating_cfo ?? null;
  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    mismatchRoles: inferMarriageMismatchRoles({
      comparison,
      operatingCfo: cfo,
    }),
    operatingCfoSide: cfo?.side ?? null,
    comparisonLeans: comparisonLeansFromMarriageProjections(
      comparison,
      params.report.context_output ?? null,
    ),
  };
}
