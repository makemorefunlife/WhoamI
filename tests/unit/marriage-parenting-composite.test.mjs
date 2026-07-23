/**
 * Phase 5-2 — Marriage parenting style composite (refineParentingStyle).
 * Run: npx tsx tests/unit/marriage-parenting-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineParentingStyle,
  resolveParentingStyle,
  isParentingSajuLocked,
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

/** 식상만 뚜렷 → empathy lock */
const countsEmpathyLock = { 식신: 3, 상관: 1 };
/** 인성+관성만 뚜렷 → structure lock */
const countsStructureLock = { 정인: 2, 정관: 2 };
/** 양쪽 애매 → weak (tie-break) */
const countsWeakFood = { 식신: 1, 정인: 1, 정관: 0 };
const countsWeakSeal = { 식신: 1, 정인: 1, 정관: 1 };

// ---------------------------------------------------------------------------
section("1) psych 누락 → legacy");

const baseEmpathy = resolveParentingStyle(countsEmpathyLock, "ko-KR");
assert.equal(baseEmpathy.style, "empathy");
assert.equal(isParentingSajuLocked(countsEmpathyLock), true);

const legacy = refineParentingStyle({
  baseStyle: baseEmpathy.style,
  counts: countsEmpathyLock,
  psych: null,
  locale: "ko-KR",
});
assert.equal(legacy.style, "empathy");
assert.equal(legacy.confidence, undefined);
assert.equal(legacy.align, undefined);
ok("legacy");

// ---------------------------------------------------------------------------
section("2) psych 동의 → high/confirms");

const confirms = refineParentingStyle({
  baseStyle: "empathy",
  counts: countsEmpathyLock,
  psych: samplePsych({ empathy: 80, self_control: 40 }),
  locale: "ko-KR",
});
assert.equal(confirms.style, "empathy");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.align, "confirms");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 약한 saju + psych 반대 → flip");

const weakBase = resolveParentingStyle(countsWeakFood, "ko-KR");
assert.equal(isParentingSajuLocked(countsWeakFood), false);

const flipped = refineParentingStyle({
  baseStyle: weakBase.style,
  counts: countsWeakFood,
  psych:
    weakBase.style === "empathy"
      ? samplePsych({ empathy: 25, self_control: 80 })
      : samplePsych({ empathy: 85, self_control: 30 }),
  locale: "ko-KR",
});
assert.notEqual(flipped.style, weakBase.style);
assert.equal(flipped.confidence, "high");
assert.equal(flipped.align, "caution");
ok(`weak flip ${weakBase.style}→${flipped.style}`);

// ---------------------------------------------------------------------------
section("4) 강한 saju lock → psych 반대해도 유지");

const locked = refineParentingStyle({
  baseStyle: "structure",
  counts: countsStructureLock,
  psych: samplePsych({ empathy: 90, self_control: 20 }),
  locale: "ko-KR",
});
assert.equal(isParentingSajuLocked(countsStructureLock), true);
assert.equal(locked.style, "structure");
assert.equal(locked.confidence, "low");
assert.equal(locked.align, "caution");
ok("saju lock");

// ---------------------------------------------------------------------------
section("5) mid psych → base 유지 · low/caution");

const mid = refineParentingStyle({
  baseStyle: "empathy",
  counts: countsWeakSeal,
  psych: samplePsych({ empathy: 52, self_control: 48 }),
  locale: "ko-KR",
});
assert.equal(mid.style, "empathy");
assert.equal(mid.confidence, "low");
assert.equal(mid.align, "caution");
ok("mid psych");

// ---------------------------------------------------------------------------
section("6) builder + Context Output");

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
};

const noPsych = buildMarriageReport(baseParams);
assert.equal(
  noPsych.household.section_parenting.parenting_a_confidence,
  undefined,
);
assert.equal(
  noPsych.context_output.dominant_categories.parenting_a_confidence,
  undefined,
);
assert.ok(noPsych.household.section_parenting.style_key_a);
assert.equal(
  noPsych.context_output.dominant_categories.parenting_style_a.category,
  noPsych.household.section_parenting.style_key_a,
);

const withPsych = buildMarriageReport({
  ...baseParams,
  psychMasterA: samplePsych({ empathy: 80, self_control: 35 }),
  psychMasterB: samplePsych({ empathy: 30, self_control: 75 }),
});
assert.ok(withPsych.household.section_parenting.parenting_a_confidence);
assert.ok(withPsych.household.section_parenting.parenting_a_align);
assert.equal(
  withPsych.context_output.dominant_categories.parenting_style_a.category,
  withPsych.household.section_parenting.style_key_a,
);
assert.equal(
  withPsych.context_output.dominant_categories.parenting_a_confidence.category,
  withPsych.household.section_parenting.parenting_a_confidence,
);
assert.equal(
  withPsych.context_output.dominant_categories.parenting_a_align.category,
  withPsych.household.section_parenting.parenting_a_align,
);
assert.equal(
  withPsych.context_output.scores.activation,
  noPsych.context_output.scores.activation,
);

const compareRow = withPsych.household.section_compare_table?.find(
  (r) => r.id === "parenting_style",
);
assert.ok(compareRow);

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
assert.ok(
  withPsych.context_output.dominant_categories.parenting_a_align,
);
ok("builder CO + VM + strip");

console.log("\nAll marriage-parenting-composite tests passed.");
