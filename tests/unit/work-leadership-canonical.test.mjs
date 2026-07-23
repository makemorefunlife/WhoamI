/**
 * Phase 6-2a — Work leadership_split canonical consistency.
 * Architecture: one finalized judgment → section = CO = role_matrix VM.
 * Run: npx tsx tests/unit/work-leadership-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { resolveLeadershipRoleSplit } from "../../lib/relationship/workColleague/officeLanguage.ts";
import { refineLeadershipRoleSplit } from "../../lib/relationship/workColleague/officePsychFit.ts";
import {
  buildWorkLeadershipCanonical,
  leadershipJudgmentFields,
  WORK_LEADERSHIP_CANONICAL_SOURCE,
  WORK_LEADERSHIP_PERSISTENCE_PATH,
  WORK_LEADERSHIP_PSYCH_MODE_LEGACY,
  WORK_LEADERSHIP_PSYCH_MODE_WITH_PSYCH,
} from "../../lib/relationship/workColleague/workLeadershipCanonical.ts";
import { leadershipContextCategoriesFromSplit } from "../../lib/relationship/workColleague/workContextOutput.ts";
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

const psychA = samplePsych({
  practicality: 80,
  structure: 30,
  self_control: 30,
  empathy: 40,
});
const psychB = samplePsych({
  practicality: 30,
  structure: 80,
  self_control: 75,
  empathy: 70,
});

// ---------------------------------------------------------------------------
section("1) Canonical wrapper — source / psychMode / path (wrap-only)");

const refinedNoPsych = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA: null,
  psychB: null,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
const canonicalNoPsych = buildWorkLeadershipCanonical(refinedNoPsych, {
  base: baseSplit,
});
assert.ok(canonicalNoPsych);
assert.equal(canonicalNoPsych.source, WORK_LEADERSHIP_CANONICAL_SOURCE);
assert.equal(canonicalNoPsych.psychMode, WORK_LEADERSHIP_PSYCH_MODE_LEGACY);
assert.equal(
  canonicalNoPsych.persistencePath,
  WORK_LEADERSHIP_PERSISTENCE_PATH,
);
assert.deepEqual(
  leadershipJudgmentFields(canonicalNoPsych.value),
  leadershipJudgmentFields(refinedNoPsych),
);
assert.deepEqual(
  leadershipJudgmentFields(canonicalNoPsych.value),
  leadershipJudgmentFields(baseSplit),
);

const refinedWithPsych = refineLeadershipRoleSplit({
  base: baseSplit,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychA,
  psychB,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
const canonicalWithPsych = buildWorkLeadershipCanonical(refinedWithPsych, {
  base: baseSplit,
});
assert.ok(canonicalWithPsych);
assert.equal(canonicalWithPsych.psychMode, WORK_LEADERSHIP_PSYCH_MODE_WITH_PSYCH);
assert.deepEqual(
  leadershipJudgmentFields(canonicalWithPsych.value),
  leadershipJudgmentFields(refinedWithPsych),
);
// Wrap must not alter refined judgment fields
assert.equal(canonicalWithPsych.value, refinedWithPsych);
ok("canonical meta + soft/none psychMode (wrap-only)");

// ---------------------------------------------------------------------------
section("2) Cross-consumer equality — section = CO = role_matrix");

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");
const report = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "ko-KR",
});

const sectionLead = report.office.section_roles.leadership_split;
assert.ok(sectionLead);
const sectionFields = leadershipJudgmentFields(sectionLead);

assert.equal(
  report.context_output.dominant_categories.external_lead.category,
  sectionFields.external_lead,
);
assert.equal(
  report.context_output.dominant_categories.internal_qa_lead.category,
  sectionFields.internal_qa_lead,
);
assert.equal(
  report.context_output.dominant_categories.leadership_confidence?.category,
  sectionFields.confidence,
);
assert.equal(
  report.context_output.dominant_categories.leadership_align?.category,
  sectionFields.align,
);
assert.equal(
  report.context_output.section_summaries.leadership,
  sectionLead.summary,
);

const vm = buildWorkReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
  locale: "ko-KR",
});
const roleMatrix = vm.sections.find((s) => s.type === "role_matrix");
assert.ok(roleMatrix?.leadershipSplit);
assert.deepEqual(
  leadershipJudgmentFields(roleMatrix.leadershipSplit),
  sectionFields,
);
ok("section ≡ CO ≡ role_matrix judgment fields");

// ---------------------------------------------------------------------------
section("3) Consumer non-recalculation — CO/VM ignore irrelevant raw change");

const catsA = leadershipContextCategoriesFromSplit(sectionLead);
const mutatedLead = {
  ...sectionLead,
  // keep judgment; only summary prose would differ — judgment fields fixed
};
const catsB = leadershipContextCategoriesFromSplit(mutatedLead);
assert.deepEqual(catsA, catsB);

// Pure CO mapping does not depend on workSignals — only on leadership_split
const officeClone = structuredClone(report.office);
officeClone.section_roles.leadership_split = sectionLead;
const catsFromOffice = leadershipContextCategoriesFromSplit(
  officeClone.section_roles.leadership_split,
);
assert.deepEqual(catsFromOffice, catsA);

// Mutate DNA contribution (irrelevant) — leadership categories unchanged
officeClone.section_dna.person_a.contribution_style = "support_care";
assert.deepEqual(
  leadershipContextCategoriesFromSplit(
    officeClone.section_roles.leadership_split,
  ),
  catsA,
);

const vm2 = buildWorkReportViewModel(
  { ...report, office: officeClone },
  {
    viewerIsReportA: true,
    myName: "Alex",
    partnerName: "Jordan",
    locale: "ko-KR",
  },
);
const rm2 = vm2.sections.find((s) => s.type === "role_matrix");
assert.deepEqual(
  leadershipJudgmentFields(rm2.leadershipSplit),
  sectionFields,
);
ok("non-recalculation — leadership stable when unrelated office fields change");

// ---------------------------------------------------------------------------
section("4) Locale — judgment identical; summary may differ");

const reportEn = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "en-US",
});
assert.deepEqual(
  leadershipJudgmentFields(reportEn.office.section_roles.leadership_split),
  sectionFields,
);
assert.equal(
  reportEn.context_output.dominant_categories.external_lead.category,
  sectionFields.external_lead,
);
ok("ko/en same leadership judgment");

// ---------------------------------------------------------------------------
section("5) Persistence — serialize + strip");

const json = JSON.stringify({
  format: WORK_COLLEAGUE_DEEP_FORMAT,
  report,
});
const parsed = JSON.parse(json);
assert.equal(
  parsed.report.office.section_roles.leadership_split.external_lead,
  sectionFields.external_lead,
);
assert.equal(parsed.report.context_output.schema_version, "context_output_v1");

const stripped = stripWorkContextOutputForClient({
  format: WORK_COLLEAGUE_DEEP_FORMAT,
  report,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.office.section_roles.leadership_split);
assert.ok(report.context_output.dominant_categories.external_lead);
ok("JSON round-trip + client strip; section leadership retained");

console.log("\nAll work-leadership-canonical tests passed.");
