/**
 * Phase 5-2 — Work leadership composite (refineLeadershipRoleSplit).
 * Run: npx tsx tests/unit/work-leadership-composite.test.mjs
 */
import assert from "node:assert/strict";
import { resolveLeadershipRoleSplit } from "../../lib/relationship/workColleague/officeLanguage.ts";
import { refineLeadershipRoleSplit } from "../../lib/relationship/workColleague/officePsychFit.ts";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/outputSchema.ts";
import { stripWorkContextOutputForClient } from "../../lib/relationship/workColleague/stripWorkContextOutputForClient.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

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

const SECONDARY_KEYS = [
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

function samplePsych(overrides = {}) {
  const secondary_axes = Object.fromEntries(
    SECONDARY_KEYS.map((k) => [k, 50]),
  );
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

const signalsExtA = fabricateSignals({
  officer: 3,
  self: 2,
  seal: 0,
  wealth: 0,
});
const signalsIntB = fabricateSignals({
  officer: 0,
  self: 0,
  seal: 2,
  wealth: 2,
});

const baseSplit = resolveLeadershipRoleSplit(
  signalsExtA,
  signalsIntB,
  "Alex",
  "Jordan",
  "ko-KR",
);

// ---------------------------------------------------------------------------
section("1) psych 누락 → legacy base 그대로 (confidence/align omit)");

const legacy = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA: null,
  psychB: null,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.deepEqual(
  {
    external_lead: legacy.external_lead,
    internal_qa_lead: legacy.internal_qa_lead,
    summary: legacy.summary,
  },
  {
    external_lead: baseSplit.external_lead,
    internal_qa_lead: baseSplit.internal_qa_lead,
    summary: baseSplit.summary,
  },
);
assert.equal(legacy.confidence, undefined);
assert.equal(legacy.align, undefined);
assert.equal(baseSplit.external_lead, "a");
assert.equal(baseSplit.internal_qa_lead, "b");
ok("legacy fallback");

// ---------------------------------------------------------------------------
section("2) clear split + psych 동의 → pick 유지 · high/confirms");

const confirms = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA: samplePsych({
    practicality: 85,
    structure: 25,
    self_control: 25,
    empathy: 40,
  }),
  psychB: samplePsych({
    practicality: 30,
    structure: 85,
    self_control: 80,
    empathy: 75,
  }),
  reporting: {
    person_a: { nickname: "Alex", style: "headline_first" },
    person_b: { nickname: "Jordan", style: "context_first" },
    summary: "x",
  },
  contribution: {
    person_a: {
      nickname: "Alex",
      style: "outcome_gain",
      label: "o",
    },
    person_b: {
      nickname: "Jordan",
      style: "support_care",
      label: "s",
    },
  },
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(confirms.external_lead, "a");
assert.equal(confirms.internal_qa_lead, "b");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.align, "confirms");
assert.ok(!confirms.summary.includes("유연하게"));
ok("high-confidence confirms");

// ---------------------------------------------------------------------------
section("3) 약한 saju + 강한 psych 반대 → pick 변경 가능");

const weakA = fabricateSignals({ officer: 1, self: 0, seal: 2, wealth: 2 });
const weakB = fabricateSignals({ officer: 0, self: 0, seal: 0, wealth: 0 });
const weakBase = resolveLeadershipRoleSplit(
  weakA,
  weakB,
  "Alex",
  "Jordan",
  "ko-KR",
);
assert.equal(weakBase.external_lead, "a");
assert.equal(Math.abs(1 - 0), 1, "saju |diff|=1 < lock 2");

const flipped = refineLeadershipRoleSplit({
  base: weakBase,
  workSignalsA: weakA,
  workSignalsB: weakB,
  // A: 검수형 psych / B: 대외형 psych — saju는 A가 약한 external
  psychA: samplePsych({
    practicality: 15,
    structure: 90,
    self_control: 90,
    empathy: 85,
  }),
  psychB: samplePsych({
    practicality: 95,
    structure: 10,
    self_control: 10,
    empathy: 20,
  }),
  reporting: {
    person_a: { nickname: "Alex", style: "context_first" },
    person_b: { nickname: "Jordan", style: "headline_first" },
    summary: "x",
  },
  contribution: {
    person_a: {
      nickname: "Alex",
      style: "support_care",
      label: "s",
    },
    person_b: {
      nickname: "Jordan",
      style: "outcome_gain",
      label: "o",
    },
  },
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(flipped.external_lead, "b", "psych가 대외를 B로");
assert.equal(flipped.internal_qa_lead, "a");
assert.equal(flipped.confidence, "high");
assert.equal(flipped.align, "caution");
assert.ok(flipped.summary.includes("유연하게") || flipped.summary.includes("flexible"));
ok("weak saju + strong psych → pick 변경");

// ---------------------------------------------------------------------------
section("4) 강한 saju lock → psych 반대해도 pick 유지 · low/caution");

const locked = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA: samplePsych({
    practicality: 10,
    structure: 95,
    self_control: 95,
    empathy: 90,
  }),
  psychB: samplePsych({
    practicality: 95,
    structure: 10,
    self_control: 10,
    empathy: 20,
  }),
  reporting: {
    person_a: { nickname: "Alex", style: "context_first" },
    person_b: { nickname: "Jordan", style: "headline_first" },
    summary: "x",
  },
  contribution: {
    person_a: {
      nickname: "Alex",
      style: "support_care",
      label: "s",
    },
    person_b: {
      nickname: "Jordan",
      style: "outcome_gain",
      label: "o",
    },
  },
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(locked.external_lead, "a", "saju |diff|>=2 lock");
assert.equal(locked.internal_qa_lead, "b");
assert.equal(locked.confidence, "low");
assert.equal(locked.align, "caution");
ok("saju lock keeps legacy pick");

// ---------------------------------------------------------------------------
section("5) 역할 overlap / mid psych → base 유지 · low");

const mid = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA: samplePsych(),
  psychB: samplePsych(),
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(mid.external_lead, baseSplit.external_lead);
assert.equal(mid.internal_qa_lead, baseSplit.internal_qa_lead);
assert.ok(mid.confidence === "high" || mid.confidence === "low");
assert.ok(mid.align === "confirms" || mid.align === "caution");
ok("mid psych — no crash, pick from rules");

// ---------------------------------------------------------------------------
section("6) builder + Context Output · UI locale 회귀");

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");
const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  locale: "ko-KR",
};

const noPsych = buildWorkColleagueReport(baseParams);
const withPsych = buildWorkColleagueReport({
  ...baseParams,
  psychMasterA: samplePsych({
    practicality: 80,
    structure: 30,
    self_control: 30,
    empathy: 40,
  }),
  psychMasterB: samplePsych({
    practicality: 30,
    structure: 80,
    self_control: 75,
    empathy: 70,
  }),
});

const legacyLead = noPsych.office.section_roles.leadership_split;
assert.ok(legacyLead);
assert.equal(legacyLead.external_lead, "a");
assert.equal(legacyLead.internal_qa_lead, "b");
assert.equal(legacyLead.confidence, undefined);
assert.equal(
  noPsych.context_output.dominant_categories.leadership_confidence,
  undefined,
);
assert.equal(
  noPsych.context_output.dominant_categories.external_lead.category,
  "a",
);

const refined = withPsych.office.section_roles.leadership_split;
assert.ok(refined);
assert.ok(refined.confidence);
assert.ok(refined.align);
assert.equal(
  withPsych.context_output.dominant_categories.external_lead.category,
  refined.external_lead,
);
assert.equal(
  withPsych.context_output.dominant_categories.internal_qa_lead.category,
  refined.internal_qa_lead,
);
assert.equal(
  withPsych.context_output.dominant_categories.leadership_confidence.category,
  refined.confidence,
);
assert.equal(
  withPsych.context_output.dominant_categories.leadership_align.category,
  refined.align,
);
assert.equal(
  withPsych.context_output.section_summaries.leadership,
  refined.summary,
);
assert.equal(
  withPsych.context_output.scores.activation,
  noPsych.context_output.scores.activation,
  "master scores 불변",
);

const vm = buildWorkReportViewModel(withPsych, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));

const en = buildWorkColleagueReport({
  ...baseParams,
  locale: "en-US",
  psychMasterA: samplePsych({ practicality: 80, structure: 30 }),
  psychMasterB: samplePsych({ practicality: 30, structure: 80 }),
});
assert.ok(en.office.section_roles.leadership_split?.summary);

const stripped = stripWorkContextOutputForClient({
  format: WORK_COLLEAGUE_DEEP_FORMAT,
  report: withPsych,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(withPsych.context_output.dominant_categories.leadership_align);
ok("builder CO + VM + locale + strip");

console.log("\nAll work-leadership-composite tests passed.");
