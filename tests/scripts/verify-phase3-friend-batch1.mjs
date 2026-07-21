/**
 * Friend Phase 3 Batch 1 검증 — resolveFriendSignatureClause, resolveFriendVibeAxisNotes.
 * 실행: npx tsx tests/scripts/verify-phase3-friend-batch1.mjs
 */
import {
  resolveFriendSignatureClause,
  resolveFriendVibeAxisNotes,
} from "../../lib/relationship/friend/friendPsychFit.ts";

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

console.log("=== psych 없음 -> null ===");
console.log("signature:", resolveFriendSignatureClause(null, null, "ko-KR"));
console.log("vibeNotes:", resolveFriendVibeAxisNotes(null, null, "ko-KR"));

console.log("\n=== 외향에너지 격차 큼 (다른 콤비) ===");
console.log(
  resolveFriendSignatureClause(
    fabricatePsych({ energy_style: 85 }),
    fabricatePsych({ energy_style: 20 }),
    "ko-KR",
  ),
);

console.log("\n=== 외향에너지 격차 작음 (같은 주파수) ===");
console.log(
  resolveFriendSignatureClause(
    fabricatePsych({ energy_style: 55 }),
    fabricatePsych({ energy_style: 50 }),
    "ko-KR",
  ),
);

console.log("\n=== vibe axis notes — 관계공감 高, 자극추구 高, 갈등직면성 격차 大 ===");
const notesHigh = resolveFriendVibeAxisNotes(
  fabricatePsych({ empathy: 80, stimulation: 80, conflict_style: 90 }),
  fabricatePsych({ empathy: 75, stimulation: 75, conflict_style: 10 }),
  "ko-KR",
);
console.log(JSON.stringify(notesHigh, null, 2));

console.log("\n=== vibe axis notes — 관계공감 低, 자극추구 低, 갈등직면성 격차 小 ===");
const notesLow = resolveFriendVibeAxisNotes(
  fabricatePsych({ empathy: 25, stimulation: 20, conflict_style: 50 }),
  fabricatePsych({ empathy: 30, stimulation: 25, conflict_style: 45 }),
  "ko-KR",
);
console.log(JSON.stringify(notesLow, null, 2));

console.log(
  "\n검증:",
  notesHigh.connection_note !== null &&
    notesHigh.banter_note !== null &&
    notesHigh.risk_note !== null &&
    notesLow.connection_note !== null &&
    notesLow.banter_note !== null &&
    notesLow.risk_note === null
    ? "PASS"
    : "FAIL",
);
