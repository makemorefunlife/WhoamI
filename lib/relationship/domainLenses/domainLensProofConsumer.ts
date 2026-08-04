/**
 * Domain Lens Proof Consumer
 *
 * Demonstrates end-to-end consumption from SSOT facts and Pair CE packets
 * through Domain Lens evaluations into typed ViewModels for Partner, Family, Friend, and Cowork.
 */

import type { DomainPairLensId } from "@/lib/personCore/pairContextEngine/types";
import type { PairSajuFacts } from "@/lib/personCore/pairSaju";
import type { PairContextPacket } from "@/lib/personCore/pairContextEngine/types";
import type { PersonalContextEngineOutput } from "@/lib/personCore/personalContextEngine/types";
import { resolveDomainLenses } from "./resolveDomainLenses";
import { buildDomainStoryPlannerInput } from "./buildDomainStoryPlannerInput";
import type {
  DomainLensEvaluation,
  DomainStoryPlannerInput,
  LensConfidenceLevel,
} from "./types";

export type DomainReportCardViewModel = {
  lens_id: string;
  badge_label_ko: string;
  headline_ko: string;
  narrative_ko: string;
  confidence: LensConfidenceLevel;
  evidence_tag_ko: string;
  action_tip_ko?: string;
};

export type DomainReportViewModel = {
  domain: DomainPairLensId;
  party_a_display_name: string;
  party_b_display_name: string;
  overall_summary_ko: string;
  cards: DomainReportCardViewModel[];
  story_planner_input: DomainStoryPlannerInput;
  provenance: {
    lens_count: number;
    packet_ids_consumed: string[];
    schema_version: string;
  };
};

export function buildDomainReportViewModel(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  pairPackets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput;
  personalCeB?: PersonalContextEngineOutput;
  partyNames?: { a: string; b: string };
}): DomainReportViewModel {
  const { domain, facts, pairPackets, personalCeA, personalCeB, partyNames } = params;

  // 1. Resolve domain lenses
  const evaluations = resolveDomainLenses({
    domain,
    facts,
    pairPackets,
    personalCeA,
    personalCeB,
    partyNames,
  });

  // 2. Build story planner input
  const storyPlannerInput = buildDomainStoryPlannerInput({
    domain,
    facts,
    evaluations,
    partyNames,
  });

  // 3. Map to UI cards
  const cards: DomainReportCardViewModel[] = evaluations.map((evalItem) => ({
    lens_id: evalItem.lens_id,
    badge_label_ko: evalItem.user_question,
    headline_ko: evalItem.headline_ko,
    narrative_ko: evalItem.narrative_ko,
    confidence: evalItem.confidence,
    evidence_tag_ko: evalItem.primary_saju_evidence[0]?.description_ko ?? "사주 기질 및 조화 분석",
    action_tip_ko: evalItem.llm_synthesis_allowance.allowed_themes.slice(0, 2).join(" · "),
  }));

  const allPacketIds = new Set<string>();
  for (const item of evaluations) {
    for (const id of item.supporting_packet_ids) {
      allPacketIds.add(id);
    }
  }

  return {
    domain,
    party_a_display_name: partyNames?.a ?? "A",
    party_b_display_name: partyNames?.b ?? "B",
    overall_summary_ko: storyPlannerInput.chapters[0]?.summary_ko ?? "관계의 본질적 역동 분석",
    cards,
    story_planner_input: storyPlannerInput,
    provenance: {
      lens_count: evaluations.length,
      packet_ids_consumed: Array.from(allPacketIds),
      schema_version: "domain_report_vm_v1",
    },
  };
}
