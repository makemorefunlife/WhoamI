/**
 * Domain 7-Scene Story Planner Types
 *
 * Defines the structured planning slot contract for the 7-scene Story Planner.
 * Story Planners only sequence canonical meanings into structured 4-beat scenes
 * (Recognition -> Translation -> Reframing -> Action) without recalculating
 * Saju, Survey, or Lens logic, and without authoring final narrative prose.
 */

import type {
  DomainPairLensId,
} from "../../personCore/pairContextEngine/types";
import type {
  DomainLensEvaluation,
  DomainLensId,
  LensConfidenceLevel,
  LensDirectionalityEvaluation,
  LensSajuEvidenceItem,
  LensTensionLevel,
} from "./types";
import type { CanonicalMeaningPacket } from "./canonicalPackets";

export type DomainStorySceneNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StoryBeatRecognitionSlot = {
  canonical_meaning_ids: string[];
  observable_contrast_facts: string[];
  evidence_refs: LensSajuEvidenceItem[];
  required_v1_assets: string[];
  observed_scene_focus: string;
};

export type StoryBeatTranslationSlot = {
  mechanism_ids: string[];
  saju_source_attribution: string[];
  survey_axis_attribution: string[];
  directionality: LensDirectionalityEvaluation;
  tension_level: LensTensionLevel;
};

export type StoryBeatReframingSlot = {
  protected_meaning: string;
  gift_to_cost_relationship: string;
  prohibited_generic_interpretations: string[];
  allowed_themes: string[];
};

export type StoryBeatActionSlot = {
  prescription_id: string;
  prescription_keys: string[];
  script_assets: {
    title: string;
    script_template_id?: string;
    category: string;
  }[];
  role_rules: string[];
  behavioral_assets: string[];
};

export type StoryBeats = {
  recognition: StoryBeatRecognitionSlot;
  translation: StoryBeatTranslationSlot;
  reframing: StoryBeatReframingSlot;
  action: StoryBeatActionSlot;
};

export type DomainStoryScene = {
  scene_number: DomainStorySceneNumber;
  scene_id: string;
  title_ko: string;
  title_en: string;
  primary_lens_id: DomainLensId;
  contributing_lens_ids: DomainLensId[];
  canonical_meaning_id: string | null;
  canonical_packet: CanonicalMeaningPacket | null;
  confidence: LensConfidenceLevel;
  directionality: LensDirectionalityEvaluation;
  is_abstaining: boolean;
  abstain_reason?: "birth_time_unknown" | "insufficient_evidence" | "neutral_baseline";
  beats: StoryBeats;
};

export type DomainStoryPlan = {
  schema_version: "domain_7_scene_story_plan_v1";
  domain: DomainPairLensId;
  parties: {
    a_name: string;
    b_name: string;
    a_role_label?: string;
    b_role_label?: string;
  };
  overall_confidence: LensConfidenceLevel;
  birth_time_unknown_a: boolean;
  birth_time_unknown_b: boolean;
  scenes: [
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene,
    DomainStoryScene
  ];
  grounding_summary: {
    total_scenes: 7;
    high_confidence_count: number;
    abstaining_count: number;
    dominant_element_dynamic: string;
    primary_tension_scene_id?: string;
    primary_synergy_scene_id?: string;
  };
  evidence_boundary: {
    allowed_synthesis_bullet_points: string[];
    strict_prohibitions: string[];
  };
};
