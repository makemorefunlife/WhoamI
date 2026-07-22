/**
 * Friend Phase 3-4 Batch 4 검증 — resolveJealousyGuardNote, resolveReconciliationScript,
 * buildFriendPrescriptions의 conflict_timeout_protocol 상시 포함 여부.
 * 실행: npx tsx tests/scripts/verify-phase3-4-friend-batch4.mjs
 */
import {
  resolveJealousyGuardNote,
  resolveReconciliationScript,
} from "../../lib/relationship/friend/friendPsychFit.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function fabricatePsych(axisOverrides = {}) {
  const base = {
    stimulation: 50,
    self_control: 50,
    practicality: 50,
    structure: 50,
    empathy: 50,
    conflict_style: 50,
    resilience: 50,
    recognition: 50,
    energy_style: 50,
    thinking_style: 50,
    decision_style: 50,
  };
  return { secondary_axes: { ...base, ...axisOverrides } };
}

function counts(overrides = {}) {
  return { 겁재: 0, ...overrides };
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

console.log("=== 질투방지 — psych 없음 -> null ===");
const noJealousy = resolveJealousyGuardNote(counts({ 겁재: 3 }), null, "Alex", "ko-KR");
console.log(noJealousy);

console.log("\n=== 질투방지 — 겁재 낮음 -> null ===");
const lowGyeopjae = resolveJealousyGuardNote(
  counts({ 겁재: 0 }),
  fabricatePsych({ recognition: 80, practicality: 80 }),
  "Alex",
  "ko-KR",
);
console.log(lowGyeopjae);

console.log("\n=== 질투방지 — 겁재 高 + 11축 高 -> 문구 ===");
const jealousyHit = resolveJealousyGuardNote(
  counts({ 겁재: 3 }),
  fabricatePsych({ recognition: 80, practicality: 70 }),
  "Alex",
  "ko-KR",
);
console.log(jealousyHit);

console.log("\n=== 화해스위치 — psych 없음 -> null ===");
console.log(resolveReconciliationScript(null, "Alex", "ko-KR"));

console.log("\n=== 화해스위치 — 관계공감/인정욕구 우세 -> 인정형 ===");
const recogScript = resolveReconciliationScript(
  fabricatePsych({ empathy: 80, recognition: 80, practicality: 30 }),
  "Alex",
  "ko-KR",
);
console.log(recogScript);

console.log("\n=== 화해스위치 — 현실실리 우세 -> 실속형 ===");
const practicalScript = resolveReconciliationScript(
  fabricatePsych({ empathy: 30, recognition: 30, practicality: 80 }),
  "Alex",
  "ko-KR",
);
console.log(practicalScript);

console.log("\n=== e2e — buildFriendReport 전체 파이프라인 ===");
const report = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  psychMasterA: fabricatePsych({ recognition: 80, practicality: 70, empathy: 80 }),
  psychMasterB: fabricatePsych({ recognition: 30, practicality: 80 }),
  pairFriendship: {
    johu_gap: { heat_gap: 10, moisture_gap: 10, temperature_mismatch: false, band_a: "neutral", band_b: "neutral" },
    energy_drain_index: 10,
    energy_drain_band: "low",
  },
  locale: "ko-KR",
});
console.log("section_breakup_guide:", JSON.stringify(report.friend.section_breakup_guide, null, 2));
console.log(
  "section_de_escalation.upset_nickname/reconciliation_script:",
  report.friend.section_de_escalation.upset_nickname,
  report.friend.section_de_escalation.reconciliation_script,
);
const topics = report.meta.prescription_friendship?.items.map((i) => i.topic) ?? [];
console.log("prescription topics:", topics);

const pass =
  noJealousy === null &&
  lowGyeopjae === null &&
  typeof jealousyHit === "string" &&
  resolveReconciliationScript(null, "Alex", "ko-KR") === null &&
  recogScript.includes("최고야") &&
  practicalScript.includes("기프티콘") &&
  typeof report.friend.section_de_escalation.upset_nickname === "string" &&
  topics.includes("conflict_timeout_protocol");

console.log("\n검증:", pass ? "PASS" : "FAIL");
if (!pass) process.exit(1);
