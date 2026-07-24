/**
 * Work / Business CE → LLM prompt digest (explain-only).
 * Reads canonical_projections (+ optional context_output). Does not re-resolve.
 * Independent of romantic / marriage / family digests.
 */

import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { WorkComparisonTableValue } from "@/lib/relationship/workColleague/workComparisonTableCanonical";
import type { WorkLeadershipClientValue } from "@/lib/relationship/workColleague/workLeadershipCanonical";
import type { WorkCompareRowId } from "@/lib/relationship/workColleague/sajuCompareTable";
import type { WorkContextOutput } from "@/lib/relationship/workColleague/workContextOutput";

const ROW_LABEL_KO: Record<WorkCompareRowId, string> = {
  boundary: "업무 경계·역할 소유",
  feedback: "피드백 전달·수용",
  synergy_position: "시너지·역할 자리",
  burnout: "번아웃·회복 리듬",
  risk_taking: "리스크 감수",
  reporting_rhythm: "보고·공유 리듬",
};

const BAND_LABEL_KO: Record<string, string> = {
  재성: "재성 쪽",
  관성: "관성 쪽",
  식상: "식상 쪽",
  인성: "인성 쪽",
  비겁: "비겁 쪽",
  wealth: "재성 쪽",
  officer: "관성 쪽",
  food: "식상 쪽",
  seal: "인성 쪽",
  self: "비겁 쪽",
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
  high: "높음",
  medium: "중간",
  low: "낮음",
  bold: "공격형",
  cautious: "신중형",
  balanced: "균형",
  fast: "빠른 편",
  slow: "느린 편",
  a: "A 쪽",
  b: "B 쪽",
};

export type BusinessDigestLeanRow = {
  band_a: string;
  band_b: string;
  confidence?: string | null;
  align?: string | null;
};

export type BusinessDigestLeans = Partial<
  Record<WorkCompareRowId | "leadership", BusinessDigestLeanRow>
>;

function bandKo(band: string): string {
  return BAND_LABEL_KO[band] ?? band;
}

function rowMismatch(a: string, b: string): boolean {
  return Boolean(a && b && a !== b);
}

/** True when key work compare bands disagree across partners. */
export function inferBusinessMismatchRoles(params: {
  comparison?: WorkComparisonTableValue | null;
  leadership?: WorkLeadershipClientValue | null;
}): boolean {
  const t = params.comparison;
  if (params.leadership?.align === "caution") return true;
  if (!t) return false;
  return (
    rowMismatch(t.boundary.band_a, t.boundary.band_b) ||
    rowMismatch(t.feedback.band_a, t.feedback.band_b) ||
    rowMismatch(t.synergy_position.band_a, t.synergy_position.band_b) ||
    rowMismatch(t.burnout.band_a, t.burnout.band_b) ||
    rowMismatch(t.risk_taking.band_a, t.risk_taking.band_b) ||
    rowMismatch(t.reporting_rhythm.band_a, t.reporting_rhythm.band_b)
  );
}

export function comparisonLeansFromBusinessProjections(
  comparison?: WorkComparisonTableValue | null,
  leadership?: WorkLeadershipClientValue | null,
  _context?: WorkContextOutput | null,
): BusinessDigestLeans {
  const out: BusinessDigestLeans = {};
  if (comparison) {
    const ids: WorkCompareRowId[] = [
      "boundary",
      "feedback",
      "synergy_position",
      "burnout",
      "risk_taking",
      "reporting_rhythm",
    ];
    for (const id of ids) {
      const row = comparison[id];
      out[id] = {
        band_a: row.band_a,
        band_b: row.band_b,
        confidence: null,
        align: null,
      };
    }
  }
  if (leadership?.external_lead && leadership?.internal_qa_lead) {
    out.leadership = {
      band_a: String(leadership.external_lead),
      band_b: String(leadership.internal_qa_lead),
      confidence: leadership.confidence ?? null,
      align: leadership.align ?? null,
    };
  }
  return out;
}

export function buildBusinessHouseholdDigest(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<
    WorkColleagueReportBody,
    "canonical_projections" | "context_output" | "meta"
  >;
}): string {
  const { nicknameA, nicknameB, report } = params;
  const table = report.canonical_projections?.comparison_table ?? null;
  const leadership = report.canonical_projections?.leadership_split ?? null;
  const mismatch = inferBusinessMismatchRoles({
    comparison: table,
    leadership,
  });

  const lines: string[] = [
    `# business_digest (canonical — explain only)`,
    `pair: A=${nicknameA} × B=${nicknameB}`,
    `domain: business / partnership`,
    `mismatch_roles: ${mismatch}`,
    `grade: ${report.meta?.grade ?? "(n/a)"}`,
  ];

  lines.push(`comparison_table (band_a / band_b):`);
  if (!table) {
    lines.push(`  (canonical comparison_table 없음 — 추측 금지)`);
  } else {
    const ids: WorkCompareRowId[] = [
      "boundary",
      "feedback",
      "synergy_position",
      "burnout",
      "risk_taking",
      "reporting_rhythm",
    ];
    for (const id of ids) {
      const row = table[id];
      const same = row.band_a === row.band_b;
      lines.push(
        `- ${id} (${ROW_LABEL_KO[id]}): ` +
          `a=${row.band_a}(${bandKo(row.band_a)}), ` +
          `b=${row.band_b}(${bandKo(row.band_b)})` +
          ` | ${same ? "same_lean" : "different"}`,
      );
    }
  }

  if (leadership) {
    lines.push(
      `leadership_split: external_lead=${leadership.external_lead}, ` +
        `internal_qa_lead=${leadership.internal_qa_lead}` +
        (leadership.confidence
          ? `, confidence=${leadership.confidence}`
          : "") +
        (leadership.align ? `, align=${leadership.align}` : ""),
    );
  } else {
    lines.push(`leadership_split: (없음 — 추측 금지)`);
  }

  if (report.meta?.uncertain_items?.length) {
    lines.push(
      `uncertain_items: ${report.meta.uncertain_items.slice(0, 6).join(" | ")}`,
    );
  }

  lines.push(
    `RULES: Never print internal keys (boundary, risk_taking, …) in user-facing prose.`,
    `Translate to natural Korean evidence bridges.`,
    `Do not invent Romantic dating, Marriage CFO/chore, or Family parenting axes.`,
    `Do not contradict bands / mismatch_roles / leadership_split.`,
    `Never shame either partner.`,
  );

  return lines.join("\n");
}

export function businessPostValidateParamsFromReport(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<
    WorkColleagueReportBody,
    "canonical_projections" | "context_output"
  >;
}): {
  nicknameA: string;
  nicknameB: string;
  mismatchRoles: boolean;
  comparisonLeans: BusinessDigestLeans;
} {
  const comparison =
    params.report.canonical_projections?.comparison_table ?? null;
  const leadership =
    params.report.canonical_projections?.leadership_split ?? null;
  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    mismatchRoles: inferBusinessMismatchRoles({ comparison, leadership }),
    comparisonLeans: comparisonLeansFromBusinessProjections(
      comparison,
      leadership,
      params.report.context_output ?? null,
    ),
  };
}
