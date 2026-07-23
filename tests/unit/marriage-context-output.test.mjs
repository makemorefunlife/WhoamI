/**
 * Marriage/Cohabitation Context Output — ctx/section 매핑 + DB 유지 vs 클라이언트 strip.
 * Run: npx tsx tests/unit/marriage-context-output.test.mjs
 */
import assert from "node:assert/strict";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageRuleContext } from "../../lib/relationship/marriage/buildMarriageRuleContext.ts";
import {
  buildMarriageContextOutput,
  MARRIAGE_CONTEXT_OUTPUT_SCHEMA_VERSION,
} from "../../lib/relationship/marriage/marriageContextOutput.ts";
import {
  omitMarriageContextOutputFromReport,
  stripMarriageContextOutputForClient,
} from "../../lib/relationship/marriage/stripMarriageContextOutputForClient.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { COHABITATION_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/cohabitation/outputSchema.ts";
import { parseAnalysisLogSnapshot } from "../../lib/relationship/detail/parseAnalysisLogSnapshot.ts";
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

const report = buildMarriageReport(baseParams);
assert.ok(report.context_output);
assert.equal(
  report.context_output.schema_version,
  MARRIAGE_CONTEXT_OUTPUT_SCHEMA_VERSION,
);
assert.equal(report.context_output.schema_version, "context_output_v1");
assert.equal(report.context_output.domain, "cohabitation");
ok("context_output 존재 + schema/domain");

// ---------------------------------------------------------------------------
section("2) grade/scores/signals ≡ ctx · meta");

const ctx = buildMarriageRuleContext(baseParams);
const mapped = buildMarriageContextOutput(ctx, report.household, {
  personCoreMeta: null,
});

assert.equal(mapped.grade, ctx.grade);
assert.deepEqual(mapped.scores, ctx.masterScores);
assert.deepEqual(
  mapped.signals,
  ctx.marriagePairAnalysis.scoringSignals,
);
assert.equal(report.context_output.grade, report.meta.grade);
assert.equal(
  report.context_output.scores.activation,
  report.meta.romantic_fit_pct,
);
assert.equal(
  report.context_output.scores.benefit,
  report.meta.life_synergy_pct,
);
assert.equal(report.context_output.scores.risk, report.meta.home_risk_pct);
assert.deepEqual(
  report.context_output.signals,
  ctx.marriagePairAnalysis.scoringSignals,
);
ok("grade/scores/signals ≡ ctx / meta");

// ---------------------------------------------------------------------------
section("3) dominant ≡ ctx/section · axis_notes · summaries");

assert.equal(
  mapped.dominant_categories.parenting_style_a.category,
  ctx.tenGod.parentingA.style,
);
assert.equal(
  mapped.dominant_categories.parenting_style_b.category,
  ctx.tenGod.parentingB.style,
);
assert.equal(
  mapped.dominant_categories.attachment_lean_a.category,
  ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanA,
);
assert.equal(
  mapped.dominant_categories.bedroom_manner_a.category,
  report.household.section_bedroom.matrix.person_a.archetypes.manner,
);
assert.equal(
  mapped.dominant_categories.bedroom_manner_b.category,
  report.household.section_bedroom.matrix.person_b.archetypes.manner,
);
const cfoNick = report.household.section_money_chores.cfo_nickname;
if (cfoNick === baseParams.nicknameA) {
  assert.equal(mapped.dominant_categories.household_cfo?.category, "a");
} else if (cfoNick === baseParams.nicknameB) {
  assert.equal(mapped.dominant_categories.household_cfo?.category, "b");
} else {
  assert.equal(mapped.dominant_categories.household_cfo, undefined);
}
assert.equal(
  mapped.section_summaries.cfo_reason,
  report.household.section_money_chores.cfo_reason,
);
assert.equal(
  mapped.section_summaries.chores_guideline,
  report.household.section_money_chores.chores_guideline,
);
assert.equal(
  mapped.section_summaries.why_us,
  report.household.section_origin_story.why_us,
);
assert.equal(
  mapped.section_summaries.one_line_household,
  report.household.section_snapshot.one_line_household,
);
assert.equal(
  mapped.axis_notes.cfo,
  report.household.section_money_chores.cfo_axis_note ?? null,
);
assert.equal(
  mapped.dominant_categories.psych_practicality,
  undefined,
  "psych 없으면 practicality 제외",
);
ok("dominant/summaries/axis_notes ≡ ctx/section");

// ---------------------------------------------------------------------------
section("3b) household_cfo — 일치 / 불일치 / 동명이인 (폴백 없음)");

const moneyA = {
  ...report.household,
  section_money_chores: {
    ...report.household.section_money_chores,
    cfo_nickname: baseParams.nicknameA,
  },
};
const ctxForCfo = {
  ...ctx,
  tenGod: {
    ...ctx.tenGod,
    cfo: { ...ctx.tenGod.cfo, nickname: baseParams.nicknameA },
  },
};
assert.equal(
  buildMarriageContextOutput(ctxForCfo, moneyA).dominant_categories.household_cfo
    ?.category,
  "a",
);

