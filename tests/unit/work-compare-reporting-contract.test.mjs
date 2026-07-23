/**
 * Work Phase 5-2 — compare reporting_rhythm copy ≠ section reporting_style_fit.
 * Resolver(양간/음간) · reporting_style_fit · leadership 불변. 카피만 분리.
 * Run: npx tsx tests/unit/work-compare-reporting-contract.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
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

const YANG_STEMS = new Set(["gap", "byeong", "mu", "gyeong", "im"]);

const LABEL_KO = {
  yang: "직진형 전달 — 할 말을 먼저 밀어 올리는 편",
  yin: "호흡형 전달 — 상대 페이스에 맞춰 풀어 가는 편",
};
const LABEL_EN = {
  yang: "Push-forward style — shares direction quickly and clearly",
  yin: "Paced style — builds the thread with the other person's tempo",
};
const MEANING_KO = {
  same: "협업할 때 생각을 전달하는 리듬이 비슷해서 대화가 잘 맞아요.",
  diff: "협업 전달·추진 리듬이 서로 달라요 — 한쪽에만 맞추기보다 짧게 방향을 공유한 뒤 세부 호흡을 맞추면 좋아요.",
};
const MEANING_EN = {
  same: "You share ideas at a similar collaboration pace, so work conversations sync easily.",
  diff: "You differ in how you push ideas forward when collaborating — share a short direction check first, then match pacing on the details.",
};

/** Compare row must not reuse section reporting (결론/맥락/보고 포맷) wording. */
const SECTION_OVERLAP_RE =
  /결론|맥락|보고 방식|보고 포맷|보고·|보고할|Conclusion-first|Context-first|headline first|Reporting &|reports and meetings/i;

function findRow(rows, id) {
  const r = rows.find((row) => row.id === id);
  assert.ok(r, `row ${id} must exist`);
  return r;
}

function dayStemBand(sajuJson) {
  const chart = buildChartContext(sajuJson.saju);
  return YANG_STEMS.has(chart.dayStemCode) ? "yang" : "yin";
}

/** Fixed births: 1990-05-15 → yang(gap 계열), 1988-02-02 → yin(jeong). */
const BIRTH_YANG = "1990-05-15";
const BIRTH_YIN = "1988-02-02";
const sajuYang = sajuFromBirth(BIRTH_YANG);
const sajuYin = sajuFromBirth(BIRTH_YIN);
const bandYang = dayStemBand(sajuYang);
const bandYin = dayStemBand(sajuYin);

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

const psychA = samplePsych({
  thinking_style: 80,
  structure: 80,
  practicality: 80,
  self_control: 30,
  empathy: 40,
});
const psychB = samplePsych({
  thinking_style: 20,
  structure: 20,
  practicality: 30,
  self_control: 75,
  empathy: 70,
});

// ---------------------------------------------------------------------------
section("1) Phase 5-2 — reporting_rhythm copy snapshot (≠ section wording)");

assert.notEqual(
  bandYang,
  bandYin,
  `fixture births must be opposite 양/음 (got ${bandYang}/${bandYin} for ${BIRTH_YANG}/${BIRTH_YIN})`,
);

for (const locale of ["ko-KR", "en-US"]) {
  const report = buildWorkColleagueReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuYang,
    sajuJsonB: sajuYin,
    workSignalsA: signalsExtA,
    workSignalsB: signalsIntB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    locale,
  });

  const rhythm = findRow(report.office.section_compare_table, "reporting_rhythm");
  assert.equal(rhythm.id, "reporting_rhythm");

  assert.doesNotMatch(
    JSON.stringify(rhythm),
    SECTION_OVERLAP_RE,
    `compare reporting_rhythm must not use section reporting wording (${locale})`,
  );

  if (locale === "ko-KR") {
    assert.equal(rhythm.label, "협업 추진 리듬");
    assert.equal(rhythm.personA.shortLabel, LABEL_KO[bandYang]);
    assert.equal(rhythm.personB.shortLabel, LABEL_KO[bandYin]);
    assert.equal(rhythm.meaning, MEANING_KO.diff);
  } else {
    assert.equal(rhythm.label, "Collaboration Rhythm");
    assert.equal(rhythm.personA.shortLabel, LABEL_EN[bandYang]);
    assert.equal(rhythm.personB.shortLabel, LABEL_EN[bandYin]);
    assert.equal(rhythm.meaning, MEANING_EN.diff);
  }

  const fit = report.office.section_mix_fit.reporting_style_fit;
  assert.ok(fit, "section reporting_style_fit still present with psych");
  assert.match(
    JSON.stringify(fit),
    /headline_first|context_first|flexible|결론|맥락|leads with the conclusion|context and background/i,
    `section reporting_style_fit keeps reporting-format wording (${locale})`,
  );
}
ok("compare snapshot ≠ section reporting wording");

// ---------------------------------------------------------------------------
section("2) same-band meaning + forbidden wording");

for (const locale of ["ko-KR", "en-US"]) {
  const sameReport = buildWorkColleagueReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuYang,
    sajuJsonB: sajuFromBirth(BIRTH_YANG, "14:00"),
    workSignalsA: signalsExtA,
    workSignalsB: signalsExtA,
    psychMasterA: psychA,
    psychMasterB: psychB,
    locale,
  });
  const rhythm = findRow(
    sameReport.office.section_compare_table,
    "reporting_rhythm",
  );
  assert.equal(
    rhythm.personA.shortLabel,
    rhythm.personB.shortLabel,
    "same day-stem band precondition",
  );
  assert.equal(
    rhythm.meaning,
    locale === "ko-KR" ? MEANING_KO.same : MEANING_EN.same,
  );
  assert.doesNotMatch(JSON.stringify(rhythm), SECTION_OVERLAP_RE);
}
ok("same-band meaning snapshot");

// ---------------------------------------------------------------------------
section("3) 회귀 — reporting_style_fit · leadership · CO · ViewModel");

const withPsych = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuYang,
  sajuJsonB: sajuYin,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "ko-KR",
});

assert.ok(withPsych.office.section_mix_fit.reporting_style_fit);
assert.ok(withPsych.office.section_roles.leadership_split);
assert.equal(
  withPsych.office.section_roles.leadership_split.external_lead,
  "a",
);
assert.equal(
  withPsych.context_output.dominant_categories.external_lead.category,
  "a",
);
assert.ok(withPsych.context_output.dominant_categories.reporting_style_a);
assert.ok(withPsych.context_output.dominant_categories.reporting_style_b);
assert.equal(
  withPsych.context_output.dominant_categories.reporting_style_a.category,
  withPsych.office.section_mix_fit.reporting_style_fit.person_a.style,
);

const vm = buildWorkReportViewModel(withPsych, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
  locale: "ko-KR",
});
assert.ok(vm.sections.some((s) => s.type === "compare_table"));
assert.ok(vm.sections.some((s) => s.type === "comparison"));
const compareSec = vm.sections.find((s) => s.type === "compare_table");
const rhythmVm = findRow(compareSec.rows, "reporting_rhythm");
assert.equal(rhythmVm.label, "협업 추진 리듬");
assert.doesNotMatch(JSON.stringify(rhythmVm), SECTION_OVERLAP_RE);

const comparison = vm.sections.find((s) => s.type === "comparison");
assert.ok(comparison.reportingStyleFit);
ok("leadership / CO / VM regression — strings only on compare row");

console.log("\nAll work-compare-reporting-contract tests passed.");
