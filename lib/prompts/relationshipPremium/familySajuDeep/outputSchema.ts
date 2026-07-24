/**
 * Family Parent–Child saju-deep — Round 1 narrative overlay schema.
 * Does NOT replace family_parent_child_deep rule-only FamilyParentReport.
 * LLM explain layer only; CE judgments stay in Family Context Engine.
 */

export const FAMILY_SAJU_DEEP_FORMAT = "family_saju_deep_v1_round1" as const;

export type FamilySajuDeepAdviceTip = {
  action_title: string;
  saju_reason: string;
  real_speech_tip: string;
  real_life_example: string;
  target_user?: string;
};

export type FamilySajuDeepReport = {
  format?: typeof FAMILY_SAJU_DEEP_FORMAT;
  meta?: {
    generated_at?: string;
    locale?: string;
    narrative_guards?: string[];
    narrative_guards_mode?: string;
    domain?: "family";
  };
  section_2_nature?: {
    parent_nature?: {
      first_person_voice?: string;
      description?: string;
    };
    child_nature?: {
      first_person_voice?: string;
      description?: string;
    };
    a_nature?: {
      first_person_voice?: string;
      description?: string;
    };
    b_nature?: {
      first_person_voice?: string;
      description?: string;
    };
    comparison_table?: Array<{
      aspect: string;
      a?: string;
      b?: string;
      parent?: string;
      child?: string;
    }>;
  };
  section_4_family_frames?: {
    generation_gap_signal?: {
      parent_body?: string;
      child_body?: string;
      a_body?: string;
      b_body?: string;
      match_note?: string;
    };
  };
  section_5_action?: {
    advice_for_parent?: FamilySajuDeepAdviceTip[];
    advice_for_child?: FamilySajuDeepAdviceTip[];
    advice_for_a?: FamilySajuDeepAdviceTip[];
    advice_for_b?: FamilySajuDeepAdviceTip[];
    together?: string;
    together_starter?: string;
  };
};

export function isFamilySajuDeepReport(v: unknown): v is FamilySajuDeepReport {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.section_5_action != null ||
    o.section_2_nature != null ||
    o.section_4_family_frames != null
  );
}
