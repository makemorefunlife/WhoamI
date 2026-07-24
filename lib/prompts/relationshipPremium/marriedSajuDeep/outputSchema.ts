/**
 * Married Couples saju-deep — Round 1 narrative overlay schema.
 * Does NOT replace cohabitation_household_deep_v1 rule-only MarriageReportBody.
 * LLM explain layer only; CE judgments stay in marriage Context Engine.
 */

export const MARRIED_SAJU_DEEP_FORMAT = "married_saju_deep_v1_round1" as const;

export type MarriedSajuDeepAdviceTip = {
  action_title: string;
  saju_reason: string;
  real_speech_tip: string;
  real_life_example: string;
  target_user?: string;
};

export type MarriedSajuDeepReport = {
  format?: typeof MARRIED_SAJU_DEEP_FORMAT;
  meta?: {
    generated_at?: string;
    locale?: string;
    narrative_guards?: string[];
    narrative_guards_mode?: string;
    domain?: "married" | "cohabitation";
  };
  section_2_nature?: {
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
      a: string;
      b: string;
    }>;
  };
  section_4_household_frames?: {
    role_balance_signal?: {
      a_body?: string;
      b_body?: string;
      match_note?: string;
    };
  };
  section_5_action?: {
    advice_for_a?: MarriedSajuDeepAdviceTip[];
    advice_for_b?: MarriedSajuDeepAdviceTip[];
    together?: string;
    together_starter?: string;
  };
};

export function isMarriedSajuDeepReport(v: unknown): v is MarriedSajuDeepReport {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  // Round 1: accept partial narrative overlays (advice section sufficient).
  return (
    o.section_5_action != null ||
    o.section_2_nature != null ||
    o.section_4_household_frames != null
  );
}
