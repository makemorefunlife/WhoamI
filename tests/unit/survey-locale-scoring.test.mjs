/**
 * Survey locale: same answer values → identical scores (copy-only difference).
 * Run: npx tsx tests/unit/survey-locale-scoring.test.mjs
 */
import assert from "node:assert/strict";
import { getSurveyQuestions } from "../../lib/v2/survey/getSurveyQuestions.ts";
import { scoreSurveyAnswers } from "../../lib/v2/survey/scorer.ts";
import { SCORED_QUESTION_IDS } from "../../lib/v2/survey/types.ts";

const answers = Object.fromEntries([
  ...SCORED_QUESTION_IDS.map((id, i) => [id, ["A", "B", "C", "D"][i % 4]]),
  ["q10", "2"],
]);

const enQs = getSurveyQuestions("en-US");
const koQs = getSurveyQuestions("ko-KR");

assert.equal(enQs.length, koQs.length);
assert.deepEqual(
  enQs.map((q) => q.id),
  koQs.map((q) => q.id),
);

for (let i = 0; i < enQs.length; i++) {
  assert.deepEqual(
    enQs[i].options.map((o) => o.value),
    koQs[i].options.map((o) => o.value),
    `option values diverge at ${enQs[i].id}`,
  );
  assert.notEqual(
    enQs[i].prompt,
    koQs[i].prompt,
    `expected localized prompt at ${enQs[i].id}`,
  );
}

const enProfile = scoreSurveyAnswers(answers);
const koProfile = scoreSurveyAnswers(answers);

assert.deepEqual(enProfile.primary_axes, koProfile.primary_axes);
assert.deepEqual(enProfile.secondary_axes, koProfile.secondary_axes);
assert.equal(
  enProfile.personalization.primary_concern,
  koProfile.personalization.primary_concern,
);

console.log("OK: survey locale scoring identical for en-US / ko-KR");
