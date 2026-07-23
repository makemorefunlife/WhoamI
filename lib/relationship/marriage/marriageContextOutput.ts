/**
 * Marriage/Cohabitation Context Output — 내부용 순수 매핑 (파일럿).
 *
 * 기존 판정·점수·문구·section builder를 수정하지 않고,
 * 이미 계산된 MarriageRuleContext + HouseholdPartnershipReport(+ optional psych_match)만 옮긴다.
 * 새 판정·문장 생성·판정 함수 재호출 금지 (특히 resolveMannerArchetype).
 */

import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { MarriageMasterScores } from "@/lib/relationship/marriageEventScores";
import type { MarriageScoringSignals } from "@/lib/saju/marriageAnalysis";
import type { HouseholdPartnershipReport } from "./homeReportTemplate";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { ParentingStyle } from "./marriageTenGodAnalysis";
import type {
  FantasyArchetype,
  MannerArchetype,
  StaminaArchetype,
} from "./bedroomProfile";

export const MARRIAGE_CONTEXT_OUTPUT_SCHEMA_VERSION =
  "context_output_v1" as const;

export type MarriageAttachmentLean = "secure" | "anxious" | "avoidant";

export type MarriageContextDominantCategory = {
  /** 안정적 raw key (번역 문장 아님) */
  category: string;
  scores?: Record<string, number>;
};

export type MarriageContextAxisNotes = {
  /** section_money_chores.cfo_axis_note — psych 확인 문구(짧음), 없으면 null */
  cfo: string | null;
  /** section_dna.person_a.energy_axis_note */
  energy_a: string | null;
  /** section_dna.person_b.energy_axis_note */
  energy_b: string | null;
  /** section_bedroom.rejection_axis_note */
  rejection: string | null;
  /** section_parenting.person_a_role_note */
  parenting_role_a: string | null;
  /** section_parenting.person_b_role_note */
  parenting_role_b: string | null;
  /** section_bedroom.matrix.person_a.stamina_precision_note */
  bedroom_stamina_a: string | null;
  /** section_bedroom.matrix.person_b.stamina_precision_note */
  bedroom_stamina_b: string | null;
};

export type MarriageContextSectionSummaries = {
  /** section_money_chores.cfo_reason */
  cfo_reason: string;
  /** section_money_chores.chores_guideline */
  chores_guideline: string;
  /** section_money_chores.spending_style_note */
  spending_style_note: string;
  /** section_bedroom.matrix.sexual_chemistry_summary */
  sexual_chemistry_summary: string;
  /** section_bedroom.matrix.frequency_one_liner */
  bedroom_frequency: string;
  /** section_family_boundary.inlaw_stress_summary */
  inlaw_stress_summary: string;
  /** section_warning.conflict_trigger */
  conflict_trigger: string;
  /** section_warning.conflict_communication.emotional_neglect_risk */
  emotional_neglect_risk: string;
  /** section_bedroom.sleep_fit.prescription */
  sleep_prescription: string;
  /** section_origin_story.why_us */
  why_us: string;
  /** section_snapshot.one_line_household */
  one_line_household: string;
};

export type MarriageContextOutputMeta = {
  reportIdA: string;
  reportIdB: string;
  inputFingerprintA: string;
  inputFingerprintB: string;
};

