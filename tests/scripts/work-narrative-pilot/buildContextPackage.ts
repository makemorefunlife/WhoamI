/**
 * Build Work Narrative Pilot context package (Batch IV).
 * Structured facts + salience metadata; finished prose → reference_copy only.
 * No new production enums/resolvers/thresholds — reuses psych match_type +
 * officePsychFit reporting bands (60/40).
 */
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkColleagueContext } from "@/lib/relationship/workColleague/buildWorkColleagueContext";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { branchElement } from "@/lib/saju/elements";
import type {
  CommunicationSignals,
  DnaSignals,
  EvidenceRelationship,
  NarrativeRouting,
  PilotPairCategory,
  PsychPairPatternKind,
  PsychPairPatternRow,
  StructuredEvidenceItem,
  WorkPilotBindingTruth,
  WorkPilotContextPackage,
  WorkPilotPsychAxisRow,
} from "./types";

/** Same bands as resolveReportingStyleForPerson in officePsychFit.ts */
const PSYCH_HIGH_BAND = 60;
const PSYCH_LOW_BAND = 40;

const SAFETY_BOUNDARIES = [
  "Do not invent biography, workplace history, job titles, or past events not in the context.",
  "Do not diagnose mental health conditions.",
  "Do not make guaranteed future predictions or deterministic fate claims.",
  "Do not invent saju facts not present in saju_context / evidence_sources.",
  "Do not give generic advice that could apply to any pair.",
  "When signals conflict, explain the tension; do not silently pick one side.",
  "reference_copy is for fact-check against the deterministic report only — never use its sentences, contrasts, metaphors, or prescriptions as narrative source.",
];

const VARIANT_C_BOUNDARIES = [
  ...SAFETY_BOUNDARIES,
  "Person A and Person B identities are fixed by binding_truth.ab_identity — never reverse A and B.",
  "comparison_table bands and leadership_split in binding_truth are frozen — do not reclassify.",
  "leadership_split = external present/report vs internal QA only.",
  "If communication_signals.contrast_supported is false, do not invent style contrasts.",
  "stock_fast_vs_detail_allowed is always false — never write 빠른 vs 꼼꼼 / 직관 vs 세부 stock contrast.",
  "Use narrative_routing: leadership only in home_section; nicknames exactly as given (no 한글화 of Latin names).",
  "Prefer structured_evidence, pair_patterns, evidence_relationships, psych/saju/work_signals over any prose.",
];

const MEANINGFUL_GAP_MIN = 15;

export type BuildPilotContextParams = {
  pair_id: string;
  category: PilotPairCategory;
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  locale?: Locale;
  report: WorkColleagueReportBody;
  variant: "B" | "C";
};

function compressTenGodComplement(
  ctx: ReturnType<typeof buildWorkColleagueContext>,
) {
  const c = ctx.tenGodComplement;
  const complements = (c.items ?? []).slice(0, 8).map((item) => {
    const stronger =
      item.giverNickname === ctx.nicknameA
        ? ("A" as const)
        : item.giverNickname === ctx.nicknameB
          ? ("B" as const)
          : ("balanced" as const);
    return { category: item.category, stronger_side: stronger };
  });
  return {
    person_a: {
      strong: c.personA.strong.slice(0, 3),
      lacking: c.personA.lacking.slice(0, 3),
    },
    person_b: {
      strong: c.personB.strong.slice(0, 3),
      lacking: c.personB.lacking.slice(0, 3),
    },
    complements,
  };
}

function buildBindingTruth(
  report: WorkColleagueReportBody,
  nicknameA: string,
  nicknameB: string,
): WorkPilotBindingTruth {
  const table = report.canonical_projections?.comparison_table ?? {};
  const comparison_table: Record<string, { band_a: string; band_b: string }> =
    {};
  for (const [id, row] of Object.entries(table)) {
    if (row && typeof row === "object" && "band_a" in row && "band_b" in row) {
      comparison_table[id] = {
        band_a: String(row.band_a),
        band_b: String(row.band_b),
      };
    }
  }
  const lead = report.canonical_projections?.leadership_split;
  return {
    ab_identity: {
      person_a_key: "A",
      person_b_key: "B",
      nickname_a: nicknameA,
      nickname_b: nicknameB,
    },
    comparison_table,
    leadership_split: lead
      ? {
          external_lead: lead.external_lead,
          internal_qa_lead: lead.internal_qa_lead,
          ...(lead.confidence ? { confidence: lead.confidence } : {}),
          ...(lead.align ? { align: lead.align } : {}),
        }
      : null,
    leadership_scope_note:
      "external present/report vs internal QA only — not initiative, total authority, or execution ownership",
  };
}

