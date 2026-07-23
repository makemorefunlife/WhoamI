/**
 * Romantic deterministic input context — 매핑·strip·signals 누락 안전.
 * Run: npx tsx tests/unit/romantic-context-input.test.mjs
 */
import assert from "node:assert/strict";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { mapSajuBundleToMasterJson } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";
import { prepareRomanticSajuDeepRun } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";
import {
  buildRomanticContextInput,
  collectRomanticDynamicsTypedSnapshot,
  ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION,
} from "../../lib/relationship/romantic/romanticContextInput.ts";
import {
  omitRomanticContextInputFromReport,
  stripRomanticContextInputForClient,
} from "../../lib/relationship/romantic/stripRomanticContextInputForClient.ts";
import { parseAnalysisLogSnapshot } from "../../lib/relationship/detail/parseAnalysisLogSnapshot.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { sajuJsonToPillars } from "../../lib/saju/pairChartAnalysis.ts";
import { buildRomanticDynamicsDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";
import { hasDayStemRootInDayBranch } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function toSajuJson(bundle) {
  return {
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    relations: bundle.relations,
    shinsals: bundle.shinsals,
  };
}

const birthA = { date: "1990-05-15", time: "14:30", place: "서울" };
const birthB = { date: "1992-08-20", time: "09:00", place: "부산" };
const b1 = calculateSajuBundle({
  birthDate: birthA.date,
  birthTime: birthA.time,
});
const b2 = calculateSajuBundle({
  birthDate: birthB.date,
  birthTime: birthB.time,
});
const masterA = mapSajuBundleToMasterJson({
  bundle: b1,
  birthDate: birthA.date,
  birthTime: birthA.time,
  birthTimeUnknown: false,
});
const masterB = mapSajuBundleToMasterJson({
  bundle: b2,
  birthDate: birthB.date,
  birthTime: birthB.time,
  birthTimeUnknown: false,
});

const baseRun = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  birthA,
  birthB,
  sajuJsonA: toSajuJson(b1),
  sajuJsonB: toSajuJson(b2),
  sajuMasterA: masterA,
  sajuMasterB: masterB,
  surveyProfileA: null,
  surveyProfileB: null,
  locale: "ko",
};

// ---------------------------------------------------------------------------
section("1) prepare → romanticContextInput schema/domain/grade/scores");

const prepared = prepareRomanticSajuDeepRun(baseRun);
const ctxIn = prepared.romanticContextInput;
assert.ok(ctxIn);
assert.equal(ctxIn.schema_version, ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION);
assert.equal(ctxIn.schema_version, "context_output_v1");
assert.equal(ctxIn.domain, "romantic");
assert.equal(ctxIn.grade, prepared.opening.grade);
assert.deepEqual(ctxIn.scores, prepared.opening.event_scores.overall);
assert.deepEqual(ctxIn.event_scores, prepared.opening.event_scores);
ok("schema/domain/grade/scores ≡ prepare opening");

// ---------------------------------------------------------------------------
section("2) romantic_signals · compare bands ≡ master");

const rsA = masterA.domain_signals.romantic_signals;
const rsB = masterB.domain_signals.romantic_signals;
assert.deepEqual(ctxIn.signals.person_a, rsA);
assert.deepEqual(ctxIn.signals.person_b, rsB);
assert.equal(
  ctxIn.dominant_categories.compare_expression_a.category,
  rsA.expression_style.expression_band,
);
assert.equal(
  ctxIn.dominant_categories.compare_conflict_b.category,
  rsB.conflict_response.conflict_band,
);
assert.equal(
  ctxIn.dominant_categories.compare_affection_a.category,
  rsA.affection_language.affection_band,
);
ok("signals + compare bands ≡ romantic_signals");

// ---------------------------------------------------------------------------
section("3) dynamics raw ≡ collect snapshot (재매핑 동일)");

