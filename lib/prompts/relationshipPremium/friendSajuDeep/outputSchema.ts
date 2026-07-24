/**
 * Friend / Social saju-deep — Round 1 narrative overlay schema.
 * Does NOT replace friend_social_deep rule-only FriendReport.
 * LLM explain layer only; CE judgments stay in Friendship Context Engine (020).
 */

export const FRIEND_SAJU_DEEP_FORMAT = "friend_saju_deep_v1_round1" as const;

export type FriendSajuDeepAdviceTip = {
  action_title: string;
  saju_reason: string;
  real_speech_tip: string;
  real_life_example: string;
  target_user?: string;
};

export type FriendSajuDeepReport = {
  format?: typeof FRIEND_SAJU_DEEP_FORMAT;
  meta?: {
    generated_at?: string;
    locale?: string;
    narrative_guards?: string[];
    narrative_guards_mode?: string;
    domain?: "friend";
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
  section_4_friend_frames?: {
    friendship_gap_signal?: {
      a_body?: string;
      b_body?: string;
      match_note?: string;
    };
  };
  section_5_action?: {
    advice_for_a?: FriendSajuDeepAdviceTip[];
    advice_for_b?: FriendSajuDeepAdviceTip[];
    together?: string;
    together_starter?: string;
  };
};

export function isFriendSajuDeepReport(v: unknown): v is FriendSajuDeepReport {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.section_5_action != null ||
    o.section_2_nature != null ||
    o.section_4_friend_frames != null
  );
}