function classifyPairPattern(row: WorkPilotPsychAxisRow): PsychPairPatternKind {
  const bothHigh =
    row.score_a >= PSYCH_HIGH_BAND && row.score_b >= PSYCH_HIGH_BAND;
  const bothLow =
    row.score_a <= PSYCH_LOW_BAND && row.score_b <= PSYCH_LOW_BAND;

  if (row.match_type === "tension") return "high_gap";
  if (row.match_type === "complementary") {
    if (bothHigh) return "both_high";
    if (bothLow) return "both_low";
    // Reuse meaningful_gaps floor (15) — tiny complementary labels are not contrast evidence.
    if (row.gap >= MEANINGFUL_GAP_MIN) return "moderate_gap";
    return "similar_mid";
  }
  // similarity (existing psychMatch classifyPsychMatchType)
  if (bothHigh) return "similar_high";
  if (bothLow) return "similar_low";
  return "similar_mid";
}

function buildPairPatterns(
  axes: WorkPilotPsychAxisRow[],
): PsychPairPatternRow[] {
  const rows: PsychPairPatternRow[] = axes.map((row) => {
    const pattern = classifyPairPattern(row);

    const supports_contrast =
      pattern === "high_gap" || pattern === "moderate_gap";
    const supports_similarity =
      pattern.startsWith("similar") ||
      pattern === "both_high" ||
      pattern === "both_low";

    let priority: "high" | "medium" | "low" = "low";
    if (
      pattern === "high_gap" ||
      pattern === "both_high" ||
      pattern === "similar_high"
    ) {
      priority = "high";
    } else if (
      pattern === "moderate_gap" ||
      pattern === "both_low" ||
      pattern === "similar_low"
    ) {
      priority = "medium";
    }

    let narrative_relevance: string | undefined;
    if (
      (row.axis_key === "recognition" || row.axis_key === "conflict_style") &&
      (pattern === "both_high" || pattern === "similar_high")
    ) {
      narrative_relevance = "same_drive_clash";
    }
    if (
      row.axis_key === "self_control" &&
      (pattern === "both_low" || pattern === "similar_low")
    ) {
      narrative_relevance = "thin_patience_under_stress";
    }
    if (
      (row.axis_key === "structure" ||
        row.axis_key === "practicality" ||
        row.axis_key === "recognition") &&
      pattern === "high_gap"
    ) {
      narrative_relevance = "work_collision_gap";
    }

    return {
      axis_key: row.axis_key,
      pattern,
      score_a: row.score_a,
      score_b: row.score_b,
      gap: row.gap,
      match_type: row.match_type,
      priority,
      source_family: "psych",
      supports_contrast,
      supports_similarity,
      ...(narrative_relevance ? { narrative_relevance } : {}),
    };
  });

  return rows.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority] || b.gap - a.gap;
  });
}

function buildCommunicationSignals(
  report: WorkColleagueReportBody,
): CommunicationSignals {
  const fit = report.office?.section_mix_fit?.reporting_style_fit;
  const styleA = fit?.person_a?.style ?? "unknown";
  const styleB = fit?.person_b?.style ?? "unknown";
  const contrast_supported =
    Boolean(fit) &&
    styleA !== "unknown" &&
    styleB !== "unknown" &&
    styleA !== styleB;

  const contrast_means = contrast_supported
    ? `Interpret only as reporting-format difference (${styleA} vs ${styleB}): e.g. headline compression vs flexible framing — NOT speed-vs-detail, NOT 빠른vs꼼꼼, NOT intuition-vs-세부.`
    : null;

  return {
    a: {
      reporting_preference: String(styleA),
      confidence: fit ? "medium" : "low",
    },
    b: {
      reporting_preference: String(styleB),
      confidence: fit ? "medium" : "low",
    },
    contrast_supported,
    contrast_means,
    stock_fast_vs_detail_allowed: false,
    note: contrast_supported
      ? "Reporting preferences differ on FORMAT only. stock_fast_vs_detail_allowed=false always."
      : "Reporting preferences similar/unknown — inventing any style contrast is a hard failure.",
  };
}