export type MarriageContextOutput = {
  schema_version: typeof MARRIAGE_CONTEXT_OUTPUT_SCHEMA_VERSION;
  domain: "cohabitation";
  grade: MarriageRuleContext["grade"];
  scores: MarriageMasterScores;
  signals: MarriageScoringSignals;
  dominant_categories: {
    /**
     * Refined money-section CFO nickname → "a" | "b".
     * Falls back to base `tenGod.cfo` only when money nick cannot map;
     * omitted on mismatch / same-name / missing (no arbitrary "a").
     */
    household_cfo?: MarriageContextDominantCategory;
    /** Phase 5-2 — section_money_chores.cfo_confidence */
    cfo_confidence?: MarriageContextDominantCategory;
    /** Phase 5-2 — section_money_chores.cfo_align */
    cfo_align?: MarriageContextDominantCategory;
    /** Phase 5-2 — dual CFO risk flag */
    cfo_dual?: MarriageContextDominantCategory;
    /** tenGod.parentingA.style — refine 후 section.style_key_a 우선 */
    parenting_style_a: MarriageContextDominantCategory & {
      category: ParentingStyle;
    };
    /** tenGod.parentingB.style — refine 후 section.style_key_b 우선 */
    parenting_style_b: MarriageContextDominantCategory & {
      category: ParentingStyle;
    };
    /** Phase 5-2 */
    parenting_a_confidence?: MarriageContextDominantCategory;
    parenting_b_confidence?: MarriageContextDominantCategory;
    parenting_a_align?: MarriageContextDominantCategory;
    parenting_b_align?: MarriageContextDominantCategory;
    /** stemIntimacy.attachmentLeanA */
    attachment_lean_a: MarriageContextDominantCategory & {
      category: MarriageAttachmentLean;
    };
    /** stemIntimacy.attachmentLeanB */
    attachment_lean_b: MarriageContextDominantCategory & {
      category: MarriageAttachmentLean;
    };
    /** matrix.person_a.archetypes.stamina — 재계산 없이 section 값 */
    bedroom_stamina_a: MarriageContextDominantCategory & {
      category: StaminaArchetype;
    };
    bedroom_stamina_b: MarriageContextDominantCategory & {
      category: StaminaArchetype;
    };
    bedroom_fantasy_a: MarriageContextDominantCategory & {
      category: FantasyArchetype;
    };
    bedroom_fantasy_b: MarriageContextDominantCategory & {
      category: FantasyArchetype;
    };
    /**
     * matrix.person_*.archetypes.manner ("sweet_guide" | "power_leader").
     * resolveMannerArchetype 재호출 금지 — section에 이미 저장된 raw만 매핑.
     * (비교표 UI의 알려진 미분류 문제는 이번 배치에서 수정하지 않음)
     */
    bedroom_manner_a: MarriageContextDominantCategory & {
      category: MannerArchetype;
    };
    bedroom_manner_b: MarriageContextDominantCategory & {
      category: MannerArchetype;
    };
    /** boundaryA.needsStrongBoundary → "needs_distance" | "comfortable" */
    boundary_a: MarriageContextDominantCategory;
    boundary_b: MarriageContextDominantCategory;
    /**
     * meta.psych_match.axis_results 중 practicality — 있을 때만.
     * category = match_type; scores = score_a/score_b/gap
     */
    psych_practicality?: MarriageContextDominantCategory;
    /** meta.psych_match.axis_results 중 self_control — 있을 때만 */
    psych_self_control?: MarriageContextDominantCategory;
  };
  axis_notes: MarriageContextAxisNotes;
  section_summaries: MarriageContextSectionSummaries;
  meta?: MarriageContextOutputMeta;
};

export type BuildMarriageContextOutputOptions = {
  psychMatch?: PsychMatchResult | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  } | null;
};

function nicknameToAb(
  nickname: string | null | undefined,
  nicknameA: string,
  nicknameB: string,
): "a" | "b" | null {
  if (!nickname) return null;
  // 동명이인이면 A/B slot을 추정하지 않음
  if (nicknameA === nicknameB) return null;
  if (nickname === nicknameA) return "a";
  if (nickname === nicknameB) return "b";
  return null;
}

function findPsychAxis(
  psychMatch: PsychMatchResult | null | undefined,
  axisKey: string,
): MarriageContextDominantCategory | undefined {
  if (!psychMatch?.axis_results?.length) return undefined;
  const hit = psychMatch.axis_results.find((r) => r.axis_key === axisKey);
  if (!hit) return undefined;
  return {
    category: hit.match_type,
    scores: {
      score_a: hit.score_a,
      score_b: hit.score_b,
      gap: hit.gap,
    },
  };
}

/**
 * Marriage/Cohabitation Context Output 순수 매핑.
 * ctx / household / options 입력을 변경하지 않는다.
 */
