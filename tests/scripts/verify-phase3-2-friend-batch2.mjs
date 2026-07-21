/**
 * Friend Phase 3-2 Batch 2 검증 — resolveGuardianCharacterForPerson, resolveCommunicationRhythmNote.
 * 실행: npx tsx tests/scripts/verify-phase3-2-friend-batch2.mjs
 */
import {
  resolveGuardianCharacterForPerson,
  resolveCommunicationRhythmNote,
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
  return {
    officer: 0,
    wealth: 0,
    food: 0,
    seal: 0,
    self: 0,
    ...overrides,
  };
}

console.log("=== psych 없음 -> null ===");
const noPsych = resolveGuardianCharacterForPerson(counts({ officer: 3 }), null, "ko-KR");
console.log("guardian:", noPsych);
console.log("comm rhythm (psych 없음):", resolveCommunicationRhythmNote(null, null, "ko-KR"));

console.log("\n=== brain 우세 (관성+인성, 분석사고 高) ===");
const brain = resolveGuardianCharacterForPerson(
  counts({ officer: 3, seal: 2 }),
  fabricatePsych({ thinking_style: 80 }),
  "ko-KR",
);
console.log(brain);

console.log("\n=== business 우세 (재성+식상, 현실실리 高) ===");
const business = resolveGuardianCharacterForPerson(
  counts({ wealth: 3, food: 2 }),
  fabricatePsych({ practicality: 80 }),
  "ko-KR",
);
console.log(business);

console.log("\n=== bamboo 우세 (인성+식상, 관계공감 高) ===");
const bamboo = resolveGuardianCharacterForPerson(
  counts({ seal: 3, food: 2 }),
  fabricatePsych({ empathy: 80 }),
  "ko-KR",
);
console.log(bamboo);

console.log("\n=== en-US 로케일 확인 ===");
const brainEn = resolveGuardianCharacterForPerson(
  counts({ officer: 3, seal: 2 }),
  fabricatePsych({ thinking_style: 80 }),
  "en-US",
);
console.log(brainEn);

console.log("\n=== 대화템포 — 자극추구/외향에너지 高 (양쪽 다) ===");
console.log(
  resolveCommunicationRhythmNote(
    fabricatePsych({ stimulation: 80, energy_style: 80 }),
    fabricatePsych({ stimulation: 75, energy_style: 70 }),
    "ko-KR",
  ),
);

console.log("\n=== 대화템포 — 자극추구/외향에너지 低 (양쪽 다) ===");
console.log(
  resolveCommunicationRhythmNote(
    fabricatePsych({ stimulation: 20, energy_style: 25 }),
    fabricatePsych({ stimulation: 25, energy_style: 20 }),
    "ko-KR",
  ),
);

console.log("\n=== 대화템포 — 중간대(문구 없음, null 예상) ===");
const midRhythm = resolveCommunicationRhythmNote(
  fabricatePsych({ stimulation: 50, energy_style: 50 }),
  fabricatePsych({ stimulation: 50, energy_style: 50 }),
  "ko-KR",
);
console.log(midRhythm);

const pass =
  noPsych === null &&
  resolveCommunicationRhythmNote(null, null, "ko-KR") === null &&
  brain.key === "brain" &&
  business.key === "business" &&
  bamboo.key === "bamboo" &&
  brainEn.key === "brain" &&
  brainEn.label === "The Smart Brain" &&
  midRhythm === null;

console.log("\n검증:", pass ? "PASS" : "FAIL");
if (!pass) process.exit(1);
