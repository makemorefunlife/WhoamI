/**
 * Domain Story Planner Input Builder
 *
 * Transforms evaluated Domain Lenses into a structured, bounded input
 * for downstream Story Planners, LLM synthesizers, and premium report ViewModels.
 */

import type { PairSajuFacts } from "@/lib/personCore/pairSaju";
import type {
  DomainLensEvaluation,
  DomainStoryPlannerInput,
  StoryPlannerChapter,
} from "./types";
import type { DomainPairLensId } from "@/lib/personCore/pairContextEngine/types";

export function buildDomainStoryPlannerInput(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  evaluations: DomainLensEvaluation[];
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainStoryPlannerInput {
  const { domain, facts, evaluations, partyNames, roleLabels } = params;
  const nameA = partyNames?.a ?? "A";
  const nameB = partyNames?.b ?? "B";

  const highConfidenceEvaluations = evaluations.filter(
    (e) => e.confidence === "high" || e.confidence === "medium",
  );
  const abstainingEvaluations = evaluations.filter((e) => e.is_abstaining);

  // Group into chapters based on domain
  const chapters: StoryPlannerChapter[] = [
    {
      chapter_id: "chapter_core_resonance",
      title_ko: "1. 본질적 결속과 관계의 토대",
      title_en: "1. Core Resonance & Foundational Bond",
      summary_ko: "두 사람의 본질적 기질과 첫 단추에서 느껴지는 핵심 에너지",
      summary_en: "Fundamental temperaments and core energy flowing between the parties",
      lens_evaluations: evaluations.slice(0, 2),
      synthesis_guide_ko: "두 사람의 핵심 결속 요인을 긍정적으로 조명하고 첫인상과 가치관의 조화를 서술하세요.",
      synthesis_guide_en: "Highlight core bonding factors positively and articulate value alignment.",
    },
    {
      chapter_id: "chapter_daily_coordination",
      title_ko: "2. 일상 속 현실적 조율과 역할 분담",
      title_en: "2. Daily Coordination & Practical Roles",
      summary_ko: "재정, 가사, 여행, 실무 등 현실적 생활 장면에서의 핑퐁과 시너지",
      summary_en: "Finances, household, travel, and task execution dynamics in daily life",
      lens_evaluations: evaluations.slice(2, 5),
      synthesis_guide_ko: "서로 다른 생활 템포와 분담 룰을 구체적인 생활 장면으로 묘사하세요.",
      synthesis_guide_en: "Describe differing tempos and division of responsibilities with concrete scenes.",
    },
    {
      chapter_id: "chapter_friction_repair",
      title_ko: "3. 긴장 해소와 성숙한 화해 프로토콜",
      title_en: "3. Tension De-escalation & Restorative Repair",
      summary_ko: "갈등의 뇌관을 해체하고 상처 없이 쿨하게 회복하는 관계의 안전장치",
      summary_en: "De-escalating friction triggers and restoring psychological safety",
      lens_evaluations: evaluations.slice(5),
      synthesis_guide_ko: "다툼 패턴을 비난하지 않고 쿠션어와 회복 루틴을 중심으로 건설적으로 제시하세요.",
      synthesis_guide_en: "Avoid blame and focus constructively on communication cushions and repair routines.",
    },
  ];

  // Derive dominant element dynamic from facts
  const dominantElement = facts.element_flow?.interaction_label ?? "상호보완적 오행 흐름";

  // Identify primary tension and synergy lenses
  const primaryTension = evaluations.find((e) => e.tension_level === "high" || e.tension_level === "critical");
  const primarySynergy = evaluations.find((e) => e.tension_level === "low" && e.confidence === "high");

  // Collect bounded synthesis bullet points and strict prohibitions
  const allowedBulletPoints: string[] = [];
  const strictProhibitions: string[] = [
    "운명론적 파국/단정적 이혼/손절 판정 금지",
    "단일 신살/십성만을 근거로 한 인성 비하 및 극단적 진단 금지",
    "사주적 근거 없는 허위 서사 및 가상 수치(e.g., 가공의 지수/점수) 날조 금지",
  ];

  for (const evalItem of evaluations) {
    if (!evalItem.is_abstaining) {
      allowedBulletPoints.push(...evalItem.llm_synthesis_allowance.allowed_themes);
    }
    strictProhibitions.push(...evalItem.llm_synthesis_allowance.prohibited_claims);
  }

  return {
    schema_version: "domain_story_planner_v1",
    domain,
    parties: {
      a_name: nameA,
      b_name: nameB,
      a_role_label: roleLabels?.a,
      b_role_label: roleLabels?.b,
    },
    overall_confidence: facts.birth_time_unknown_a || facts.birth_time_unknown_b ? "medium" : "high",
    birth_time_unknown_a: facts.birth_time_unknown_a,
    birth_time_unknown_b: facts.birth_time_unknown_b,
    chapters,
    grounding_summary: {
      total_lenses_evaluated: evaluations.length,
      high_confidence_count: highConfidenceEvaluations.length,
      abstaining_count: abstainingEvaluations.length,
      dominant_element_dynamic: dominantElement,
      primary_tension_lens_id: primaryTension?.lens_id,
      primary_synergy_lens_id: primarySynergy?.lens_id,
    },
    evidence_boundary: {
      allowed_synthesis_bullet_points: Array.from(new Set(allowedBulletPoints)),
      strict_prohibitions: Array.from(new Set(strictProhibitions)),
    },
  };
}
