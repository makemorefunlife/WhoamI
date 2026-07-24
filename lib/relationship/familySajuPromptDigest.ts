/**
 * Family Parent–Child CE → LLM prompt digest (explain-only).
 * Reads canonical_projections (+ optional context_output). Does not re-resolve.
 * Independent of romantic / marriage digests.
 */

import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FamilyComparisonTableValue } from "@/lib/relationship/familyParent/familyComparisonTableCanonical";
import type { FamilyCompareRowId } from "@/lib/relationship/familyParent/familySajuCompareTable";
import type { FamilyContextOutput } from "@/lib/relationship/familyParent/familyContextOutput";

const ROW_LABEL_KO: Record<FamilyCompareRowId, string> = {
  correction_style: "잔소리·지적 반응",
  bond_distance: "정서적 거리",
  affection_expression: "마음 표현 채널",
  guidance_balance: "돌봄·지도 균형",
  gathering_recovery: "가족행사 후 회복",
  home_climate: "가정 분위기",
};

const BAND_LABEL_KO: Record<string, string> = {
  wealth: "재성 쪽",
  officer: "관성 쪽",
  food: "식상 쪽",
  seal: "인성 쪽",
  self: "비겁 쪽",
  distant: "거리 두는 편",
  balanced: "균형",
  smothering: "밀착 쪽",
  wood: "목 채널",
  fire: "화 채널",
  earth: "토 채널",
  metal: "금 채널",
  water: "수 채널",
  receptive: "수용형",
  explanatory: "설명형",
  standards: "기준형",
  mixed: "혼합형",
  weak: "약함",
  strong: "강함",
  low: "낮음",
  medium: "중간",
  high: "높음",
};

export type FamilyDigestLeanRow = {
  band_parent: string;
  band_child: string;
  confidence?: string | null;
  align?: string | null;
};

export type FamilyDigestLeans = Partial<
  Record<FamilyCompareRowId, FamilyDigestLeanRow>
>;

function bandKo(band: string): string {
  return BAND_LABEL_KO[band] ?? band;
}

function rowMismatch(a: string, b: string): boolean {
  return Boolean(a && b && a !== b);
}

/** True when parent/child bands disagree on key family axes. */
export function inferFamilyMismatchGenerations(params: {
  comparison?: FamilyComparisonTableValue | null;
}): boolean {
  const t = params.comparison;
  if (!t) return false;
  return (
    rowMismatch(t.correction_style.band_parent, t.correction_style.band_child) ||
    rowMismatch(t.bond_distance.band_parent, t.bond_distance.band_child) ||
    rowMismatch(
      t.guidance_balance.band_parent,
      t.guidance_balance.band_child,
    ) ||
    rowMismatch(
      t.affection_expression.band_parent,
      t.affection_expression.band_child,
    ) ||
    rowMismatch(t.home_climate.band_parent, t.home_climate.band_child) ||
    rowMismatch(
      t.gathering_recovery.band_parent,
      t.gathering_recovery.band_child,
    )
  );
}

export function comparisonLeansFromFamilyProjections(
  comparison?: FamilyComparisonTableValue | null,
  _context?: FamilyContextOutput | null,
): FamilyDigestLeans {
  if (!comparison) return {};
  const out: FamilyDigestLeans = {};
  const ids: FamilyCompareRowId[] = [
    "correction_style",
    "bond_distance",
    "affection_expression",
    "guidance_balance",
    "gathering_recovery",
    "home_climate",
  ];
  for (const id of ids) {
    const row = comparison[id];
    out[id] = {
      band_parent: row.band_parent,
      band_child: row.band_child,
      confidence: null,
      align: null,
    };
  }
  return out;
}

export function buildFamilyHouseholdDigest(params: {
  nicknameParent: string;
  nicknameChild: string;
  report: Pick<
    FamilyParentReportBody,
    "canonical_projections" | "context_output" | "meta"
  >;
}): string {
  const { nicknameParent, nicknameChild, report } = params;
  const table = report.canonical_projections?.comparison_table ?? null;
  const mismatch = inferFamilyMismatchGenerations({ comparison: table });

  const lines: string[] = [
    `# family_digest (canonical — explain only)`,
    `pair: parent=${nicknameParent} × child=${nicknameChild}`,
    `domain: family / parent-child`,
    `parent_role: ${report.meta?.parent_role ?? report.meta?.parent_type ?? "(n/a)"}`,
    `mismatch_generations: ${mismatch}`,
    `grade: ${report.meta?.grade ?? "(n/a)"}`,
  ];

  lines.push(`comparison_table (band_parent / band_child):`);
  if (!table) {
    lines.push(`  (canonical comparison_table 없음 — 추측 금지)`);
  } else {
    const ids: FamilyCompareRowId[] = [
      "correction_style",
      "bond_distance",
      "affection_expression",
      "guidance_balance",
      "gathering_recovery",
      "home_climate",
    ];
    for (const id of ids) {
      const row = table[id];
      const same = row.band_parent === row.band_child;
      lines.push(
        `- ${id} (${ROW_LABEL_KO[id]}): ` +
          `parent=${row.band_parent}(${bandKo(row.band_parent)}), ` +
          `child=${row.band_child}(${bandKo(row.band_child)})` +
          ` | ${same ? "same_lean" : "different"}`,
      );
    }
  }

  if (report.meta?.uncertain_items?.length) {
    lines.push(
      `uncertain_items: ${report.meta.uncertain_items.slice(0, 6).join(" | ")}`,
    );
  }

  lines.push(
    `RULES: Never print internal keys (bond_distance, guidance_balance, …) in user-facing prose.`,
    `Translate to natural Korean evidence bridges.`,
    `Do not invent Romantic dating axes or Marriage CFO/chore axes.`,
    `Do not contradict bands / mismatch_generations.`,
    `Never shame either generation.`,
  );

  return lines.join("\n");
}

export function familyPostValidateParamsFromReport(params: {
  nicknameParent: string;
  nicknameChild: string;
  report: Pick<
    FamilyParentReportBody,
    "canonical_projections" | "context_output"
  >;
}): {
  nicknameParent: string;
  nicknameChild: string;
  mismatchGenerations: boolean;
  comparisonLeans: FamilyDigestLeans;
} {
  const comparison =
    params.report.canonical_projections?.comparison_table ?? null;
  return {
    nicknameParent: params.nicknameParent,
    nicknameChild: params.nicknameChild,
    mismatchGenerations: inferFamilyMismatchGenerations({ comparison }),
    comparisonLeans: comparisonLeansFromFamilyProjections(
      comparison,
      params.report.context_output ?? null,
    ),
  };
}
