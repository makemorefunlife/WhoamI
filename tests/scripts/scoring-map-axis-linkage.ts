import {
  SURVEY_SCORING_MAP,
  QUESTION_WEIGHT,
} from "@/lib/v2/survey/scoringMap";
import {
  SCORED_QUESTION_IDS,
  SECONDARY_AXIS_KEYS,
  type ScoredQuestionId,
  type SecondaryAxisKey,
  type SurveyChoice,
} from "@/lib/v2/survey/types";

const CHOICES = ["A", "B", "C", "D"] as const satisfies readonly SurveyChoice[];

const linkedQs = Object.fromEntries(
  SECONDARY_AXIS_KEYS.map((k) => [k, [] as ScoredQuestionId[]]),
) as Record<SecondaryAxisKey, ScoredQuestionId[]>;
for (const qId of SCORED_QUESTION_IDS) {
  const touches = new Set<string>();
  for (const c of CHOICES) {
    const sec = SURVEY_SCORING_MAP[qId][c].secondary;
    if (!sec) continue;
    for (const axis of SECONDARY_AXIS_KEYS) {
      if (sec[axis]) touches.add(axis);
    }
  }
  for (const axis of touches) linkedQs[axis as SecondaryAxisKey].push(qId);
}

console.log("=== 1. linked question count (q1-q9) ===");
for (const axis of SECONDARY_AXIS_KEYS) {
  console.log(
    `${axis}: ${linkedQs[axis].length} ??[${linkedQs[axis].join(", ")}]`,
  );
}

function deltasForAxisOnQuestion(qId: ScoredQuestionId, axis: SecondaryAxisKey) {
  const w = QUESTION_WEIGHT[qId];
  return CHOICES.map((c) => {
    const raw = SURVEY_SCORING_MAP[qId][c].secondary?.[axis] ?? 0;
    return { choice: c, weighted: raw * w };
  });
}

console.log("\n=== 2. axes with <=2 linked questions ===");
for (const axis of SECONDARY_AXIS_KEYS) {
  const qs = linkedQs[axis];
  if (qs.length > 2) continue;
  const perQ = qs.map((q) => ({
    q,
    deltas: deltasForAxisOnQuestion(q as ScoredQuestionId, axis),
  }));

  function combos(idx: number, acc: number): number[] {
    if (idx === qs.length) return [acc];
    const q = qs[idx] as ScoredQuestionId;
    const outs: number[] = [];
    for (const c of CHOICES) {
      const raw = SURVEY_SCORING_MAP[q][c].secondary?.[axis] ?? 0;
      outs.push(...combos(idx + 1, acc + raw * QUESTION_WEIGHT[q]));
    }
    return outs;
  }
  const sums = combos(0, 0);
  const unique = [...new Set(sums)].sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      axis,
      linked_questions: qs,
      perQ,
      combo_sums_unique: unique,
      all_combos_sum_zero: sums.every((s) => s === 0),
      some_combo_sum_zero: sums.some((s) => s === 0),
      all_combos_identical: unique.length === 1,
      total_combos: sums.length,
    }),
  );
}

console.log("\n=== 3. full q1-q9 net delta distribution per axis ===");
const struct: Array<{
  axis: string;
  linked_q_count: number;
  min_net_delta: number;
  max_net_delta: number;
  zero_net_surveys: number;
  zero_net_rate: number;
  unique_net_deltas: number;
}> = [];

for (const axis of SECONDARY_AXIS_KEYS) {
  const qs = linkedQs[axis];
  let min = Infinity;
  let max = -Infinity;
  let zeroCount = 0;
  let total = 0;
  const counts = new Map<number, number>();

  function walk(i: number, acc: number) {
    if (i === SCORED_QUESTION_IDS.length) {
      total++;
      if (acc === 0) zeroCount++;
      min = Math.min(min, acc);
      max = Math.max(max, acc);
      counts.set(acc, (counts.get(acc) ?? 0) + 1);
      return;
    }
    const q = SCORED_QUESTION_IDS[i];
    for (const c of CHOICES) {
      const raw = SURVEY_SCORING_MAP[q][c].secondary?.[axis] ?? 0;
      walk(i + 1, acc + raw * QUESTION_WEIGHT[q]);
    }
  }
  walk(0, 0);

  struct.push({
    axis,
    linked_q_count: qs.length,
    min_net_delta: min,
    max_net_delta: max,
    zero_net_surveys: zeroCount,
    zero_net_rate: Number((zeroCount / total).toFixed(4)),
    unique_net_deltas: counts.size,
  });
}
struct.sort((a, b) => a.zero_net_rate - b.zero_net_rate);
console.log(JSON.stringify(struct, null, 2));

const B: Partial<Record<ScoredQuestionId, SurveyChoice>> = {
  q1: "A",
  q2: "D",
  q3: "D",
  q4: "C",
  q5: "C",
  q6: "B",
  q7: "C",
  q8: "D",
  q9: "D",
};
let pracB = 0;
for (const q of SCORED_QUESTION_IDS) {
  const c: SurveyChoice = B[q] ?? "A";
  pracB +=
    (SURVEY_SCORING_MAP[q][c].secondary?.practicality ?? 0) *
    QUESTION_WEIGHT[q];
}
console.log("\nB practicality net delta:", pracB);
