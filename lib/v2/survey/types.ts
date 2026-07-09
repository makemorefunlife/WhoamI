/** Human Framework — docs/v2/framework/10_Human_Framework.md */

export const PRIMARY_AXIS_KEYS = [
  "autonomy",
  "connection",
  "stability",
  "growth",
  "structure",
  "adaptability",
] as const;

export type PrimaryAxisKey = (typeof PRIMARY_AXIS_KEYS)[number];

export const SECONDARY_AXIS_KEYS = [
  "stimulation",
  "self_control",
  "practicality",
  "structure",
  "empathy",
  "conflict_style",
  "resilience",
  "recognition",
  "energy_style",
  "thinking_style",
  "decision_style",
] as const;

export type SecondaryAxisKey = (typeof SECONDARY_AXIS_KEYS)[number];

export const SCORED_QUESTION_IDS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
] as const;

export type ScoredQuestionId = (typeof SCORED_QUESTION_IDS)[number];

export type SurveyChoice = "A" | "B" | "C" | "D";

export type PrimaryConcern =
  | "money"
  | "relationship"
  | "health"
  | "career"
  | "other";

/** Q1~Q9: A–D. Q10: "1"~"5" (docs/v2/survey/02) */
export type SurveyAnswersInput = Partial<
  Record<ScoredQuestionId | "q10", string>
>;

export type AxisDeltas = {
  primary?: Partial<Record<PrimaryAxisKey, number>>;
  secondary?: Partial<Record<SecondaryAxisKey, number>>;
};

export type PrimaryAxesScores = Record<PrimaryAxisKey, number>;
export type SecondaryAxesScores = Record<SecondaryAxisKey, number>;

export type CurrentSelfProfile = {
  profile_type: "current_self";
  primary_axes: PrimaryAxesScores;
  secondary_axes: SecondaryAxesScores;
  personalization: {
    primary_concern: PrimaryConcern | null;
  };
  meta: {
    survey_version: "v2";
    completed_at: string;
    completion_time_seconds: number | null;
  };
};

export type LiteInterpretationHints = {
  dominant_axes: { key: PrimaryAxisKey; score: number }[];
  growth_edge_axis: { key: PrimaryAxisKey; score: number } | null;
  primary_concern: PrimaryConcern | null;
  concern_emphasis_axes: string[];
};