const moneyB = {
  ...report.household,
  section_money_chores: {
    ...report.household.section_money_chores,
    cfo_nickname: baseParams.nicknameB,
  },
};
const ctxForCfoB = {
  ...ctx,
  tenGod: {
    ...ctx.tenGod,
    cfo: { ...ctx.tenGod.cfo, nickname: baseParams.nicknameB },
  },
};
assert.equal(
  buildMarriageContextOutput(ctxForCfoB, moneyB).dominant_categories.household_cfo
    ?.category,
  "b",
);

const moneyUnknown = {
  ...report.household,
  section_money_chores: {
    ...report.household.section_money_chores,
    cfo_nickname: "UnknownPerson",
  },
};
const ctxUnknown = {
  ...ctx,
  tenGod: {
    ...ctx.tenGod,
    cfo: { ...ctx.tenGod.cfo, nickname: "UnknownPerson" },
  },
};
assert.equal(
  buildMarriageContextOutput(ctxUnknown, moneyUnknown).dominant_categories
    .household_cfo,
  undefined,
  "불일치 시 a 폴백 없음",
);

const sameNameParams = {
  ...baseParams,
  nicknameA: "Sam",
  nicknameB: "Sam",
};
const sameReport = buildMarriageReport(sameNameParams);
const sameCtx = buildMarriageRuleContext(sameNameParams);
assert.equal(
  sameReport.context_output.dominant_categories.household_cfo,
  undefined,
  "동명이인 시 slot 생략",
);
assert.equal(
  buildMarriageContextOutput(sameCtx, sameReport.household).dominant_categories
    .household_cfo,
  undefined,
);
ok("CFO slot 일치/불일치/동명이인");

// ---------------------------------------------------------------------------
section("4) psych + personCoreMeta 시 axis notes · psych axes");

const withPsych = buildMarriageReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 80, self_control: 70 }),
  psychMasterB: samplePsych({ practicality: 30, self_control: 25 }),
  personCoreMeta: {
    reportIdA: "rep-a",
    reportIdB: "rep-b",
    inputFingerprintA: "fp-a",
    inputFingerprintB: "fp-b",
  },
});

assert.ok(withPsych.meta.psych_match);
assert.equal(
  withPsych.context_output.axis_notes.cfo,
  withPsych.household.section_money_chores.cfo_axis_note ?? null,
);
assert.equal(
  withPsych.context_output.axis_notes.energy_a,
  withPsych.household.section_dna.person_a.energy_axis_note ?? null,
);
assert.equal(
  withPsych.context_output.axis_notes.rejection,
  withPsych.household.section_bedroom.rejection_axis_note ?? null,
);
assert.equal(
  withPsych.context_output.axis_notes.parenting_role_a,
  withPsych.household.section_parenting.person_a_role_note ?? null,
);
assert.ok(withPsych.context_output.dominant_categories.psych_practicality);
assert.ok(withPsych.context_output.dominant_categories.psych_self_control);
assert.equal(
  withPsych.context_output.dominant_categories.psych_practicality.category,
  withPsych.meta.psych_match.axis_results.find((r) => r.axis_key === "practicality")
    ?.match_type,
);
assert.deepEqual(withPsych.context_output.meta, {
  reportIdA: "rep-a",
  reportIdB: "rep-b",
  inputFingerprintA: "fp-a",
  inputFingerprintB: "fp-b",
});
ok("psych axis notes + psych_practicality/self_control 매핑");

// ---------------------------------------------------------------------------
section("5) DB payload 유지 · strip/omit 비변형 · 클라이언트 제거");

const cohabitationPayload = {
  format: COHABITATION_DEEP_FORMAT,
  report,
};
assert.ok(cohabitationPayload.report.context_output);

const forClient = stripMarriageContextOutputForClient(cohabitationPayload);
assert.equal(forClient.report.context_output, undefined);
assert.ok(cohabitationPayload.report.context_output, "strip이 원본 mutate 금지");

const omitted = omitMarriageContextOutputFromReport(report);
assert.equal(omitted.context_output, undefined);
assert.ok(report.context_output, "omit 후에도 원본 유지");

const logSnap = parseAnalysisLogSnapshot(
  {
    id: "log-1",
    result_format: COHABITATION_DEEP_FORMAT,
    result_snapshot: { report },
  },
  "cohabitation",
);
assert.equal(logSnap.snapshot.cohabitationDeep.context_output, undefined);
assert.ok(report.context_output, "로그 파싱이 원본 mutate 금지");
ok("DB 유지 / strip·omit·log 비노출");

// ---------------------------------------------------------------------------
section("6) context_output 제외 body 결정론");

const { context_output: _c1, ...body1 } = buildMarriageReport(baseParams);
const { context_output: _c2, ...body2 } = buildMarriageReport(baseParams);
assert.deepEqual(body1, body2, "동일 입력 → context_output 제외 body 완전 동일");
ok("body 결정론");

// ---------------------------------------------------------------------------
section("7) ViewModel context_output 미소비");

const vm = buildMarriageReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
  locale: "ko-KR",
});
assert.ok(vm.sections.length > 0);
ok("ViewModel context_output 미소비");

// ---------------------------------------------------------------------------
section("8) strip 후 context_output 외 필드 동일");

const strippedReport = forClient.report;
const { context_output: _omit, ...originalSans } = report;
assert.deepEqual(strippedReport, originalSans);
ok("strip 후 나머지 필드 동일");

console.log("\nAll marriage-context-output tests passed.");
