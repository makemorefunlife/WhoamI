/**
 * Work Context Output — ctx/office 동일 매핑 + DB 유지 vs 클라이언트 strip.
 * Run: npx tsx tests/unit/work-context-output.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkColleagueContext } from "../../lib/relationship/workColleague/buildWorkColleagueContext.ts";
import {
  buildWorkContextOutput,
  WORK_CONTEXT_OUTPUT_SCHEMA_VERSION,
} from "../../lib/relationship/workColleague/workContextOutput.ts";
import {
  omitWorkContextOutputFromReport,
  stripWorkContextOutputForClient,
} from "../../lib/relationship/workColleague/stripWorkContextOutputForClient.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/outputSchema.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
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

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
};

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

// ---------------------------------------------------------------------------
section("1) 생성 report에 context_output 존재");

const report = buildWorkColleagueReport(baseParams);
assert.ok(report.context_output, "context_output must exist");
assert.equal(report.context_output.schema_version, WORK_CONTEXT_OUTPUT_SCHEMA_VERSION);
assert.equal(report.context_output.domain, "work");
ok("context_output 존재 + schema/domain");

// ---------------------------------------------------------------------------
section("2) grade/scores/signals ≡ ctx · meta");

const ctx = buildWorkColleagueContext(baseParams);
const mapped = buildWorkContextOutput(ctx, report.office, {
  personCoreMeta: null,
});

assert.equal(mapped.grade, ctx.grade);
assert.deepEqual(mapped.scores, ctx.masterScores);
assert.deepEqual(mapped.signals, ctx.workPairAnalysis.scoringSignals);
assert.equal(report.context_output.grade, report.meta.grade);
assert.equal(report.context_output.scores.activation, report.meta.fit_pct);
assert.equal(report.context_output.scores.benefit, report.meta.synergy_pct);
assert.equal(report.context_output.scores.risk, report.meta.risk_pct);
assert.deepEqual(
  report.context_output.signals,
  ctx.workPairAnalysis.scoringSignals,
);
ok("grade/scores/signals ≡ ctx / meta");

// ---------------------------------------------------------------------------
section("3) dominant 재사용 · axis_notes 비움 · summaries는 section summary");

const strongA = ctx.tenGodComplement.personA.strong[0];
if (strongA) {
  assert.equal(
    mapped.dominant_categories.person_a_strong.category,
    strongA,
  );
}
assert.deepEqual(mapped.axis_notes, {});
assert.equal(
  mapped.section_summaries.leadership,
  report.office.section_roles.leadership_split?.summary ?? null,
);
assert.equal(mapped.section_summaries.reporting_style, null);
assert.equal(mapped.section_summaries.break_boundary, null);
assert.equal(
  mapped.dominant_categories.work_category_a,
  undefined,
  "resolveWorkCategory 재호출로 만든 raw category 키 없음",
);
ok("axis_notes 비움 + section_summaries ≡ office summary");

// ---------------------------------------------------------------------------
section("4) psych + personCoreMeta 시 reporting → section_summaries");

const withPsych = buildWorkColleagueReport({
  ...baseParams,
  psychMasterA: samplePsych({ thinking_style: 70, structure: 65 }),
  psychMasterB: samplePsych({ thinking_style: 30, structure: 35 }),
  personCoreMeta: {
    reportIdA: "rep-a",
    reportIdB: "rep-b",
    inputFingerprintA: "fp-a",
    inputFingerprintB: "fp-b",
  },
});
assert.ok(withPsych.office.section_mix_fit.reporting_style_fit);
assert.equal(
  withPsych.context_output.dominant_categories.reporting_style_a.category,
  withPsych.office.section_mix_fit.reporting_style_fit.person_a.style,
);
assert.equal(
  withPsych.context_output.section_summaries.reporting_style,
  withPsych.office.section_mix_fit.reporting_style_fit.summary,
);
assert.equal(
  withPsych.context_output.axis_notes.reporting_style,
  undefined,
  "완성 summary는 axis_notes에 두지 않음",
);
assert.deepEqual(withPsych.context_output.axis_notes, {});
assert.deepEqual(withPsych.context_output.meta, {
  reportIdA: "rep-a",
  reportIdB: "rep-b",
  inputFingerprintA: "fp-a",
  inputFingerprintB: "fp-b",
});
ok("section_summaries + axis_notes 분리 · meta 매핑");

// ---------------------------------------------------------------------------
section("5) DB payload 유지 vs 클라이언트 strip · 비mutate");

const workPayload = {
  format: WORK_COLLEAGUE_DEEP_FORMAT,
  report,
};
assert.ok(workPayload.report.context_output);

const forClient = stripWorkContextOutputForClient(workPayload);
assert.equal(forClient.report.context_output, undefined);
assert.ok(workPayload.report.context_output, "원본 mutate 금지");
assert.equal(forClient.format, WORK_COLLEAGUE_DEEP_FORMAT);
assert.equal(forClient.report.headline, report.headline);
assert.deepEqual(forClient.report.meta, report.meta);
assert.deepEqual(forClient.report.office, report.office);

const bodyOnly = omitWorkContextOutputFromReport(report);
assert.equal(bodyOnly.context_output, undefined);
assert.ok(report.context_output, "omit도 원본 유지");
ok("strip/omit: 클라이언트만 제거, DB 원본 유지");

// ---------------------------------------------------------------------------
section("6) context_output 제외 body 결정론 · 기존 필드 세트");

const { context_output: _c1, ...body1 } = buildWorkColleagueReport(baseParams);
const { context_output: _c2, ...body2 } = buildWorkColleagueReport(baseParams);
assert.deepEqual(body1, body2);
assert.deepEqual(Object.keys(body1).sort(), [
  "canonical_projections",
  "headline",
  "meta",
  "office",
  "one_line_definition",
  "snapshot_panel",
  "summary_line",
].sort());
ok("기존 필드 세트 + 결정론");

// ---------------------------------------------------------------------------
section("7) ViewModel 비크래시");

const vm = buildWorkReportViewModel(report, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));
ok("ViewModel context_output 미소비");

console.log("\nAll work-context-output tests passed.");
