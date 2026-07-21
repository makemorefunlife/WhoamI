/**
 * Phase 2-3 Batch A 검증 — 시그니처 한줄요약(일간 오행 관계 절) +
 * Part3② 주도권/공로배분(resolveLeadershipRoleSplit) 확인.
 * 실행: npx tsx tests/scripts/verify-phase2-3-batch-a.mjs
 */
import { resolveLeadershipRoleSplit } from "../../lib/relationship/workColleague/officeLanguage.ts";

function fabricateSignals({ officer, self, seal, wealth }) {
  return {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: "officer",
      geokguk_label_ko: "",
      month_branch_element: "earth",
      day_master_element_support: false,
    },
    drive_stubborn: {
      food_count: 0,
      self_count: self,
      officer_count: officer,
      wealth_count: wealth,
      seal_count: seal,
      food_intensity: 0,
      self_intensity: 0,
      drive_band: "balanced",
      stubborn_band: "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: false,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: 0,
    },
    johu_profile: {
      heat_score: 50,
      moisture_score: 50,
      temperature_band: "neutral",
      dominant_element: "earth",
    },
  };
}

console.log("=== Part3② 주도권/공로배분 — resolveLeadershipRoleSplit ===\n");

// A가 관성+비겁 높음 -> A가 external_lead
const caseA = resolveLeadershipRoleSplit(
  fabricateSignals({ officer: 3, self: 2, seal: 0, wealth: 0 }),
  fabricateSignals({ officer: 0, self: 0, seal: 2, wealth: 2 }),
  "동글",
  "Sera",
  "ko-KR",
);
console.log("A 우세 케이스:", JSON.stringify(caseA, null, 2));

// B가 관성+비겁 높음 -> B가 external_lead
const caseB = resolveLeadershipRoleSplit(
  fabricateSignals({ officer: 0, self: 0, seal: 2, wealth: 2 }),
  fabricateSignals({ officer: 3, self: 2, seal: 0, wealth: 0 }),
  "동글",
  "Sera",
  "ko-KR",
);
console.log("\nB 우세 케이스:", JSON.stringify(caseB, null, 2));

// 균형
const caseBalanced = resolveLeadershipRoleSplit(
  fabricateSignals({ officer: 1, self: 1, seal: 1, wealth: 1 }),
  fabricateSignals({ officer: 1, self: 1, seal: 1, wealth: 1 }),
  "동글",
  "Sera",
  "ko-KR",
);
console.log("\n균형 케이스:", JSON.stringify(caseBalanced, null, 2));

console.log(
  "\n검증:",
  caseA.external_lead === "a" &&
    caseA.internal_qa_lead === "b" &&
    caseB.external_lead === "b" &&
    caseB.internal_qa_lead === "a" &&
    caseBalanced.external_lead === "balanced"
    ? "PASS"
    : "FAIL",
);

// undefined 입력 -> null
console.log(
  "\nworkSignals undefined 입력 시 null 반환:",
  resolveLeadershipRoleSplit(undefined, undefined, "A", "B", "ko-KR") === null ? "PASS" : "FAIL",
);