const chartA = buildChartContext(sajuJsonToPillars(b1.saju));
const chartB = buildChartContext(sajuJsonToPillars(b2.saju));
const snap = collectRomanticDynamicsTypedSnapshot({
  profileA: null,
  profileB: null,
  romanticA: rsA,
  romanticB: rsB,
  chartA,
  chartB,
  dayStemInteraction: prepared.ctx.pairAnalysis.dayStemInteraction,
});
assert.equal(
  ctxIn.dominant_categories.balance_a.category,
  snap.balance.bandA,
);
assert.equal(
  ctxIn.dominant_categories.recovery_b.category,
  snap.recovery.bandB,
);
assert.equal(
  ctxIn.dominant_categories.residual_a.category,
  snap.residualA,
);
assert.equal(
  ctxIn.dominant_categories.role_primary.category,
  snap.rolePlay.primaryFrame,
);
assert.equal(
  ctxIn.dominant_categories.role_saju.category,
  snap.rolePlay.sajuFrame,
);
assert.equal(
  ctxIn.dominant_categories.saju_frame_direction.category,
  snap.sajuFrameDirection,
);
assert.ok(!("section_summaries" in ctxIn));
ok("dynamics categories ≡ typed snapshot · no section_summaries");

// ---------------------------------------------------------------------------
section("4) signals 누락 시 안전 — dynamics/compare 생략, grade 유지");

const legacyPrepared = prepareRomanticSajuDeepRun({
  ...baseRun,
  sajuMasterA: {
    ...masterA,
    domain_signals: {
      ...masterA.domain_signals,
      romantic_signals: undefined,
    },
  },
  sajuMasterB: masterB,
});
const legacy = legacyPrepared.romanticContextInput;
assert.equal(legacy.grade, legacyPrepared.opening.grade);
assert.equal(legacy.signals.person_a, undefined);
assert.ok(legacy.signals.person_b);
assert.equal(legacy.dominant_categories.balance_a, undefined);
assert.equal(legacy.dominant_categories.compare_expression_a, undefined);
assert.ok(legacy.dominant_categories.compare_expression_b);
ok("legacy missing signalsA — no crash, dynamics omitted");

const noMaster = prepareRomanticSajuDeepRun({
  ...baseRun,
  sajuMasterA: null,
  sajuMasterB: null,
});
assert.ok(noMaster.romanticContextInput);
assert.deepEqual(noMaster.romanticContextInput.signals, {});
assert.equal(
  noMaster.romanticContextInput.dominant_categories.balance_a,
  undefined,
);
ok("no master — empty signals, grade/scores still present");

// ---------------------------------------------------------------------------
section("5) build 순수 매핑 — 동일 입력 → 동일 출력");

const mapped1 = buildRomanticContextInput({
  grade: prepared.opening.grade,
  eventScores: prepared.opening.event_scores,
  romanticSignalsA: rsA,
  romanticSignalsB: rsB,
  dynamics: snap,
  expressionSpeedDirection: "balanced",
  axisNotes: { intimacy: null, conflict: null },
});
const mapped2 = buildRomanticContextInput({
  grade: prepared.opening.grade,
  eventScores: prepared.opening.event_scores,
  romanticSignalsA: rsA,
  romanticSignalsB: rsB,
  dynamics: snap,
  expressionSpeedDirection: "balanced",
  axisNotes: { intimacy: null, conflict: null },
});
assert.deepEqual(mapped1, mapped2);
ok("pure mapping deterministic");

// ---------------------------------------------------------------------------
section("6) DB 유지 · strip/omit 비mutate · log snapshot");

const reportBody = {
  section_1_summary: {
    relationship_name: "t",
    one_line_summary: "s",
    grade: ctxIn.grade,
  },
  section_2_nature: {
    a_nature: {
      description: "ad",
      meeting_b: "m",
      together_change: "t",
    },
    b_nature: {
      description: "bd",
      meeting_a: "m",
      together_change: "t",
    },
  },
  section_3_conversation_patterns: {},
  section_4_hidden_hearts: {},
  section_5_action: {},
  section_6_timeline: {},
  romantic_context_input: ctxIn,
  meta: {},
};
const payload = { format: ROMANTIC_SAJU_DEEP_FORMAT, report: reportBody };
assert.ok(payload.report.romantic_context_input);

const forClient = stripRomanticContextInputForClient(payload);
assert.equal(forClient.report.romantic_context_input, undefined);
assert.ok(payload.report.romantic_context_input, "strip 원본 유지");

const omitted = omitRomanticContextInputFromReport(reportBody);
assert.equal(omitted.romantic_context_input, undefined);
assert.ok(reportBody.romantic_context_input);

