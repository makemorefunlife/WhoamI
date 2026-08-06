/**
 * Builds a side-by-side review package for one domain × case × locale.
 * Current = live V1 CE report + ViewModel section ids
 * V1 = V1 gold projections / inventory snapshots from the same CE body
 * DEV = Domain Lens → Story Planner → Narrative Composer
 */
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import { buildChartContext } from "@/lib/saju/chartContext";
import { buildPairSajuFacts } from "@/lib/personCore/pairSaju";
import { runPairContextEngine } from "@/lib/personCore/pairContextEngine";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { PSYCH_MASTER_JSON_VERSION } from "@/lib/personCore/schemaVersion";

import { buildFriendReport } from "@/lib/relationship/friend/buildFriendReport";
import { buildFriendReportViewModel } from "@/lib/relationship/friend/viewModel/buildFriendReportViewModel";
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkReportViewModel } from "@/lib/relationship/workColleague/viewModel/buildWorkReportViewModel";
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import { buildMarriageReport } from "@/lib/relationship/marriage/buildMarriageReport";
import { buildMarriageReportViewModel } from "@/lib/relationship/marriage/viewModel/buildMarriageReportViewModel";

import {
  resolveDomainLenses,
  buildDomainStoryPlannerInput,
  buildDomainSectionViewModel,
  V1_MIGRATION_INVENTORY,
} from "@/lib/relationship/domainLenses";
import { buildDomain7SceneStoryPlan } from "@/lib/relationship/domainLenses/domainStoryPlanner";
import { composeDomain7SceneNarrative } from "@/lib/relationship/domainLenses/domainNarrativeComposer";

import {
  type CorpusCaseId,
  type EnrichmentDomain,
  resolveBirthPairForCase,
  CORPUS_CASES,
} from "./corpusCases";

const SECONDARY_KEYS = [
  "stimulation",
  "self_control",
  "practicality",
  "structure",
  "empathy",
  "conflict_style",
  "resilience",
  "recognition",
  "energy_style",
  "thinking_style",
  "decision_style",
] as const;

function samplePsych(
  kind: "none" | "sparse" | "balanced" | "agree_high_empathy" | "conflict_style_clash",
  side: "a" | "b",
): PsychMasterJson | null {
  if (kind === "none") return null;

  const base = Object.fromEntries(SECONDARY_KEYS.map((k) => [k, 50])) as Record<
    string,
    number
  >;

  let overrides: Record<string, number> = {};
  if (kind === "sparse") {
    overrides = side === "a" ? { empathy: 55 } : {};
  } else if (kind === "agree_high_empathy") {
    overrides =
      side === "a"
        ? { empathy: 82, conflict_style: 40, resilience: 70 }
        : { empathy: 78, conflict_style: 42, resilience: 68 };
  } else if (kind === "conflict_style_clash") {
    overrides =
      side === "a"
        ? { conflict_style: 88, empathy: 30, structure: 75 }
        : { conflict_style: 18, empathy: 85, structure: 25 };
  } else {
    overrides =
      side === "a"
        ? { empathy: 62, practicality: 58, energy_style: 55 }
        : { empathy: 57, practicality: 61, energy_style: 48 };
  }

  Object.assign(base, overrides);

  // sparse B: incomplete-ish — still return a master with neutrals for builder stability
  if (kind === "sparse" && side === "b") {
    return null;
  }

  return {
    schema_version: PSYCH_MASTER_JSON_VERSION,
    secondary_axes: base as PsychMasterJson["secondary_axes"],
    survey_source: kind === "sparse" ? "incomplete" : "v2_10q",
    survey_completed_at: null,
    survey_input_fingerprint: null,
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "l",
      life_values_line: "v",
      private_home_self_line: "p",
      energy_battery_line: "e",
    },
  };
}