function buildNarrativeRouting(
  nicknameA: string,
  nicknameB: string,
  report: WorkColleagueReportBody,
): NarrativeRouting {
  const lead = report.canonical_projections?.leadership_split;
  return {
    identity: {
      use_exact_nicknames: true,
      nickname_a: nicknameA,
      nickname_b: nicknameB,
      do_not_translate_or_localize_nicknames: true,
    },
    leadership_split: lead
      ? {
          home_section: "decision_and_execution_dynamics",
          forbidden_sections: [
            "pair_snapshot",
            "individual_work_styles",
            "communication_and_reporting",
            "trust_recognition_and_hidden_tension",
            "stress_loop",
            "practical_prescriptions",
          ],
          provisional:
            lead.confidence === "low" || lead.align === "caution",
        }
      : null,
  };
}

function supportingAxesForPerson(
  axes: WorkPilotPsychAxisRow[],
  side: "a" | "b",
): Array<{ axis_key: string; score: number }> {
  const keys = ["structure", "practicality", "thinking_style", "decision_style"];
  return axes
    .filter((r) => keys.includes(r.axis_key))
    .map((r) => ({
      axis_key: r.axis_key,
      score: side === "a" ? r.score_a : r.score_b,
    }));
}

function buildDnaSignals(
  report: WorkColleagueReportBody,
  workSignalsA: WorkSajuSignals | undefined,
  workSignalsB: WorkSajuSignals | undefined,
  axes: WorkPilotPsychAxisRow[],
): DnaSignals {
  const dna = report.office?.section_dna;
  return {
    a: {
      contribution_style: dna?.person_a?.contribution_style ?? null,
      drive_band: workSignalsA?.drive_stubborn?.drive_band ?? null,
      stubborn_band: workSignalsA?.drive_stubborn?.stubborn_band ?? null,
      supporting_axes: supportingAxesForPerson(axes, "a"),
    },
    b: {
      contribution_style: dna?.person_b?.contribution_style ?? null,
      drive_band: workSignalsB?.drive_stubborn?.drive_band ?? null,
      stubborn_band: workSignalsB?.drive_stubborn?.stubborn_band ?? null,
      supporting_axes: supportingAxesForPerson(axes, "b"),
    },
  };
}

