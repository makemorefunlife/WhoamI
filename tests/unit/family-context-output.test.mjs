/**
 * Family Context Output — ctx/section과 100% 동일 매핑 + 기존 body 회귀.
 * Run: npx tsx tests/unit/family-context-output.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyRuleContext } from "../../lib/relationship/familyParent/buildFamilyRuleContext.ts";
import {
  buildFamilyContextOutput,
  FAMILY_CONTEXT_OUTPUT_SCHEMA_VERSION,
} from "../../lib/relationship/familyParent/familyContextOutput.ts";
import { stripFamilyContextOutputForClient } from "../../lib/relationship/familyParent/stripFamilyContextOutputForClient.ts";
import { omitFamilyContextOutputFromReport } from "../../lib/relationship/familyParent/stripFamilyContextOutputForClient.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts";
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

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
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
section("1) context_output이 리포트에 붙고 schema가 맞음");

const report = buildFamilyParentReport(baseParams);
assert.ok(report.context_output, "context_output must exist");
assert.equal(report.context_output.schema_version, FAMILY_CONTEXT_OUTPUT_SCHEMA_VERSION);
assert.equal(report.context_output.schema_version, "context_output_v1");
assert.equal(report.context_output.domain, "family");
assert.deepEqual(report.context_output.section_summaries, {});
ok("context_output 존재 + schema_version/domain + 빈 section_summaries");

// ---------------------------------------------------------------------------
section("2) grade/scores/signals가 ctx와 100% 동일");

const ctx = buildFamilyRuleContext(baseParams);
const mapped = buildFamilyContextOutput(ctx, report.family, {
  personCoreMeta: null,
});

assert.equal(mapped.grade, ctx.grade);
assert.deepEqual(mapped.scores, ctx.masterScores);
assert.deepEqual(mapped.signals, ctx.familyPairAnalysis.scoringSignals);
assert.equal(report.context_output.grade, report.meta.grade);
assert.equal(report.context_output.scores.bond, report.meta.bond_pct);
assert.equal(report.context_output.scores.synergy, report.meta.synergy_pct);
assert.equal(report.context_output.scores.risk, report.meta.risk_pct);
assert.deepEqual(
  report.context_output.signals,
  ctx.familyPairAnalysis.scoringSignals,
);
ok("grade/scores/signals ≡ ctx / meta");

// ---------------------------------------------------------------------------
section("3) axis_notes·dominant_categories는 section/ctx 재사용");

assert.equal(
  mapped.axis_notes.decision_style,
  report.family.section_relationship_index?.decision_axis_note ?? null,
);
assert.deepEqual(mapped.section_summaries, {});
assert.equal(
  mapped.dominant_categories.child_archetype.category,
  ctx.familyPairAnalysis.childSignals.dominantArchetype,
);
assert.equal(
  mapped.dominant_categories.child_communication.category,
  ctx.familyPairAnalysis.childSignals.communicationStyle,
);
assert.equal(
  mapped.dominant_categories.parent_support_strength.category,
  ctx.tenGod.parentProfile.support_strength,
);
assert.equal(
  mapped.dominant_categories.study_type.category,
  report.family.section_talent.study_type,
);
assert.equal(
  mapped.dominant_categories.wealth_vessel.category,
  report.family.section_talent.wealth_vessel,
);
// psych 없으면 family_role 없음
assert.equal(mapped.dominant_categories.family_role, undefined);
ok("axis_notes / dominant_categories ≡ section·ctx (재계산 없음)");

// ---------------------------------------------------------------------------
section("4) psych + personCoreMeta 있을 때 family_role·meta 매핑");

const withPsych = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    empathy: 72,
    conflict_style: 55,
    resilience: 48,
    recognition: 61,
    energy_style: 70,
    decision_style: 75,
  }),
  psychMasterB: samplePsych({
    decision_style: 20,
    empathy: 40,
  }),
  personCoreMeta: {
    reportIdA: "rep-a",
    reportIdB: "rep-b",
    inputFingerprintA: "fp-a",
    inputFingerprintB: "fp-b",
  },
});
assert.ok(withPsych.family.section_family_role);
assert.equal(
  withPsych.context_output.dominant_categories.family_role.category,
  withPsych.family.section_family_role.child_role,
);
assert.deepEqual(withPsych.context_output.meta, {
  reportIdA: "rep-a",
  reportIdB: "rep-b",
  inputFingerprintA: "fp-a",
  inputFingerprintB: "fp-b",
});
assert.equal(
  withPsych.context_output.axis_notes.decision_style,
  withPsych.family.section_relationship_index.decision_axis_note,
);
ok("family_role + meta + decision_axis_note 매핑");

// ---------------------------------------------------------------------------
section("5) context_output 제외 시 기존 body 필드 세트·값 안정");

const { context_output: _co1, ...body1 } = buildFamilyParentReport(baseParams);
const { context_output: _co2, ...body2 } = buildFamilyParentReport(baseParams);
assert.deepEqual(body1, body2, "동일 입력 → context_output 제외 body 완전 동일");

const expectedKeys = [
  "canonical_projections",
  "headline",
  "summary_line",
  "one_line_family",
  "snapshot_panel",
  "family",
  "meta",
];
assert.deepEqual(Object.keys(body1).sort(), expectedKeys.sort());
assert.ok(body1.family.section_child_dna?.genius_title);
assert.ok(Array.isArray(body1.family.section_compare_table));
assert.equal(body1.family.section_compare_table.length, 6);
ok("기존 필드 세트 유지 + 결정론");

// ---------------------------------------------------------------------------
section("6) ViewModel은 context_output을 무시하고 정상 동작");

const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));
ok("ViewModel 비크래시 (context_output 미소비)");

// ---------------------------------------------------------------------------
section("7) correction_style raw bucket은 dominant에 없음(재호출 회피)");

assert.equal(
  report.context_output.dominant_categories.correction_style,
  undefined,
);
ok("correction_style 미포함 — section에 bucket 키 없음");

// ---------------------------------------------------------------------------
section("8) DB payload 유지 vs 클라이언트 응답 strip");

const familyPayload = {
  format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
  report,
};
assert.ok(
  familyPayload.report.context_output,
  "생성 결과(report)에 context_output 존재",
);
assert.ok(
  familyPayload.report.context_output.dominant_categories.child_archetype,
  "DB 저장용 payload는 context_output 유지",
);

const forClient = stripFamilyContextOutputForClient(familyPayload);
assert.equal(
  forClient.report.context_output,
  undefined,
  "클라이언트 반환 사본에는 context_output 없음",
);
assert.ok(
  familyPayload.report.context_output,
  "원본 familyPayload는 mutate되지 않음",
);
assert.equal(forClient.format, FAMILY_PARENT_CHILD_DEEP_FORMAT);
assert.equal(forClient.report.headline, report.headline);
assert.deepEqual(forClient.report.meta, report.meta);
assert.deepEqual(forClient.report.family, report.family);
ok("strip: 클라이언트만 제거, DB 원본·기타 필드 유지");

// ---------------------------------------------------------------------------
section("9) detail/log용 report-body omit — 원본 유지");

const omittedBody = omitFamilyContextOutputFromReport(report);
assert.equal(omittedBody.context_output, undefined);
assert.ok(report.context_output, "omit 후에도 원본에 context_output 유지");
assert.equal(omittedBody.headline, report.headline);
assert.deepEqual(omittedBody.meta, report.meta);
assert.deepEqual(omittedBody.family, report.family);

const logSnap = parseAnalysisLogSnapshot(
  {
    id: "log-1",
    analysis_level: "premium",
    relationship_kind: "family",
    result_format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    created_at: "2026-07-23T00:00:00.000Z",
    summary_title: "t",
    summary_subtitle: "s",
    result_snapshot: { report },
  },
  "family",
);
assert.equal(logSnap.kind, "family");
assert.ok(logSnap.snapshot.familyDeep);
assert.equal(
  logSnap.snapshot.familyDeep.context_output,
  undefined,
  "analysis log snapshot에는 context_output 없음",
);
assert.ok(report.context_output, "로그 파싱이 원본 report를 mutate하지 않음");
ok("omit + log snapshot: detail/log 경로 비노출");

// ---------------------------------------------------------------------------
section("10) Phase 5-1 — study/wealth align · 판정 불변 · omit");

assert.equal(
  report.context_output.dominant_categories.study_align,
  undefined,
  "psych 없으면 study_align omit",
);
assert.equal(
  report.context_output.dominant_categories.wealth_align,
  undefined,
  "psych 없으면 wealth_align omit",
);

const midPsych = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    thinking_style: 50,
    structure: 50,
    practicality: 50,
    self_control: 50,
  }),
});
assert.equal(
  midPsych.context_output.dominant_categories.study_align,
  undefined,
  "mid-range study_align omit",
);
assert.equal(
  midPsych.context_output.dominant_categories.wealth_align,
  undefined,
  "mid-range wealth_align omit",
);
assert.equal(
  midPsych.family.section_talent.study_type,
  report.family.section_talent.study_type,
  "study_type pick 불변",
);
assert.equal(
  midPsych.family.section_talent.wealth_vessel,
  report.family.section_talent.wealth_vessel,
  "wealth_vessel pick 불변",
);
assert.equal(
  midPsych.family.section_talent.study_type_note,
  report.family.section_talent.study_type_note,
  "study 문구 불변",
);
assert.equal(
  midPsych.family.section_talent.wealth_vessel_note,
  report.family.section_talent.wealth_vessel_note,
  "wealth 문구 불변",
);

const highPsych = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    thinking_style: 80,
    structure: 70,
    practicality: 75,
    self_control: 70,
  }),
});
assert.equal(
  highPsych.context_output.dominant_categories.study_align.category,
  "confirms",
);
assert.equal(
  highPsych.context_output.dominant_categories.wealth_align.category,
  "confirms",
);
assert.equal(
  highPsych.family.section_talent.study_type,
  report.family.section_talent.study_type,
);
assert.equal(
  highPsych.family.section_talent.wealth_vessel,
  report.family.section_talent.wealth_vessel,
);

const lowPsych = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    thinking_style: 20,
    structure: 25,
    practicality: 15,
    self_control: 30,
  }),
});
assert.equal(
  lowPsych.context_output.dominant_categories.study_align.category,
  "caution",
);
assert.equal(
  lowPsych.context_output.dominant_categories.wealth_align.category,
  "caution",
);

const strippedHigh = stripFamilyContextOutputForClient({
  format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
  report: highPsych,
});
assert.equal(strippedHigh.report.context_output, undefined);
assert.ok(highPsych.context_output.dominant_categories.study_align);
ok("Phase 5-1 study/wealth align + strip 유지");

console.log("\nAll family-context-output tests passed.");