const logSnap = parseAnalysisLogSnapshot(
  {
    id: "log-r1",
    result_format: ROMANTIC_SAJU_DEEP_FORMAT,
    result_snapshot: { report: reportBody },
  },
  "romantic",
);
assert.equal(logSnap.snapshot.romanticDeep.romantic_context_input, undefined);
assert.ok(reportBody.romantic_context_input, "log omit 원본 유지");

const { romantic_context_input: _x, ...sans } = reportBody;
assert.deepEqual(forClient.report, sans);
ok("strip/omit/log — 클라이언트 비노출, 원본 유지");

// ---------------------------------------------------------------------------
section("7) dynamics snapshot 재사용 — digest 동일 · resolver 미재호출");

const rootedA = hasDayStemRootInDayBranch(chartA);
const rootedB = hasDayStemRootInDayBranch(chartB);
const dayStemInteraction = prepared.ctx.pairAnalysis.dayStemInteraction;
const legacyDigest = buildRomanticDynamicsDigest({
  nicknameA: baseRun.nicknameA,
  nicknameB: baseRun.nicknameB,
  profileA: null,
  profileB: null,
  romanticA: rsA,
  romanticB: rsB,
  rootedA,
  rootedB,
  dayStemInteraction,
  yongsinA: masterA.yongsin_estimate ?? null,
  yongsinB: masterB.yongsin_estimate ?? null,
});
const fromSnap = buildRomanticDynamicsDigest({
  nicknameA: baseRun.nicknameA,
  nicknameB: baseRun.nicknameB,
  romanticA: rsA,
  romanticB: rsB,
  dayStemInteraction,
  yongsinA: masterA.yongsin_estimate ?? null,
  yongsinB: masterB.yongsin_estimate ?? null,
  dynamics: snap,
});
assert.equal(fromSnap, legacyDigest, "snapshot digest ≡ legacy digest");

const poisonedA = {
  ...rsA,
  expression_style: { food_count: 99, expression_band: "expressive" },
  affection_language: {
    wealth_count: 99,
    seal_count: 0,
    affection_band: "action_gift",
  },
  conflict_response: {
    ...rsA.conflict_response,
    officer_count: 99,
    day_branch_tension_hits: [{ type: "충" }, { type: "형" }],
  },
  communication_style: {
    self_count: 0,
    seal_count: 99,
    communication_band: "considerate",
  },
};
const withPoison = buildRomanticDynamicsDigest({
  nicknameA: baseRun.nicknameA,
  nicknameB: baseRun.nicknameB,
  romanticA: poisonedA,
  romanticB: rsB,
  dayStemInteraction,
  yongsinA: masterA.yongsin_estimate ?? null,
  yongsinB: masterB.yongsin_estimate ?? null,
  dynamics: snap,
});
assert.equal(
  withPoison,
  fromSnap,
  "dynamics 있으면 poisoned romantic으로 resolver 재실행 안 함",
);
assert.ok(
  prepared.userPrompt.includes(fromSnap),
  "prepare userPrompt가 snapshot 기반 digest와 동일 문자열 포함",
);
ok("digest snapshot 재사용 · prepare 경로 일치");

// ---------------------------------------------------------------------------
section("8) Phase 5-1 — compare psych twin raw · band 불변 · profile 없으면 omit");

assert.equal(
  ctxIn.dominant_categories.compare_expression_psych_a,
  undefined,
  "survey profile 없으면 psych twin omit",
);
assert.equal(
  ctxIn.dominant_categories.compare_conflict_psych_b,
  undefined,
);

function sampleProfile(overrides = {}) {
  const secondary_axes = Object.fromEntries(
    [
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
    ].map((k) => [k, 50]),
  );
  Object.assign(secondary_axes, overrides);
  return {
    profile_type: "current_self",
    primary_axes: {
      autonomy: 50,
      connection: 50,
      stability: 50,
      growth: 50,
      structure: 50,
      adaptability: 50,
    },
    secondary_axes,
    personalization: { primary_concern: null },
    meta: {
      survey_version: "v2",
      completed_at: "2026-01-01T00:00:00.000Z",
      completion_time_seconds: null,
    },
  };
}

const profileA = sampleProfile({
  energy_style: 72,
  conflict_style: 33,
  empathy: 61,
  self_control: 44,
  decision_style: 80,
  structure: 55,
});
const profileB = sampleProfile({
  energy_style: 40,
  conflict_style: 70,
  empathy: 50,
  self_control: 60,
  decision_style: 35,
  structure: 90,
});