function sajuFromBirth(birthDate: string, birthTime: string | null) {
  const time = birthTime ?? "12:00";
  const bundle = calculateSajuBundle({ birthDate, birthTime: time });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

function summarizeCeReport(domain: EnrichmentDomain, report: Record<string, unknown>) {
  const meta = (report.meta ?? {}) as Record<string, unknown>;
  return {
    headline: report.headline ?? null,
    summary_line: report.summary_line ?? null,
    one_liner:
      report.one_line_friendship ??
      report.one_line_definition ??
      report.one_line_family ??
      report.one_line_household ??
      null,
    grade: meta.grade ?? null,
    grade_reason: meta.grade_reason ?? null,
    canonical_projection_keys: report.canonical_projections
      ? Object.keys(report.canonical_projections as object)
      : [],
    section_keys: (() => {
      const nest =
        (report.friend as Record<string, unknown> | undefined) ??
        (report.office as Record<string, unknown> | undefined) ??
        (report.family as Record<string, unknown> | undefined) ??
        (report.household as Record<string, unknown> | undefined) ??
        {};
      return Object.keys(nest).filter((k) => k.startsWith("section_"));
    })(),
  };
}

export type EnrichmentReviewPackage = {
  domain: EnrichmentDomain;
  caseId: CorpusCaseId;
  locale: Locale;
  generated_at: string;
  case_meta: {
    label_ko: string;
    label_en: string;
    birth: ReturnType<typeof resolveBirthPairForCase>;
    psych: string;
  };
  current: {
    mode: "current_ce";
    summary: ReturnType<typeof summarizeCeReport>;
    report: unknown;
    view_model_sections: Array<{ id: string; type: string; title?: string }>;
  };
  v1: {
    mode: "v1_gold";
    inventory: Array<{
      asset_id: string;
      target_lens_id: string;
      status: string;
      user_question_answered_ko: string;
    }>;
    projections: unknown;
  };
  dev: {
    mode: "domain_lens_dev";
    evidence: {
      packet_count: number;
      packet_ids: string[];
      abstained_lenses: number;
      active_lenses: number;
    };
    personal_ce: "not_wired_in_this_package";
    pair_ce_packets: Array<{ packet_id: string; group: string; fact_kind: string }>;
    lenses: Array<{
      lens_id: string;
      question_ko: string;
      headline_ko: string;
      narrative_ko: string;
      confidence: string;
      tension_level: string;
      is_abstaining: boolean;
    }>;
    story_planner: unknown;
    narrative: unknown;
    section_view_model: unknown;
  };
  previous_dev: {
    mode: "previous_dev_raw_lenses";
    evidence: {
      packet_count: number;
      packet_ids: string[];
      abstained_lenses: number;
      active_lenses: number;
    };
    lenses: Array<{
      lens_id: string;
      question_ko: string;
      headline_ko: string;
      narrative_ko: string;
      confidence: string;
      tension_level: string;
      is_abstaining: boolean;
    }>;
    story_planner: unknown;
  };
  final_dev: {
    mode: "final_dev_7_scene_narrative";
    narrative: unknown;
    section_view_model: unknown;
  };
};

export function buildEnrichmentReviewPackage(params: {
  domain: EnrichmentDomain;
  caseId: CorpusCaseId;
  locale?: Locale;
}): EnrichmentReviewPackage {
  const locale = params.locale ?? "ko-KR";
  const caseDef = CORPUS_CASES.find((c) => c.id === params.caseId)!;
  const birth = resolveBirthPairForCase(params.caseId);
  const sajuA = sajuFromBirth(birth.birthA, birth.timeA);
  const sajuB = sajuFromBirth(birth.birthB, birth.timeB);
  const psychA = samplePsych(caseDef.psych, "a");
  const psychB = samplePsych(caseDef.psych, "b");
  const unknownA = !birth.timeA;
  const unknownB = !birth.timeB;

  let report: Record<string, unknown>;
  let vmSections: Array<{ id: string; type: string; title?: string }>;

  const common = {
    nicknameA: birth.nicknameA,
    nicknameB: birth.nicknameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    birthTimeUnknownA: unknownA,
    birthTimeUnknownB: unknownB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    locale,
  };

  if (params.domain === "friend") {
    const r = buildFriendReport(common);
    report = r as unknown as Record<string, unknown>;
    const vm = buildFriendReportViewModel(r, {
      viewerIsReportA: true,
      myName: birth.nicknameA,
      partnerName: birth.nicknameB,
      locale,
    });
    vmSections = vm.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: "title" in s ? String((s as { title?: string }).title ?? "") : undefined,
    }));
  } else if (params.domain === "work") {
    const r = buildWorkColleagueReport(common);
    report = r as unknown as Record<string, unknown>;
    const vm = buildWorkReportViewModel(r, {
      viewerIsReportA: true,
      myName: birth.nicknameA,
      partnerName: birth.nicknameB,
      locale,
    });
    vmSections = vm.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: "title" in s ? String((s as { title?: string }).title ?? "") : undefined,
    }));
  } else if (params.domain === "family") {
    const r = buildFamilyParentReport({
      ...common,
      roles: birth.roles ?? { roleA: "child", roleB: "mother" },
      parentType: birth.parentType ?? "mother",
    });
    report = r as unknown as Record<string, unknown>;
    const vm = buildFamilyReportViewModel(r, {
      locale,
    });
    vmSections = vm.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: "title" in s ? String((s as { title?: string }).title ?? "") : undefined,
    }));
  } else {
    const r = buildMarriageReport(common);
    report = r as unknown as Record<string, unknown>;
    const vm = buildMarriageReportViewModel(r, {
      viewerIsReportA: true,
      myName: birth.nicknameA,
      partnerName: birth.nicknameB,
      locale,
    });
    vmSections = vm.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: "title" in s ? String((s as { title?: string }).title ?? "") : undefined,
    }));
  }

  // Domain Lens DEV path from same births
  const chartA = buildChartContext(sajuA.saju);
  const chartB = buildChartContext(sajuB.saju);
  const facts = buildPairSajuFacts({
    chartA,
    chartB,
    birthTimeUnknownA: unknownA,
    birthTimeUnknownB: unknownB,
    reportIdA: `enrich-${params.domain}-a`,
    reportIdB: `enrich-${params.domain}-b`,
  });
  const pairCe = runPairContextEngine({ facts });
  const evaluations = resolveDomainLenses({
    domain: params.domain,
    facts,
    packets: pairCe.packets,
    partyNames: { a: birth.nicknameA, b: birth.nicknameB },
  });
  const storyPlannerInput = buildDomainStoryPlannerInput({
    domain: params.domain,
    facts,
    evaluations,
    partyNames: { a: birth.nicknameA, b: birth.nicknameB },
  });
  const storyPlan = buildDomain7SceneStoryPlan({
    domain: params.domain,
    facts,
    evaluations,
    partyNames: { a: birth.nicknameA, b: birth.nicknameB },
  });
  const narrative = composeDomain7SceneNarrative({ storyPlan });
  const sectionVm = buildDomainSectionViewModel({
    domain: params.domain,
    facts,
    packets: pairCe.packets,
    partyNames: { a: birth.nicknameA, b: birth.nicknameB },
  });

  const inventory = V1_MIGRATION_INVENTORY.filter((a) => a.domain === params.domain).map(
    (a) => ({
      asset_id: a.asset_id,
      target_lens_id: a.target_lens_id,
      status: a.status,
      user_question_answered_ko: a.user_question_answered_ko,
    }),
  );

  return {
    domain: params.domain,
    caseId: params.caseId,
    locale,
    generated_at: new Date().toISOString(),
    case_meta: {
      label_ko: caseDef.label_ko,
      label_en: caseDef.label_en,
      birth,
      psych: caseDef.psych,
    },
    current: {
      mode: "current_ce",
      summary: summarizeCeReport(params.domain, report),
      report,
      view_model_sections: vmSections,
    },
    v1: {
      mode: "v1_gold",
      inventory,
      projections: report.canonical_projections ?? null,
    },
    dev: {
      mode: "domain_lens_dev",
      evidence: {
        packet_count: pairCe.packets.length,
        packet_ids: pairCe.packets.map((p) => p.packet_id),
        abstained_lenses: evaluations.filter((e) => e.is_abstaining).length,
        active_lenses: evaluations.filter((e) => !e.is_abstaining).length,
      },
      personal_ce: "not_wired_in_this_package",
      pair_ce_packets: pairCe.packets.map((p) => ({
        packet_id: p.packet_id,
        group: String(p.group),
        fact_kind: String(p.fact_kind),
      })),
      lenses: evaluations.map((e) => ({
        lens_id: e.lens_id,
        question_ko: e.user_question,
        headline_ko: e.headline_ko,
        narrative_ko: e.narrative_ko,
        confidence: e.confidence,
        tension_level: e.tension_level,
        is_abstaining: Boolean(e.is_abstaining),
      })),
      story_planner: {
        input: storyPlannerInput,
        plan: storyPlan,
      },
      narrative,
      section_view_model: sectionVm,
    },
    previous_dev: {
      mode: "previous_dev_raw_lenses",
      evidence: {
        packet_count: pairCe.packets.length,
        packet_ids: pairCe.packets.map((p) => p.packet_id),
        abstained_lenses: evaluations.filter((e) => e.is_abstaining).length,
        active_lenses: evaluations.filter((e) => !e.is_abstaining).length,
      },
      lenses: evaluations.map((e) => ({
        lens_id: e.lens_id,
        question_ko: e.user_question,
        headline_ko: e.headline_ko,
        narrative_ko: e.narrative_ko,
        confidence: e.confidence,
        tension_level: e.tension_level,
        is_abstaining: Boolean(e.is_abstaining),
      })),
      story_planner: {
        input: storyPlannerInput,
        plan: storyPlan,
      },
    },
    final_dev: {
      mode: "final_dev_7_scene_narrative",
      narrative,
      section_view_model: sectionVm,
    },
  };
}