function buildStructuredEvidence(params: {
  report: WorkColleagueReportBody;
  communication: CommunicationSignals;
  dna: DnaSignals;
  complement: ReturnType<typeof compressTenGodComplement>;
  scoring: Record<string, boolean>;
}): StructuredEvidenceItem[] {
  const items: StructuredEvidenceItem[] = [];
  const { report, communication, dna, complement, scoring } = params;

  items.push({
    source_family: "scores",
    signal: "tri_score",
    person_scope: "pair",
    priority: "medium",
    value: `${report.meta.fit_pct}/${report.meta.synergy_pct}/${report.meta.risk_pct}`,
    evidence_basis: ["meta.fit_pct", "meta.synergy_pct", "meta.risk_pct"],
  });

  items.push({
    source_family: "communication",
    signal: "reporting_preference_a",
    person_scope: "a",
    priority: communication.contrast_supported ? "high" : "medium",
    confidence: communication.a.confidence,
    value: communication.a.reporting_preference,
    supports_contrast: communication.contrast_supported,
    supports_similarity: !communication.contrast_supported,
    evidence_basis: ["office.section_mix_fit.reporting_style_fit.person_a.style"],
  });
  items.push({
    source_family: "communication",
    signal: "reporting_preference_b",
    person_scope: "b",
    priority: communication.contrast_supported ? "high" : "medium",
    confidence: communication.b.confidence,
    value: communication.b.reporting_preference,
    supports_contrast: communication.contrast_supported,
    supports_similarity: !communication.contrast_supported,
    evidence_basis: ["office.section_mix_fit.reporting_style_fit.person_b.style"],
  });

  if (dna.a.contribution_style) {
    items.push({
      source_family: "dna_signals",
      signal: "contribution_style",
      person_scope: "a",
      priority: "medium",
      value: dna.a.contribution_style,
      evidence_basis: ["office.section_dna.person_a.contribution_style"],
    });
  }
  if (dna.b.contribution_style) {
    items.push({
      source_family: "dna_signals",
      signal: "contribution_style",
      person_scope: "b",
      priority: "medium",
      value: dna.b.contribution_style,
      evidence_basis: ["office.section_dna.person_b.contribution_style"],
    });
  }

  for (const c of complement.complements.slice(0, 6)) {
    items.push({
      source_family: "ten_god",
      signal: `complement_${c.category}`,
      person_scope: "pair",
      priority: "high",
      direction: `stronger_side=${c.stronger_side}`,
      evidence_basis: ["tenGodComplement.items"],
    });
  }

  for (const [k, v] of Object.entries(scoring)) {
    if (!v) continue;
    const tension = /Clash|Punish|Overcome|Wonjin|HaPa|Gongmang|Chung/i.test(k);
    items.push({
      source_family: "saju_pair",
      signal: k,
      person_scope: "pair",
      priority: tension ? "high" : "medium",
      value: true,
      supports_contrast: tension,
      supports_similarity: !tension,
      evidence_basis: ["workPairAnalysis.scoringSignals"],
    });
  }

  return items;
}

function buildEvidenceRelationships(params: {
  category: PilotPairCategory;
  patterns: PsychPairPatternRow[];
  scoring: Record<string, boolean>;
  communication: CommunicationSignals;
  hasLeadership: boolean;
}): EvidenceRelationship[] {
  const { category, patterns, scoring, communication, hasLeadership } = params;
  const out: EvidenceRelationship[] = [];

  const hasSajuTension =
    scoring.hasStemClashOrOvercome ||
    scoring.hasMonthClashOrPunish ||
    scoring.hasWonjinOrGuimun ||
    scoring.hasHaPaHae;
  const hasSajuSupport =
    scoring.hasStemCombine ||
    scoring.hasMonthDirectCombine ||
    scoring.hasElementMutualComplement;
  const similarAxes = patterns.filter((p) => p.supports_similarity);
  const gapAxes = patterns.filter((p) => p.pattern === "high_gap");
  const bothHigh = patterns.filter(
    (p) => p.pattern === "both_high" || p.pattern === "similar_high",
  );
  const bothLow = patterns.filter(
    (p) => p.pattern === "both_low" || p.pattern === "similar_low",
  );

  if (category === "similar" || (similarAxes.length >= 5 && hasSajuTension)) {
    out.push({
      sources: ["psych_similarity", "saju_tension"],
      relationship: "tension",
      interpretation_prompt:
        "similar work needs but different chart pressure — friction inside similarity",
    });
  }

  if (category === "highly_different" || gapAxes.length >= 3) {
    const keys = gapAxes
      .filter((p) =>
        ["structure", "practicality", "recognition"].includes(p.axis_key),
      )
      .map((p) => `psych_gap_${p.axis_key}`);
    out.push({
      sources:
        keys.length > 0
          ? keys
          : gapAxes.slice(0, 3).map((p) => `psych_gap_${p.axis_key}`),
      relationship: "tension",
      interpretation_prompt:
        "large psych gaps as work-collision scenes — not soft complementarity",
    });
  }

  if (category === "complementary" && hasLeadership) {
    out.push({
      sources: ["leadership_split", "ten_god_complement", "psych_gaps"],
      relationship: "complement",
      interpretation_prompt:
        "why external/internal QA split works with psych and ten-god directions",
    });
  }

  if (
    category === "conflict_heavy" ||
    (bothHigh.some((p) => p.narrative_relevance === "same_drive_clash") &&
      bothLow.some((p) => p.narrative_relevance === "thin_patience_under_stress"))
  ) {
    out.push({
      sources: [
        "psych_both_high_recognition_or_conflict",
        "psych_both_low_self_control",
      ],
      relationship: "convergent",
      interpretation_prompt:
        "same-drive clash — overlapping needs amplify conflict; do not invent opposite styles",
    });
  }

  if (hasSajuSupport && hasSajuTension) {
    out.push({
      sources: ["saju_support_flags", "saju_tension_flags"],
      relationship: "tension",
      interpretation_prompt: "coexisting support and clash in pairwise saju",
    });
  }

  if (!communication.contrast_supported) {
    out.push({
      sources: ["communication_signals"],
      relationship: "convergent",
      interpretation_prompt:
        "reporting preferences aligned or unknown — forbid invented fast-vs-detail contrast",
    });
  }

  return out;
}

