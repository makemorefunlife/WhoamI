/**
 * Variant A — capture deterministic Work Deep report for human review.
 */
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type {
  DeterministicBaselineArtifact,
  PilotPairCategory,
} from "./types";

export function extractDeterministicBaseline(params: {
  pair_id: string;
  category: PilotPairCategory;
  nicknameA: string;
  nicknameB: string;
  locale: string;
  report: WorkColleagueReportBody;
}): DeterministicBaselineArtifact {
  const { report } = params;
  const rows = report.office?.section_compare_table ?? [];
  return {
    pair_id: params.pair_id,
    category: params.category,
    nickname_a: params.nicknameA,
    nickname_b: params.nicknameB,
    locale: params.locale,
    meta: {
      grade: report.meta.grade,
      grade_reason: report.meta.grade_reason,
      fit_pct: report.meta.fit_pct,
      synergy_pct: report.meta.synergy_pct,
      risk_pct: report.meta.risk_pct,
      uncertain_items: report.meta.uncertain_items ?? [],
    },
    canonical_projections: {
      comparison_table: report.canonical_projections?.comparison_table,
      leadership_split: report.canonical_projections?.leadership_split,
    },
    office_review: {
      headline: report.headline,
      one_line_definition: report.one_line_definition,
      dna: report.office?.section_dna ?? null,
      mix_fit: report.office?.section_mix_fit ?? null,
      roles: report.office?.section_roles ?? null,
      warning: report.office?.section_warning ?? null,
      compare_table_rows: rows.map((r) => ({
        id: r.id,
        label: r.label,
        band_a: String(r.personA.band ?? ""),
        band_b: String(r.personB.band ?? ""),
        short_label_a: r.personA.shortLabel,
        short_label_b: r.personB.shortLabel,
        meaning: r.meaning,
      })),
    },
    prescriptions: report.meta.prescription_work ?? null,
    psych_match: report.meta.psych_match ?? null,
  };
}
