/**
 * Business / Partnership saju-deep — Round 1 narrative overlay schema.
 * Does NOT replace work_colleague_deep rule-only WorkColleagueReport.
 * LLM explain layer only; CE judgments stay in Work Context Engine (022).
 */

export const BUSINESS_SAJU_DEEP_FORMAT = "business_saju_deep_v1_round1" as const;

export type BusinessSajuDeepAdviceTip = {
  action_title: string;
  saju_reason: string;
  real_speech_tip: string;
  real_life_example: string;
  target_user?: string;
};

export type BusinessSajuDeepReport = {
  format?: typeof BUSINESS_SAJU_DEEP_FORMAT;
  meta?: {
    generated_at?: string;
    locale?: string;
    narrative_guards?: string[];
    narrative_guards_mode?: string;
    domain?: "business";
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
      a?: string;
      b?: string;
    }>;
  };
  section_4_business_frames?: {
    role_gap_signal?: {
      a_body?: string;
      b_body?: string;
      match_note?: string;
    };
  };
  section_5_action?: {
    advice_for_a?: BusinessSajuDeepAdviceTip[];
    advice_for_b?: BusinessSajuDeepAdviceTip[];
    together?: string;
    together_starter?: string;
  };
};

export function isBusinessSajuDeepReport(
  v: unknown,
): v is BusinessSajuDeepReport {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.section_5_action != null ||
    o.section_2_nature != null ||
    o.section_4_business_frames != null
  );
}
