/**
 * Phase 2-4 Batch B 검증 — Part2②③, Part3①, Part4② 4개 함수.
 * 실행: npx tsx tests/scripts/verify-phase2-4-batch-b.mjs
 */
import {
  resolveReportingStyleFit,
  resolveBreakBoundaryFit,
  resolveContributionStyle,
  resolveFeedbackCushionScript,
} from "../../lib/relationship/workColleague/officePsychFit.ts";

function fabricateWorkSignals({ officer = 0, self = 0, seal = 0, wealth = 0, category = "officer" }) {
  return {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: category,
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
    johu_profile: { heat_score: 50, moisture_score: 50, temperature_band: "neutral", dominant_element: "earth" },
  };
}

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

console.log("=== psych 없음 -> 전부 null ===");
console.log(
  "reportingStyleFit:", resolveReportingStyleFit({}, {}, undefined, undefined, null, null, "A", "B", "ko-KR"),
);
console.log(
  "breakBoundaryFit:", resolveBreakBoundaryFit([], null, null, "A", "B", "ko-KR"),
);
console.log(
  "contributionStyle:", resolveContributionStyle(undefined, undefined, null, null, "A", "B", "ko-KR"),
);
console.log(
  "feedbackCushion:",
  resolveFeedbackCushionScript("A", "B", { label: "중화", note: "" }, { label: "중화", note: "" }, null, null, "ko-KR"),
);

console.log("\n=== Part2② 보고/피드백 소통 핏 ===");
const rsA = resolveReportingStyleFit(
  { 정관: 3 }, { 정인: 3 },
  fabricateWorkSignals({ officer: 3, category: "officer" }), fabricateWorkSignals({ seal: 3, category: "seal" }),
  fabricatePsych({ thinking_style: 70, structure: 70 }),
  fabricatePsych({ thinking_style: 30, structure: 30 }),
  "동글", "Sera", "ko-KR",
);
console.log(JSON.stringify(rsA, null, 2));

console.log("\n=== Part2③ 점심시간 경계선 ===");
const bb = resolveBreakBoundaryFit(
  [{ type: "충", personA_pillar: "일주(x)", personB_pillar: "일주(y)", interpretation: "", priority: 50, palaceWeight: 1, weightedPriority: 50 }],
  fabricatePsych({ energy_style: 75, empathy: 75 }),
  fabricatePsych({ energy_style: 25, empathy: 25 }),
  "동글", "Sera", "ko-KR",
);
console.log(JSON.stringify(bb, null, 2));

console.log("\n=== Part3① 지원기여형 vs 성과수확형 ===");
const cs = resolveContributionStyle(
  fabricateWorkSignals({ seal: 3 }),
  fabricateWorkSignals({ officer: 2, wealth: 2 }),
  fabricatePsych({ empathy: 80, practicality: 20 }),
  fabricatePsych({ empathy: 20, practicality: 80 }),
  "동글", "Sera", "ko-KR",
);
console.log(JSON.stringify(cs, null, 2));

console.log("\n=== Part4② 피드백 쿠션 멘트 ===");
const fc = resolveFeedbackCushionScript(
  "동글", "Sera",
  { label: "신강(혼자서도 잘 버티는 타입)", note: "" },
  { label: "신약(주변 지지·공감이 필요한 타입)", note: "" },
  fabricatePsych({ recognition: 75 }),
  fabricatePsych({ recognition: 30 }),
  "ko-KR",
);
console.log(JSON.stringify(fc, null, 2));

console.log(
  "\n검증:",
  rsA?.person_a.style === "headline_first" &&
    rsA?.person_b.style === "context_first" &&
    bb?.person_a.style === "social" &&
    bb?.person_b.style === "solo_reset" &&
    cs?.person_a.style === "support_care" &&
    cs?.person_b.style === "outcome_gain" &&
    typeof fc?.to_a === "string" &&
    typeof fc?.to_b === "string"
    ? "PASS"
    : "FAIL",
);
