import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import {
  SURVEY_SCORING_MAP,
  QUESTION_WEIGHT,
} from "@/lib/v2/survey/scoringMap";
import { SCORED_QUESTION_IDS } from "@/lib/v2/survey/types";

const A = {
  q1: "A",
  q2: "C",
  q3: "D",
  q4: "B",
  q5: "D",
  q6: "A",
  q7: "B",
  q8: "C",
  q9: "A",
  q10: "5",
};
const B = {
  q1: "A",
  q2: "D",
  q3: "D",
  q4: "C",
  q5: "C",
  q6: "B",
  q7: "C",
  q8: "D",
  q9: "D",
  q10: "3",
};
const embeddedA = {
  empathy: 50,
  structure: 54,
  resilience: 52,
  recognition: 49,
  stimulation: 61,
  energy_style: 51,
  practicality: 54,
  self_control: 50,
  conflict_style: 48,
  decision_style: 60,
  thinking_style: 52,
};
const embeddedB = {
  empathy: 58,
  structure: 52,
  resilience: 50,
  recognition: 53,
  stimulation: 52,
  energy_style: 47,
  practicality: 50,
  self_control: 51,
  conflict_style: 53,
  decision_style: 55,
  thinking_style: 55,
};

const scoredA = scoreSurveyAnswers(A);
const scoredB = scoreSurveyAnswers(B);

function axisContributors(
  answers: Record<string, string>,
  axis: string,
) {
  const contribs: Array<{
    q: string;
    choice: string;
    delta: number;
    raw: number;
    weight: number;
  }> = [];
  for (const qId of SCORED_QUESTION_IDS) {
    const choice = answers[qId]?.trim().toUpperCase();
    const rule = SURVEY_SCORING_MAP[qId]?.[choice as "A" | "B" | "C" | "D"];
    const sec = rule?.secondary?.[axis as keyof typeof rule.secondary];
    if (typeof sec === "number") {
      const w = QUESTION_WEIGHT[qId];
      contribs.push({ q: qId, choice, delta: sec * w, raw: sec, weight: w });
    }
  }
  return contribs;
}

const focus = ["self_control", "structure", "practicality", "stimulation"] as const;
const out: Record<string, unknown> = {
  A: {},
  B: {},
  gaps: {},
  embedded_vs_rescored: { A: {}, B: {} },
};

for (const axis of focus) {
  (out.A as Record<string, unknown>)[axis] = {
    score_embedded: embeddedA[axis],
    score_rescored: scoredA.secondary_axes[axis],
    contributors: axisContributors(A, axis),
  };
  (out.B as Record<string, unknown>)[axis] = {
    score_embedded: embeddedB[axis],
    score_rescored: scoredB.secondary_axes[axis],
    contributors: axisContributors(B, axis),
  };
  (out.gaps as Record<string, unknown>)[axis] = Math.abs(
    embeddedA[axis] - embeddedB[axis],
  );
}
for (const axis of focus) {
  (out.embedded_vs_rescored as { A: Record<string, boolean>; B: Record<string, boolean> }).A[axis] =
    embeddedA[axis] === scoredA.secondary_axes[axis];
  (out.embedded_vs_rescored as { A: Record<string, boolean>; B: Record<string, boolean> }).B[axis] =
    embeddedB[axis] === scoredB.secondary_axes[axis];
}

console.log(JSON.stringify(out, null, 2));
