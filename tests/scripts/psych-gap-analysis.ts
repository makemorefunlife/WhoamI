import { scoreSurveyAnswers } from "../../lib/v2/survey/scorer";
import {
  buildPsychMatchResult,
  psychMatchAxisKoLabel,
} from "../../lib/relationship/psychMatch";

const sera = {
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
const chang = {
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

const match = buildPsychMatchResult({
  profileA: scoreSurveyAnswers(sera),
  profileB: scoreSurveyAnswers(chang),
});

const gaps = [...match.axis_results].sort((a, b) => b.gap - a.gap);
console.log("=== Sera / 창창 (실제 설문 답) ===");
for (const row of gaps) {
  console.log(
    `${psychMatchAxisKoLabel(row.axis_key).padEnd(8)} A=${row.score_a} B=${row.score_b} gap=${row.gap} (${row.match_type})`,
  );
}
const avg = gaps.reduce((s, r) => s + r.gap, 0) / gaps.length;
console.log(`평균 격차: ${avg.toFixed(1)}`);
console.log(`gap<12 (색 띠 없음): ${gaps.filter((r) => r.gap < 12).length}축`);
console.log(`gap>=20 (유사/보완 경계): ${gaps.filter((r) => r.gap >= 20).length}축`);
console.log(`gap>50 (긴장): ${gaps.filter((r) => r.gap > 50).length}축`);