function buildReferenceCopy(
  report: WorkColleagueReportBody,
): WorkPilotContextPackage["reference_copy"] {
  const office = report.office;
  const items: Array<{ key: string; text: string }> = [];
  const push = (key: string, text: string | null | undefined) => {
    if (text && text.trim()) items.push({ key, text: text.trim() });
  };

  push("headline", report.headline);
  push("one_line_definition", report.one_line_definition);
  push("grade_reason", report.meta.grade_reason);
  push("communication_fit", office?.section_mix_fit?.communication_fit);
  push(
    "reporting_style_summary",
    office?.section_mix_fit?.reporting_style_fit?.summary,
  );
  push(
    "break_boundary_summary",
    office?.section_respect?.break_boundary_fit?.summary,
  );
  push(
    "leadership_summary_prose",
    office?.section_roles?.leadership_split?.summary,
  );
  push("dna_a_title", office?.section_dna?.person_a?.character_title);
  push("dna_a_work_style", office?.section_dna?.person_a?.work_style);
  push("dna_b_title", office?.section_dna?.person_b?.character_title);
  push("dna_b_work_style", office?.section_dna?.person_b?.work_style);
  for (const item of report.meta.prescription_work?.items ?? []) {
    push(`prescription_${item.topic}`, item.headline);
  }

  return {
    allowed_for_fact_check: true,
    allowed_as_narrative_source: false,
    items,
  };
}

function buildAmbiguities(
  report: WorkColleagueReportBody,
  psych: WorkPilotContextPackage["psych_context"],
  signals: Record<string, boolean>,
  communication: CommunicationSignals,
): string[] {
  const out: string[] = [...(report.meta.uncertain_items ?? [])];
  if (!report.meta.psych_match) {
    out.push("psych_match missing — psych coverage incomplete");
  }
  for (const t of psych.conflict_triggers) {
    out.push(
      `psych tension on ${t.axis_key} (gap=${t.gap}, type=${t.match_type})`,
    );
  }
  const pos = signals.hasStemCombine || signals.hasMonthDirectCombine;
  const neg =
    signals.hasStemClashOrOvercome ||
    signals.hasMonthClashOrPunish ||
    signals.hasWonjinOrGuimun;
  if (pos && neg) {
    out.push(
      "pairwise saju shows both supportive and tension signals — treat as coexistence",
    );
  }
  const lead = report.canonical_projections?.leadership_split;
  if (lead?.confidence === "low" || lead?.align === "caution") {
    out.push(
      `leadership_split soft markers (confidence=${lead.confidence ?? "n/a"}, align=${lead.align ?? "n/a"})`,
    );
  }
  if (!communication.contrast_supported) {
    out.push(
      "communication contrast_supported=false — do not invent fast-vs-detail contrast",
    );
  }
  return out;
}