export function buildMarriageContextOutput(
  ctx: MarriageRuleContext,
  household: HouseholdPartnershipReport,
  options?: BuildMarriageContextOutputOptions,
): MarriageContextOutput {
  const money = household.section_money_chores;
  const dna = household.section_dna;
  const parenting = household.section_parenting;
  const bedroomSection = household.section_bedroom;
  const bedroom = bedroomSection.matrix;
  const warning = household.section_warning;
  const conflict = warning.conflict_communication;
  const sleep = bedroomSection.sleep_fit;
  const familyBoundary = household.section_family_boundary;
  const snapshot = household.section_snapshot;
  const origin = household.section_origin_story;

  const cfoSlot =
    nicknameToAb(money.cfo_nickname, ctx.nicknameA, ctx.nicknameB) ??
    nicknameToAb(ctx.tenGod.cfo.nickname, ctx.nicknameA, ctx.nicknameB);

  const dominant_categories: MarriageContextOutput["dominant_categories"] = {
    parenting_style_a: {
      category:
        parenting.style_key_a ?? ctx.tenGod.parentingA.style,
    },
    parenting_style_b: {
      category:
        parenting.style_key_b ?? ctx.tenGod.parentingB.style,
    },
    attachment_lean_a: {
      category: ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanA,
    },
    attachment_lean_b: {
      category: ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanB,
    },
    bedroom_stamina_a: { category: bedroom.person_a.archetypes.stamina },
    bedroom_stamina_b: { category: bedroom.person_b.archetypes.stamina },
    bedroom_fantasy_a: { category: bedroom.person_a.archetypes.fantasy },
    bedroom_fantasy_b: { category: bedroom.person_b.archetypes.fantasy },
    bedroom_manner_a: { category: bedroom.person_a.archetypes.manner },
    bedroom_manner_b: { category: bedroom.person_b.archetypes.manner },
    boundary_a: {
      category: ctx.tenGod.boundaryA.needsStrongBoundary
        ? "needs_distance"
        : "comfortable",
    },
    boundary_b: {
      category: ctx.tenGod.boundaryB.needsStrongBoundary
        ? "needs_distance"
        : "comfortable",
    },
  };
  if (cfoSlot) {
    dominant_categories.household_cfo = { category: cfoSlot };
  }
  if (money.cfo_confidence) {
    dominant_categories.cfo_confidence = { category: money.cfo_confidence };
  }
  if (money.cfo_align) {
    dominant_categories.cfo_align = { category: money.cfo_align };
  }
  if (money.cfo_dual) {
    dominant_categories.cfo_dual = { category: "dual" };
  }
  if (parenting.parenting_a_confidence) {
    dominant_categories.parenting_a_confidence = {
      category: parenting.parenting_a_confidence,
    };
  }
  if (parenting.parenting_b_confidence) {
    dominant_categories.parenting_b_confidence = {
      category: parenting.parenting_b_confidence,
    };
  }
  if (parenting.parenting_a_align) {
    dominant_categories.parenting_a_align = {
      category: parenting.parenting_a_align,
    };
  }
  if (parenting.parenting_b_align) {
    dominant_categories.parenting_b_align = {
      category: parenting.parenting_b_align,
    };
  }

  const psychPracticality = findPsychAxis(options?.psychMatch, "practicality");
  const psychSelfControl = findPsychAxis(options?.psychMatch, "self_control");
  if (psychPracticality) {
    dominant_categories.psych_practicality = psychPracticality;
  }
  if (psychSelfControl) {
    dominant_categories.psych_self_control = psychSelfControl;
  }

  const out: MarriageContextOutput = {
    schema_version: MARRIAGE_CONTEXT_OUTPUT_SCHEMA_VERSION,
    domain: "cohabitation",
    grade: ctx.grade,
    scores: {
      activation: ctx.masterScores.activation,
      benefit: ctx.masterScores.benefit,
      risk: ctx.masterScores.risk,
    },
    signals: { ...ctx.marriagePairAnalysis.scoringSignals },
    dominant_categories,
    axis_notes: {
      cfo: money.cfo_axis_note ?? null,
      energy_a: dna.person_a.energy_axis_note ?? null,
      energy_b: dna.person_b.energy_axis_note ?? null,
      rejection: bedroomSection.rejection_axis_note ?? null,
      parenting_role_a: parenting.person_a_role_note ?? null,
      parenting_role_b: parenting.person_b_role_note ?? null,
      bedroom_stamina_a: bedroom.person_a.stamina_precision_note ?? null,
      bedroom_stamina_b: bedroom.person_b.stamina_precision_note ?? null,
    },
    section_summaries: {
      cfo_reason: money.cfo_reason,
      chores_guideline: money.chores_guideline,
      spending_style_note: money.spending_style_note,
      sexual_chemistry_summary: bedroom.sexual_chemistry_summary,
      bedroom_frequency: bedroom.frequency_one_liner,
      inlaw_stress_summary: familyBoundary.inlaw_stress_summary,
      conflict_trigger: warning.conflict_trigger,
      emotional_neglect_risk: conflict.emotional_neglect_risk,
      sleep_prescription: sleep.prescription,
      why_us: origin.why_us,
      one_line_household: snapshot.one_line_household,
    },
  };

  if (options?.personCoreMeta) {
    out.meta = {
      reportIdA: options.personCoreMeta.reportIdA,
      reportIdB: options.personCoreMeta.reportIdB,
      inputFingerprintA: options.personCoreMeta.inputFingerprintA,
      inputFingerprintB: options.personCoreMeta.inputFingerprintB,
    };
  }

  return out;
}
