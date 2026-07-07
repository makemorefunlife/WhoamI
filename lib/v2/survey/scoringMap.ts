/**
 * Source: docs/v2/survey/03_Survey_Scoring_Rules.md
 * Do not edit by hand unless the doc changes — regenerate from SSOT.
 */
import type { AxisDeltas, ScoredQuestionId, SurveyChoice } from "@/lib/v2/survey/types";

export const QUESTION_WEIGHT: Record<ScoredQuestionId, number> = {
  q1: 1,
  q2: 1,
  q3: 1,
  q4: 1,
  q5: 2,
  q6: 1,
  q7: 1,
  q8: 1,
  q9: 1,
};

export const SCORE_BASELINE = 50;

export const SURVEY_SCORING_MAP: Record<
  ScoredQuestionId,
  Record<SurveyChoice, AxisDeltas>
> = {
  q1: {
    A: {
      primary: { autonomy: 2, growth: 1, control: -1 },
      secondary: { stimulation: 2, decision_style: 2, self_control: -1 },
    },
    B: {
      primary: { stability: 2, control: 1 },
      secondary: { practicality: 3, thinking_style: 2, self_control: 1 },
    },
    C: {
      primary: { stability: 2, control: 2 },
      secondary: { structure: 2, practicality: 2, self_control: 2 },
    },
    D: {
      primary: { control: 3, stability: 1 },
      secondary: { self_control: 3, structure: 1, stimulation: -1 },
    },
  },
  q2: {
    A: {
      primary: { connection: 3, control: -1 },
      secondary: { empathy: 3, conflict_style: -1, recognition: 1 },
    },
    B: {
      primary: { control: 2, connection: -1 },
      secondary: { conflict_style: 3, thinking_style: 2, empathy: -1 },
    },
    C: {
      primary: { connection: 1, adaptability: 1 },
      secondary: { conflict_style: -2, self_control: 1, energy_style: 1 },
    },
    D: {
      primary: { control: 2, stability: 1 },
      secondary: { self_control: 2, conflict_style: 1, empathy: -1 },
    },
  },
  q3: {
    A: {
      primary: { stability: -1, control: -1 },
      secondary: { resilience: -3, recognition: 2, thinking_style: 1 },
    },
    B: {
      primary: { control: 2, adaptability: 1 },
      secondary: { thinking_style: 3, resilience: 2, structure: 1 },
    },
    C: {
      primary: { connection: 3 },
      secondary: { empathy: 2, energy_style: 2, resilience: 1 },
    },
    D: {
      primary: { autonomy: 2, stability: 1 },
      secondary: { decision_style: 3, resilience: 2, recognition: -1 },
    },
  },
  q4: {
    A: {
      primary: { stability: 1, adaptability: -2 },
      secondary: { structure: 2, resilience: -2 },
    },
    B: {
      primary: { growth: 3, adaptability: 3 },
      secondary: { stimulation: 3, resilience: 2, decision_style: 1 },
    },
    C: {
      primary: { control: 2, adaptability: 2 },
      secondary: { structure: 2, thinking_style: 2, resilience: 2 },
    },
    D: {
      primary: { stability: 2, adaptability: -3 },
      secondary: { self_control: 1, structure: 1, resilience: -2 },
    },
  },
  q5: {
    A: {
      primary: { autonomy: 3 },
      secondary: { decision_style: 3, stimulation: 1 },
    },
    B: {
      primary: { stability: 3, control: 1 },
      secondary: { practicality: 3, structure: 2 },
    },
    C: {
      primary: { connection: 3 },
      secondary: { empathy: 3, recognition: 1 },
    },
    D: {
      primary: { growth: 3, autonomy: 1 },
      secondary: { stimulation: 2, decision_style: 2, thinking_style: 1 },
    },
  },
  q6: {
    A: {
      primary: { control: 2, growth: 1 },
      secondary: { structure: 2, practicality: 1 },
    },
    B: {
      primary: { control: 2, connection: -1 },
      secondary: { conflict_style: 2, thinking_style: 1 },
    },
    C: {
      primary: { growth: 2, control: 1 },
      secondary: { decision_style: 2, conflict_style: 1 },
    },
    D: {
      primary: { stability: 1, adaptability: 2 },
      secondary: { practicality: 2, stimulation: 1 },
    },
  },
  q7: {
    A: {
      primary: { autonomy: 3 },
      secondary: { decision_style: 3, stimulation: 1 },
    },
    B: {
      primary: { stability: 3, control: 2 },
      secondary: { practicality: 3, structure: 2 },
    },
    C: {
      primary: { connection: 3 },
      secondary: { empathy: 3, recognition: 1 },
    },
    D: {
      primary: { growth: 2, control: 2 },
      secondary: { thinking_style: 3, structure: 2, self_control: 1 },
    },
  },
  q8: {
    A: {
      primary: { stability: 2, control: 1 },
      secondary: { resilience: 2, energy_style: 2 },
    },
    B: {
      primary: { stability: 2 },
      secondary: { energy_style: 3, self_control: 1 },
    },
    C: {
      primary: { stability: -2, growth: -1 },
      secondary: { energy_style: -3, resilience: -2 },
    },
    D: {
      primary: { control: -1, stability: -1 },
      secondary: { thinking_style: 2, resilience: -2, recognition: 1 },
    },
  },
  q9: {
    A: {
      primary: { connection: 2, growth: 1 },
      secondary: { energy_style: 3, stimulation: 2 },
    },
    B: {
      primary: { autonomy: 2, stability: 1 },
      secondary: { energy_style: 3, decision_style: 2 },
    },
    C: {
      primary: { control: 3, stability: -1 },
      secondary: {
        structure: 3,
        self_control: 2,
        decision_style: 2,
        resilience: -1,
      },
    },
    D: {
      primary: { stability: -2, growth: -2 },
      secondary: { energy_style: -3, resilience: -2 },
    },
  },
};
