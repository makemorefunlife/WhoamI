/**
 * Phase 5-2 — Marriage CFO composite (refineHouseholdCfo).
 * Run: npx tsx tests/unit/marriage-cfo-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineHouseholdCfo,
  resolveCfoAxisNote,
} from "../../lib/relationship/marriage/marriageCfoConsumption.ts";
import {
  pickHouseholdCfo,
  resolveCfoAffinityScore,
} from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { COHABITATION_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/cohabitation/outputSchema.ts";
import { stripMarriageContextOutputForClient } from "../../lib/relationship/marriage/stripMarriageContextOutputForClient.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function emptyCounts() {
  return {};
}

function countsWealthHeavy() {
  return { 정재: 2, 편관: 2, 정관: 1 };
}

function countsLight() {
  return { 식신: 2, 비견: 1 };
}

function samplePsych(overrides = {}) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  Object.assign(secondary_axes, overrides);
  return {
    schema_version: "psych_master_v1",
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: null,
    survey_input_fingerprint: null,
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "l",
      life_values_line: "v",
      private_home_self_line: "p",
      energy_battery_line: "e",
    },
  };
}

function power(score, band = "medium", dual = false) {
  return {
    wealth_count: 2,
    officer_count: 2,
    wealth_officer_total: 4,
    cfo_affinity_score: score,
    dual_power_risk: dual,
    economic_dominance_band: band,
  };
}

const emptyBranches = new Set();

const basePick = pickHouseholdCfo(
  "Alex",
  "Jordan",
  countsWealthHeavy(),
  countsLight(),
  emptyBranches,
  emptyBranches,
  "ko-KR",
  power(70, "high"),
  power(40, "low"),
);

// ---------------------------------------------------------------------------
section("1) psych 누락 → legacy base");

const legacy = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: null,
  psychB: null,
  locale: "ko-KR",
});
assert.equal(legacy.nickname, basePick.nickname);
assert.equal(legacy.reason, basePick.reason);
assert.equal(legacy.confidence, undefined);
assert.equal(legacy.align, undefined);
assert.equal(basePick.nickname, "Alex");
ok("legacy fallback");

// ---------------------------------------------------------------------------
section("2) psych 동의 → pick 유지 · high/confirms");

const confirms = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: samplePsych({ practicality: 85, self_control: 80 }),
  psychB: samplePsych({ practicality: 30, self_control: 35 }),
  masterBenefit: 70,
  masterRisk: 30,
  locale: "ko-KR",
});
assert.equal(confirms.nickname, "Alex");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.reason, basePick.reason);
ok("high confirms");

// ---------------------------------------------------------------------------
section("3) 약한 saju + 강한 psych 반대 → pick 변경");

const weakBase = pickHouseholdCfo(
  "Alex",
  "Jordan",
  emptyCounts(),
  emptyCounts(),
  emptyBranches,
  emptyBranches,
  "ko-KR",
  power(45, "medium"),
  power(40, "medium"),
);
assert.ok(Math.abs(45 - 40) < 12, "saju unlocked");

const flipped = refineHouseholdCfo({
  baseNickname: weakBase.nickname,
  baseReason: weakBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: emptyCounts(),
  countsB: emptyCounts(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(45, "medium"),
  wealthOfficerPowerB: power(40, "medium"),
  // base is Alex (45>=40); psych strongly favors Jordan
  psychA: samplePsych({ practicality: 15, self_control: 20 }),
  psychB: samplePsych({ practicality: 90, self_control: 88 }),
  masterBenefit: 50,
  masterRisk: 40,
  locale: "ko-KR",
});
assert.equal(flipped.nickname, "Jordan");
assert.equal(flipped.confidence, "high");
assert.equal(flipped.align, "caution");
assert.ok(
  flipped.reason.includes("굳히지") ||
    flipped.reason.includes("flexible") ||
    flipped.reason.includes("Survey axes"),
);
ok("weak saju flip");

// ---------------------------------------------------------------------------
section("4) 강한 saju lock → psych 반대해도 pick 유지");

const locked = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: samplePsych({ practicality: 15, self_control: 20 }),
  psychB: samplePsych({ practicality: 90, self_control: 88 }),
  locale: "ko-KR",
});
assert.equal(locked.nickname, "Alex");
assert.equal(locked.confidence, "low");
assert.equal(locked.align, "caution");
ok("saju lock");

// ---------------------------------------------------------------------------
section("5) dual → pick 유지 · dual 플래그");

const dual = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsWealthHeavy(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(65, "high", true),
  wealthOfficerPowerB: power(62, "high", true),
  psychA: samplePsych({ practicality: 80, self_control: 75 }),
  psychB: samplePsych({ practicality: 78, self_control: 70 }),
  dualCfoWar: true,
  locale: "ko-KR",
});
assert.equal(dual.nickname, basePick.nickname);
assert.equal(dual.dual, true);
assert.equal(dual.confidence, "low");
assert.equal(dual.align, "caution");
ok("dual keeps base");

// ---------------------------------------------------------------------------
section("6) builder + Context Output · UI 회귀");

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
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

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
  cohabitationSignalsA: {
    day_palace: {
      branch_code: "o",
      harmony_hits: [],
      tension_hits: [],
      harmony_index: 0,
      tension_index: 0,
    },
    hidden_stem_intimacy: {
      day_stem_rooted_in_spouse_palace: false,
      stem_combine_links: [],
      intimacy_index: 0,
    },
    wealth_officer_power: power(70, "high"),
  },
  cohabitationSignalsB: {
    day_palace: {
      branch_code: "o",
      harmony_hits: [],
      tension_hits: [],
      harmony_index: 0,
      tension_index: 0,
    },
    hidden_stem_intimacy: {
      day_stem_rooted_in_spouse_palace: false,
      stem_combine_links: [],
      intimacy_index: 0,
    },
    wealth_officer_power: power(40, "low"),
  },
};

const noPsych = buildMarriageReport(baseParams);
const withPsych = buildMarriageReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 85, self_control: 80 }),
  psychMasterB: samplePsych({ practicality: 30, self_control: 35 }),
});

assert.equal(noPsych.household.section_money_chores.cfo_confidence, undefined);
assert.equal(
  noPsych.context_output.dominant_categories.cfo_confidence,
  undefined,
);
assert.ok(noPsych.household.section_money_chores.cfo_nickname);

assert.ok(withPsych.household.section_money_chores.cfo_confidence);
assert.ok(withPsych.household.section_money_chores.cfo_align);
assert.equal(
  withPsych.context_output.dominant_categories.household_cfo.category,
  withPsych.household.section_money_chores.cfo_nickname === "Alex" ? "a" : "b",
);
assert.equal(
  withPsych.context_output.dominant_categories.cfo_confidence.category,
  withPsych.household.section_money_chores.cfo_confidence,
);
assert.equal(
  withPsych.context_output.dominant_categories.cfo_align.category,
  withPsych.household.section_money_chores.cfo_align,
);
assert.equal(
  withPsych.context_output.scores.activation,
  noPsych.context_output.scores.activation,
);

const note = resolveCfoAxisNote(
  withPsych.meta.psych_match,
  withPsych.household.section_money_chores.cfo_nickname === "Alex",
  "ko-KR",
);
assert.equal(
  withPsych.household.section_money_chores.cfo_axis_note,
  note,
);

const vm = buildMarriageReportViewModel(withPsych, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));

const stripped = stripMarriageContextOutputForClient({
  format: COHABITATION_DEEP_FORMAT,
  report: withPsych,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(withPsych.context_output.dominant_categories.cfo_align);

assert.equal(
  resolveCfoAffinityScore(countsWealthHeavy(), emptyBranches, power(70)),
  70,
);
ok("builder CO + VM + strip");

console.log("\nAll marriage-cfo-composite tests passed.");
