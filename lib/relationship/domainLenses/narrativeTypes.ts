/**
 * Domain 7-Scene Narrative Composer Types & Schema
 *
 * Defines the contract for deterministic bilingual (KO/EN) narrative composition
 * across Friend, Work, Family Parent-Child, and Life Partner domains.
 *
 * Sourcing Flow:
 * CanonicalMeaningPacket -> DomainLens -> 7-Scene StoryPlanner -> NarrativeComposer -> Rendered Output
 */

import type { DomainPairLensId } from "../../personCore/pairContextEngine/types";
import type {
  DomainLensId,
  LensConfidenceLevel,
  LensDirectionalityEvaluation,
  LensTensionLevel,
} from "./types";
import type { DomainStorySceneNumber } from "./storyPlannerTypes";

export type NarrativeScriptItem = {
  category: string;
  title_ko: string;
  title_en: string;
  speaker: "A" | "B" | "BOTH";
  dialogue_ko: string;
  dialogue_en: string;
};

export type DomainNarrativeScene = {
  scene_number: DomainStorySceneNumber;
  scene_id: string;
  title_ko: string;
  title_en: string;
  primary_lens_id: DomainLensId;
  contributing_lens_ids: DomainLensId[];
  confidence: LensConfidenceLevel;
  is_abstaining: boolean;
  abstain_reason?: string;
  tension_level: LensTensionLevel;
  directionality: LensDirectionalityEvaluation;
  
  // 4-Beat Synthesized Narrative
  headline_ko: string;
  headline_en: string;
  recognition_ko: string;
  recognition_en: string;
  translation_ko: string;
  translation_en: string;
  reframing_ko: string;
  reframing_en: string;
  action_guidance_ko: string;
  action_guidance_en: string;
  
  // Action & Verbal Scripts
  scripts: NarrativeScriptItem[];
  role_rules_ko: string[];
  role_rules_en: string[];
  
  // Guardrails
  safety_guardrails: {
    prohibited_claims: string[];
    allowed_themes: string[];
  };
};

export type DomainNarrativeOverview = {
  headline_ko: string;
  headline_en: string;
  summary_ko: string;
  summary_en: string;
  core_vibe_badge_ko: string;
  core_vibe_badge_en: string;
};

export type DomainNarrativeActionPlaybook = {
  summary_ko: string;
  summary_en: string;
  golden_rules_ko: string[];
  golden_rules_en: string[];
};

export type DomainNarrativePlan = {
  schema_version: "domain_7_scene_narrative_v1";
  domain: DomainPairLensId;
  parties: {
    a_name: string;
    b_name: string;
    a_role_label?: string;
    b_role_label?: string;
  };
  overall_confidence: LensConfidenceLevel;
  overview: DomainNarrativeOverview;
  scenes: [
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene
  ];
  action_playbook: DomainNarrativeActionPlaybook;
  metadata: {
    total_scenes: 7;
    active_scenes_count: number;
    abstained_scenes_count: number;
    prohibited_claims_count: number;
  };
};
