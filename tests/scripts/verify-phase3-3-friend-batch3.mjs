/**
 * Friend Phase 3-3 Batch 3 검증 — resolveTravelStyleSplit, resolveCounselingStyleForPerson,
 * resolveTreasurerConfirmNote.
 * 실행: npx tsx tests/scripts/verify-phase3-3-friend-batch3.mjs
 */
import {
  resolveTravelStyleSplit,
  resolveCounselingStyleForPerson,
  resolveTreasurerConfirmNote,
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

function counts(overrides = {}) {
  return { officer: 0, wealth: 0, food: 0, seal: 0, self: 0, ...overrides };
}

console.log("=== 여행동선 — psych 없음 -> null ===");
const noTravel = resolveTravelStyleSplit(null, null, "Alex", "Jordan", "ko-KR");
console.log(noTravel);

console.log("\n=== 여행동선 — 격차 大 (A가 계획파) ===");
const travelBig = resolveTravelStyleSplit(
  fabricatePsych({ structure: 80 }),
  fabricatePsych({ structure: 40 }),
  "Alex",
  "Jordan",
  "ko-KR",
);
console.log(travelBig);

console.log("\n=== 여행동선 — 격차 小 -> null ===");
const travelSmall = resolveTravelStyleSplit(
  fabricatePsych({ structure: 55 }),
  fabricatePsych({ structure: 50 }),
  "Alex",
  "Jordan",
  "ko-KR",
);
console.log(travelSmall);

console.log("\n=== F/T형 — psych 없음 -> null ===");
const noCounsel = resolveCounselingStyleForPerson(counts({ seal: 3 }), null, "ko-KR");
console.log(noCounsel);

console.log("\n=== F/T형 — F 우세 (인성+관계공감) ===");
const fType = resolveCounselingStyleForPerson(
  counts({ seal: 3 }),
  fabricatePsych({ empathy: 80, thinking_style: 30 }),
  "ko-KR",
);
console.log(fType);

console.log("\n=== F/T형 — T 우세 (관성+분석사고) ===");
const tType = resolveCounselingStyleForPerson(
  counts({ officer: 3 }),
  fabricatePsych({ thinking_style: 80, empathy: 30 }),
  "ko-KR",
);
console.log(tType);

console.log("\n=== F/T형 — balanced (동률) ===");
const balancedType = resolveCounselingStyleForPerson(
  counts({}),
  fabricatePsych({ empathy: 50, thinking_style: 50 }),
  "ko-KR",
);
console.log(balancedType);

console.log("\n=== 총무 확인문구 — psych 없음 -> null ===");
console.log(resolveTreasurerConfirmNote(null, "ko-KR"));

console.log("\n=== 총무 확인문구 — 高 (현실실리+계획구조화) ===");
console.log(resolveTreasurerConfirmNote(fabricatePsych({ practicality: 80, structure: 80 }), "ko-KR"));

console.log("\n=== 총무 확인문구 — 低 ===");
console.log(resolveTreasurerConfirmNote(fabricatePsych({ practicality: 20, structure: 20 }), "ko-KR"));

console.log("\n=== 총무 확인문구 — 중간대 -> null ===");
const midNote = resolveTreasurerConfirmNote(fabricatePsych({ practicality: 50, structure: 50 }), "ko-KR");
console.log(midNote);

console.log("\n=== en-US 로케일 확인 (Korean 누출 없어야 함) ===");
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const travelEn = resolveTravelStyleSplit(
  fabricatePsych({ structure: 80 }),
  fabricatePsych({ structure: 40 }),
  "Alex",
  "Jordan",
  "en-US",
);
const counselEn = resolveCounselingStyleForPerson(
  counts({ seal: 3 }),
  fabricatePsych({ empathy: 80, thinking_style: 30 }),
  "en-US",
);
const treasurerEn = resolveTreasurerConfirmNote(fabricatePsych({ practicality: 80, structure: 80 }), "en-US");
console.log({ travelEn, counselEn, treasurerEn });

const enNoHangul =
  !HANGUL_RE.test(JSON.stringify(travelEn)) &&
  !HANGUL_RE.test(JSON.stringify(counselEn)) &&
  !HANGUL_RE.test(treasurerEn);

const pass =
  noTravel === null &&
  travelBig?.planner.nickname === "Alex" &&
  travelBig?.flexible.nickname === "Jordan" &&
  travelSmall === null &&
  noCounsel === null &&
  fType?.type === "F" &&
  tType?.type === "T" &&
  balancedType?.type === "balanced" &&
  resolveTreasurerConfirmNote(null, "ko-KR") === null &&
  midNote === null &&
  enNoHangul;

console.log("\n검증:", pass ? "PASS" : "FAIL");
if (!pass) process.exit(1);