const withPsychTwin = buildRomanticContextInput({
  grade: prepared.opening.grade,
  eventScores: prepared.opening.event_scores,
  romanticSignalsA: rsA,
  romanticSignalsB: rsB,
  dynamics: snap,
  expressionSpeedDirection: "balanced",
  profileA,
  profileB,
  axisNotes: { intimacy: null, conflict: null },
});

assert.equal(
  withPsychTwin.dominant_categories.compare_expression_a.category,
  rsA.expression_style.expression_band,
  "saju band 불변",
);
assert.equal(
  withPsychTwin.dominant_categories.compare_expression_psych_a.category,
  "energy_style",
);
assert.equal(
  withPsychTwin.dominant_categories.compare_expression_psych_a.scores.score,
  72,
);
assert.equal(
  withPsychTwin.dominant_categories.compare_conflict_psych_b.category,
  "conflict_style",
);
assert.equal(
  withPsychTwin.dominant_categories.compare_conflict_psych_b.scores.score,
  70,
);
assert.equal(
  withPsychTwin.dominant_categories.compare_affection_psych_a.scores.score,
  61,
);
assert.equal(
  withPsychTwin.dominant_categories.compare_stress_psych_a.category,
  "self_control",
);
assert.equal(
  withPsychTwin.dominant_categories.compare_decision_psych_b.scores.score,
  35,
);
assert.equal(
  withPsychTwin.dominant_categories.compare_communication_psych_b.scores.score,
  90,
);

const onlyA = buildRomanticContextInput({
  grade: prepared.opening.grade,
  eventScores: prepared.opening.event_scores,
  romanticSignalsA: rsA,
  romanticSignalsB: rsB,
  dynamics: snap,
  profileA,
  profileB: null,
});
assert.ok(onlyA.dominant_categories.compare_expression_psych_a);
assert.equal(
  onlyA.dominant_categories.compare_expression_psych_b,
  undefined,
  "B profile 없으면 B twin omit",
);

const preparedWithSurvey = prepareRomanticSajuDeepRun({
  ...baseRun,
  surveyProfileA: profileA,
  surveyProfileB: profileB,
});
assert.equal(
  preparedWithSurvey.romanticContextInput.dominant_categories
    .compare_expression_psych_a.scores.score,
  72,
);
assert.ok(
  preparedWithSurvey.romanticContextInput.dominant_categories
    .compare_expression_align,
  "Phase 5-3 — expression align 확장",
);
assert.ok(
  ["expressive", "reserved", "balanced"].includes(
    preparedWithSurvey.romanticContextInput.dominant_categories
      .compare_expression_a.category,
  ),
  "expression lean은 허용 band만",
);
assert.ok(
  ["direct", "considerate", "balanced"].includes(
    preparedWithSurvey.romanticContextInput.dominant_categories
      .compare_communication_a.category,
  ),
  "소통 방식 lean은 허용 band만",
);
assert.ok(
  preparedWithSurvey.romanticContextInput.dominant_categories
    .compare_communication_align,
  "Phase 5-3 — communication align 확장",
);
assert.ok(
  preparedWithSurvey.romanticContextInput.dominant_categories
    .compare_conflict_align,
  "Phase 5-3 — conflict align 확장",
);
assert.ok(
  preparedWithSurvey.romanticContextInput.dominant_categories
    .compare_conflict_confidence,
);
assert.ok(
  preparedWithSurvey.userPrompt.includes("compare_conflict"),
  "갈등 반응 SSOT가 prompt에 전달",
);
assert.ok(
  preparedWithSurvey.userPrompt.includes("compare_expression"),
  "감정 표현 SSOT가 prompt에 전달",
);
assert.ok(
  preparedWithSurvey.userPrompt.includes("romantic_signals"),
  "digest/prompt 경로 유지",
);
assert.equal(
  preparedWithSurvey.userPrompt.includes("compare_expression_psych"),
  false,
  "다른 행 psych twin은 prompt에 새로 넣지 않음",
);

const strippedTwin = stripRomanticContextInputForClient({
  format: ROMANTIC_SAJU_DEEP_FORMAT,
  report: {
    ...reportBody,
    romantic_context_input: withPsychTwin,
  },
});
assert.equal(strippedTwin.report.romantic_context_input, undefined);
ok("Phase 5-1 compare psych twin + strip 유지");

console.log("\nAll romantic-context-input tests passed.");