export function buildWorkPilotContextPackage(
  params: BuildPilotContextParams,
): WorkPilotContextPackage {
  const locale = params.locale ?? "ko-KR";
  const ctx = buildWorkColleagueContext({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    workSignalsA: params.workSignalsA,
    workSignalsB: params.workSignalsB,
    locale,
  });

  const psychAxes: WorkPilotPsychAxisRow[] = (
    params.report.meta.psych_match?.axis_results ?? []
  ).map((r) => ({
    axis_key: r.axis_key,
    score_a: r.score_a,
    score_b: r.score_b,
    gap: r.gap,
    match_type: r.match_type,
  }));

  const meaningful_gaps = psychAxes
    .filter((r) => r.gap >= MEANINGFUL_GAP_MIN)
    .sort((a, b) => b.gap - a.gap);

  const conflict_triggers = (
    params.report.meta.psych_match?.conflict_triggers ?? []
  ).map((t) => ({
    axis_key: t.axis_key,
    gap: t.gap,
    match_type: t.match_type,
  }));

  const pair_patterns = buildPairPatterns(psychAxes);
  const scoring = ctx.workPairAnalysis.scoringSignals as unknown as Record<
    string,
    boolean
  >;

  const month = ctx.workPairAnalysis.monthBranch;
  const chartA = ctx.workPairAnalysis.chartA;
  const chartB = ctx.workPairAnalysis.chartB;
  const month_branch_summary = month
    ? {
        element_a:
          branchElement.get(chartA.monthBranchCode) ?? chartA.monthBranchCode,
        element_b:
          branchElement.get(chartB.monthBranchCode) ?? chartB.monthBranchCode,
        element_interaction: month.monthElementInteraction,
        synergy_weight: month.synergyWeight,
        tension_weight: month.tensionWeight,
      }
    : null;

  const hits = ctx.workPairAnalysis.base.allCrossHits ?? [];
  const pairwise_hit_briefs = hits.slice(0, 12).map((h) => ({
    type: h.type,
    person_a_pillar: h.personA_pillar,
    person_b_pillar: h.personB_pillar,
    meaning_ko: h.interpretation ?? null,
  }));

  const communication_signals = buildCommunicationSignals(params.report);
  const dna_signals = buildDnaSignals(
    params.report,
    params.workSignalsA,
    params.workSignalsB,
    psychAxes,
  );
  const ten_god_complement = compressTenGodComplement(ctx);
  const structured_evidence = buildStructuredEvidence({
    report: params.report,
    communication: communication_signals,
    dna: dna_signals,
    complement: ten_god_complement,
    scoring,
  });

  const psych_context = {
    axes: psychAxes,
    meaningful_gaps,
    conflict_triggers,
    pair_patterns,
  };

  const evidence_relationships = buildEvidenceRelationships({
    category: params.category,
    patterns: pair_patterns,
    scoring,
    communication: communication_signals,
    hasLeadership: Boolean(params.report.canonical_projections?.leadership_split),
  });

  const narrative_routing = buildNarrativeRouting(
    params.nicknameA,
    params.nicknameB,
    params.report,
  );

  return {
    schema_version: "work_narrative_pilot_context_v2",
    pair_id: params.pair_id,
    category: params.category,
    locale,
    variant: params.variant,
    binding_truth:
      params.variant === "C"
        ? buildBindingTruth(params.report, params.nicknameA, params.nicknameB)
        : null,
    evidence_sources: {
      grade: params.report.meta.grade,
      scores: {
        activation: params.report.meta.fit_pct,
        benefit: params.report.meta.synergy_pct,
        risk: params.report.meta.risk_pct,
      },
      scoring_signals: scoring,
      ten_god_complement,
      work_signals_a: params.workSignalsA ?? null,
      work_signals_b: params.workSignalsB ?? null,
      communication_signals,
      dna_signals,
      structured_evidence,
    },
    psych_context,
    saju_context: {
      strength_a: ctx.strengthA,
      strength_b: ctx.strengthB,
      metaphor_a: ctx.metaphorA,
      metaphor_b: ctx.metaphorB,
      ten_gods_a: ctx.tenGodsA,
      ten_gods_b: ctx.tenGodsB,
      month_branch_summary,
      pairwise_hit_briefs,
    },
    evidence_relationships,
    narrative_routing,
    ambiguities: buildAmbiguities(
      params.report,
      psych_context,
      scoring,
      communication_signals,
    ),
    semantic_boundaries:
      params.variant === "C" ? VARIANT_C_BOUNDARIES : SAFETY_BOUNDARIES,
    reference_copy: buildReferenceCopy(params.report),
  };
}
