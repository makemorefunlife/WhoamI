/**
 * Survey v2 scorer — docs/v2/survey/03, 04, 05
 */
import {
  QUESTION_WEIGHT,
  SCORE_BASELINE,
  SURVEY_SCORING_MAP,
} from "@/lib/v2/survey/scoringMap";
import type {
  CurrentSelfProfile,
  LiteInterpretationHints,
  PrimaryAxisKey,
  PrimaryAxesScores,
  PrimaryConcern,
  ScoredQuestionId,
  SecondaryAxesScores,
  SecondaryAxisKey,
  SurveyAnswersInput,
  SurveyChoice,
} from "@/lib/v2/survey/types";
import {
  PRIMARY_AXIS_KEYS,
  SCORED_QUESTION_IDS,
  SECONDARY_AXIS_KEYS,
} from "@/lib/v2/survey/types";

const Q10_TO_CONCERN: Record<string, PrimaryConcern> = {
  "1": "money",
  "2": "relationship",
  "3": "health",
  "4": "career",
  "5": "other",
};

const CONCERN_EMPHASIS: Record<PrimaryConcern, string[]> = {
  money: ["stability", "practicality"],
  relationship: ["connection", "empathy"],
  health: ["energy_style", "resilience"],
  career: ["growth", "structure"],
  other: [],
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeChoice(raw: string | undefined): SurveyChoice | null {
  const c = raw?.trim().toUpperCase();
  if (c === "A" || c === "B" || c === "C" || c === "D") return c;
  return null;
}

function zeroPrimaryDeltas(): Record<PrimaryAxisKey, number> {
  return Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((k) => [k, 0]),
  ) as Record<PrimaryAxisKey, number>;
}

function zeroSecondaryDeltas(): Record<SecondaryAxisKey, number> {
  return Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k) => [k, 0]),
  ) as Record<SecondaryAxisKey, number>;
}

function applyDeltas(
  target: Record<string, number>,
  deltas: Partial<Record<string, number>> | undefined,
  weight: number,
) {
  if (!deltas) return;
  for (const [key, delta] of Object.entries(deltas)) {
    if (typeof delta !== "number") continue;
    target[key] = (target[key] ?? 0) + delta * weight;
  }
}

function finalizeAxes(
  raw: Record<string, number>,
  keys: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of keys) {
    out[key] = clampScore(SCORE_BASELINE + (raw[key] ?? 0));
  }
  return out;
}

export function parsePrimaryConcern(
  q10: string | undefined,
): PrimaryConcern | null {
  const trimmed = q10?.trim();
  if (!trimmed) return null;
  if (Q10_TO_CONCERN[trimmed]) return Q10_TO_CONCERN[trimmed];
  const lower = trimmed.toLowerCase();
  const allowed: PrimaryConcern[] = [
    "money",
    "relationship",
    "health",
    "career",
    "other",
  ];
  return allowed.includes(lower as PrimaryConcern)
    ? (lower as PrimaryConcern)
    : null;
}

export type ScoreSurveyOptions = {
  completedAt?: string;
  completionTimeSeconds?: number | null;
};

/**
 * Q1~Q9 → Current Self Profile (docs/v2/survey/04_Survey_Output_Schema.md)
 */
export function scoreSurveyAnswers(
  answers: SurveyAnswersInput,
  options: ScoreSurveyOptions = {},
): CurrentSelfProfile {
  const primaryRaw = zeroPrimaryDeltas();
  const secondaryRaw = zeroSecondaryDeltas();

  for (const qId of SCORED_QUESTION_IDS) {
    const choice = normalizeChoice(answers[qId]);
    if (!choice) continue;

    const rule = SURVEY_SCORING_MAP[qId as ScoredQuestionId]?.[choice];
    if (!rule) continue;

    const weight = QUESTION_WEIGHT[qId as ScoredQuestionId];
    applyDeltas(primaryRaw, rule.primary, weight);
    applyDeltas(secondaryRaw, rule.secondary, weight);
  }

  return {
    profile_type: "current_self",
    primary_axes: finalizeAxes(
      primaryRaw,
      PRIMARY_AXIS_KEYS,
    ) as PrimaryAxesScores,
    secondary_axes: finalizeAxes(
      secondaryRaw,
      SECONDARY_AXIS_KEYS,
    ) as SecondaryAxesScores,
    personalization: {
      primary_concern: parsePrimaryConcern(answers.q10),
    },
    meta: {
      survey_version: "v2",
      completed_at: options.completedAt ?? new Date().toISOString(),
      completion_time_seconds: options.completionTimeSeconds ?? null,
    },
  };
}

/** docs/v2/survey/06_Survey_Lite_Interpretation.md */
export function buildLiteInterpretationHints(
  profile: CurrentSelfProfile,
): LiteInterpretationHints {
  const sorted = [...PRIMARY_AXIS_KEYS]
    .map((key) => ({ key, score: profile.primary_axes[key] }))
    .sort((a, b) => b.score - a.score);

  const dominant_axes = sorted.slice(0, 2);
  const growth_edge_axis = sorted[sorted.length - 1] ?? null;

  const concern = profile.personalization.primary_concern;
  const concern_emphasis_axes = concern
    ? CONCERN_EMPHASIS[concern]
    : [];

  return {
    dominant_axes,
    growth_edge_axis,
    primary_concern: concern,
    concern_emphasis_axes,
  };
}

export function toRadarChartData(
  profile: CurrentSelfProfile,
): PrimaryAxesScores {
  return { ...profile.primary_axes };
}
