/**
 * Domain Lens Proof Consumer
 *
 * Demonstrates end-to-end consumption from SSOT facts and Pair CE packets
 * through Domain Lens evaluations into typed ViewModels for Partner, Family, Friend, and Cowork.
 */

import type { DomainPairLensId, PairContextPacket } from "../../personCore/pairContextEngine/types";
import type { PairSajuFacts } from "../../personCore/pairSaju/types";
import type { PersonalContextEngineOutput } from "../../personCore/personalContextEngine/types";
import { resolveDomainLenses } from "./resolveDomainLenses";
import { buildDomainStoryPlannerInput } from "./buildDomainStoryPlannerInput";
import type {
  DomainLensEvaluation,
  DomainStoryPlannerInput,
  LensConfidenceLevel,
} from "./types";

export type DomainReportCardViewModel = {
  lens_id: string;
  domain: DomainPairLensId;
  question_ko: string;
  headline_ko: string;
  narrative_ko: string;
  confidence: LensConfidenceLevel;
  tension_level: string;
  is_abstaining: boolean;
  abstain_reason?: string;
  polarity: string;
  primary_evidence: Array<{ kind: string; description: string }>;
  prohibited_claims: string[];
};

export type DomainSectionViewModel = {
  domain: DomainPairLensId;
  total_lenses: number;
  active_lenses: number;
  abstained_lenses: number;
  report_cards: DomainReportCardViewModel[];
  story_planner_input: DomainStoryPlannerInput;
};

/**
 * Builds a complete domain view model from raw facts and context engine output.
 */
export function buildDomainSectionViewModel(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  packets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput | null;
  personalCeB?: PersonalContextEngineOutput | null;
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainSectionViewModel {
  const evaluations: DomainLensEvaluation[] = resolveDomainLenses({
    domain: params.domain,
    facts: params.facts,
    packets: params.packets,
    personalCeA: params.personalCeA,
    personalCeB: params.personalCeB,
    partyNames: params.partyNames,
    roleLabels: params.roleLabels,
  });

  const storyPlannerInput: DomainStoryPlannerInput = buildDomainStoryPlannerInput({
    domain: params.domain,
    facts: params.facts,
    evaluations,
    partyNames: params.partyNames,
    roleLabels: params.roleLabels,
  });

  const reportCards: DomainReportCardViewModel[] = evaluations.map((ev) => ({
    lens_id: ev.lens_id,
    domain: ev.domain,
    question_ko: ev.user_question,
    headline_ko: ev.headline_ko,
    narrative_ko: ev.narrative_ko,
    confidence: ev.confidence,
    tension_level: ev.tension_level,
    is_abstaining: Boolean(ev.is_abstaining),
    abstain_reason: ev.abstain_reason,
    polarity: ev.directionality?.polarity ?? "symmetric",
    primary_evidence: ev.primary_saju_evidence.map((s) => ({
      kind: s.kind,
      description: s.description_ko,
    })),
    prohibited_claims: ev.llm_synthesis_allowance.prohibited_claims,
  }));

  const activeCount = reportCards.filter((c) => !c.is_abstaining).length;
  const abstainedCount = reportCards.filter((c) => c.is_abstaining).length;

  return {
    domain: params.domain,
    total_lenses: reportCards.length,
    active_lenses: activeCount,
    abstained_lenses: abstainedCount,
    report_cards: reportCards,
    story_planner_input: storyPlannerInput,
  };
}
