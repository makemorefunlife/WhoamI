/**
 * Phase 6-2c — Marriage operating CFO canonical consistency.
 * Architecture: one finalized judgment → section = CO = ViewModel money_chores.
 * Separate from asset_management / cfo_power_struggle / bedroom_lead / chores.
 * Run: npx tsx tests/unit/marriage-operating-cfo-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { pickHouseholdCfo } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { refineHouseholdCfo } from "../../lib/relationship/marriage/marriageCfoConsumption.ts";
import {
  buildMarriageOperatingCfoCanonical,
  operatingCfoJudgmentFields,
  operatingCfoSideFromNickname,
  MARRIAGE_OPERATING_CFO_CANONICAL_SOURCE,
  MARRIAGE_OPERATING_CFO_PERSISTENCE_PATH,
  MARRIAGE_OPERATING_CFO_PSYCH_MODE_LEGACY,
  MARRIAGE_OPERATING_CFO_PSYCH_MODE_WITH_PSYCH,
} from "../../lib/relationship/marriage/marriageOperatingCfoCanonical.ts";
import { operatingCfoContextCategoriesFromMoney } from "../../lib/relationship/marriage/marriageContextOutput.ts";
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

function palace() {
  return {
    day_branch: "子",
    spouse_palace_branch: "丑",
    day_branch_hidden_stems: [],
    spouse_palace_hidden_stems: [],
    harmony_index: 0,
    tension_index: 0,
  };
}
function intimacy() {
  return {
    day_stem_rooted_in_spouse_palace: false,
    stem_combine_links: [],
    intimacy_index: 0,
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
assert.equal(basePick.nickname, "Alex");

const psychA = samplePsych({ practicality: 85, self_control: 80 });
const psychB = samplePsych({ practicality: 30, self_control: 35 });

// ---------------------------------------------------------------------------
section("1) Canonical wrapper — wrap-only after refine");

const refinedNoPsych = refineHouseholdCfo({
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
const canonicalNoPsych = buildMarriageOperatingCfoCanonical(refinedNoPsych, {
  base: basePick,
});
assert.ok(canonicalNoPsych);
assert.equal(
  canonicalNoPsych.source,
  MARRIAGE_OPERATING_CFO_CANONICAL_SOURCE,
);
assert.equal(
  canonicalNoPsych.psychMode,
  MARRIAGE_OPERATING_CFO_PSYCH_MODE_LEGACY,
);
assert.equal(
  canonicalNoPsych.persistencePath,
  MARRIAGE_OPERATING_CFO_PERSISTENCE_PATH,
);
assert.equal(canonicalNoPsych.value, refinedNoPsych);

const refinedWithPsych = refineHouseholdCfo({
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
  psychA,
  psychB,
  locale: "ko-KR",
});
const canonicalWithPsych = buildMarriageOperatingCfoCanonical(
  refinedWithPsych,
  { base: basePick },
);
assert.ok(canonicalWithPsych);
assert.equal(
  canonicalWithPsych.psychMode,
  MARRIAGE_OPERATING_CFO_PSYCH_MODE_WITH_PSYCH,
);
assert.equal(canonicalWithPsych.value, refinedWithPsych);
assert.equal(canonicalWithPsych.value.nickname, "Alex");
assert.equal(canonicalWithPsych.value.align, "confirms");
assert.equal(canonicalWithPsych.value.confidence, "high");
ok("canonical meta + soft/none psychMode (wrap-only)");

// ---------------------------------------------------------------------------
section("2) Cross-consumer equality — section = CO = ViewModel");

const report = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
  psychMasterA: psychA,
  psychMasterB: psychB,
  cohabitationSignalsA: {
    day_palace: palace(),
    hidden_stem_intimacy: intimacy(),
    wealth_officer_power: power(70, "high"),
  },
  cohabitationSignalsB: {
    day_palace: palace(),
    hidden_stem_intimacy: intimacy(),
    wealth_officer_power: power(40, "low"),
  },
});

const money = report.household.section_money_chores;
assert.ok(money.cfo_nickname);
const sectionFields = operatingCfoJudgmentFields({
  nickname: money.cfo_nickname,
  reason: money.cfo_reason,
  align: money.cfo_align,
  confidence: money.cfo_confidence,
  dual: money.cfo_dual,
});
assert.ok(sectionFields);

const coSide = report.context_output.dominant_categories.household_cfo?.category;
assert.equal(
  coSide,
  operatingCfoSideFromNickname(money.cfo_nickname, "Alex", "Jordan"),
);
assert.equal(
  report.context_output.dominant_categories.cfo_align?.category,
  sectionFields.align,
);
assert.equal(
  report.context_output.dominant_categories.cfo_confidence?.category,
  sectionFields.confidence,
);
assert.equal(
  report.context_output.section_summaries.cfo_reason,
  money.cfo_reason,
);

const vm = buildMarriageReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
  locale: "ko-KR",
});
const moneyVm = vm.sections.find((s) => s.type === "money_chores");
assert.ok(moneyVm);
assert.equal(moneyVm.cfoNickname, money.cfo_nickname);
assert.equal(moneyVm.cfoReason, money.cfo_reason);
ok("section ≡ CO ≡ ViewModel operating CFO judgment");

// ---------------------------------------------------------------------------
section("3) Consumer non-recalculation — CO maps section only");

const catsA = operatingCfoContextCategoriesFromMoney(
  money,
  "Alex",
  "Jordan",
);
const moneyClone = structuredClone(money);
moneyClone.chores_guideline = "MUTATED_CHORES_ONLY";
moneyClone.spending_style_note = "MUTATED_SPENDING_ONLY";
assert.deepEqual(
  operatingCfoContextCategoriesFromMoney(moneyClone, "Alex", "Jordan"),
  catsA,
);

const householdClone = structuredClone(report.household);
householdClone.section_money_chores = moneyClone;
const vm2 = buildMarriageReportViewModel(
  { ...report, household: householdClone },
  {
    viewerIsReportA: true,
    myName: "Alex",
    partnerName: "Jordan",
    locale: "ko-KR",
  },
);
const moneyVm2 = vm2.sections.find((s) => s.type === "money_chores");
assert.equal(moneyVm2.cfoNickname, money.cfo_nickname);
assert.equal(moneyVm2.cfoReason, money.cfo_reason);
ok("non-recalculation — CFO stable when chores/spending copy changes");

// ---------------------------------------------------------------------------
section("4) Locale — judgment identical; reason may differ");

const reportEn = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "en-US",
  psychMasterA: psychA,
  psychMasterB: psychB,
  cohabitationSignalsA: {
    day_palace: palace(),
    hidden_stem_intimacy: intimacy(),
    wealth_officer_power: power(70, "high"),
  },
  cohabitationSignalsB: {
    day_palace: palace(),
    hidden_stem_intimacy: intimacy(),
    wealth_officer_power: power(40, "low"),
  },
});
const moneyEn = reportEn.household.section_money_chores;
assert.deepEqual(
  operatingCfoJudgmentFields({
    nickname: moneyEn.cfo_nickname,
    reason: moneyEn.cfo_reason,
    align: moneyEn.cfo_align,
    confidence: moneyEn.cfo_confidence,
    dual: moneyEn.cfo_dual,
  }),
  sectionFields,
);
assert.equal(
  reportEn.context_output.dominant_categories.household_cfo?.category,
  coSide,
);
ok("ko/en same operating CFO judgment");

// ---------------------------------------------------------------------------
section("5) Product boundary — operating CFO ≠ adjacent questions");

const assetRow = report.household.section_compare_table?.find(
  (r) => r.id === "asset_management",
);
const bedroomLead = report.household.section_compare_table?.find(
  (r) => r.id === "bedroom_lead",
);
assert.ok(assetRow, "asset_management compare row present");
assert.ok(bedroomLead, "bedroom_lead compare row present");
assert.notEqual(assetRow.id, "household_cfo");
assert.ok(money.cfo_nickname, "section operating CFO populated");
assert.ok(
  report.context_output.dominant_categories.household_cfo,
  "CO household_cfo from section_money_chores",
);
assert.equal(
  report.context_output.dominant_categories.asset_management,
  undefined,
  "CO must not invent asset_management from operating CFO",
);
assert.equal(
  report.context_output.dominant_categories.bedroom_lead,
  undefined,
);
assert.ok(
  money.chores_guideline,
  "chores_guideline remains a separate section field",
);
assert.notEqual(
  money.chores_guideline,
  money.cfo_reason,
  "chores copy is not the CFO judgment",
);
ok("operating CFO kept separate from asset/bedroom/chores paths");

// ---------------------------------------------------------------------------
section("6) Persistence — serialize + strip");

const json = JSON.stringify({
  format: COHABITATION_DEEP_FORMAT,
  report,
});
const parsed = JSON.parse(json);
assert.equal(
  parsed.report.household.section_money_chores.cfo_nickname,
  money.cfo_nickname,
);
assert.equal(
  parsed.report.context_output.schema_version,
  "context_output_v1",
);
assert.equal(
  parsed.report.household.section_money_chores.cfo_align,
  money.cfo_align,
);

const stripped = stripMarriageContextOutputForClient({
  format: COHABITATION_DEEP_FORMAT,
  report,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.household.section_money_chores.cfo_nickname);
assert.ok(report.context_output.dominant_categories.household_cfo);
ok("JSON round-trip + client strip; section CFO retained");

console.log("\nAll marriage-operating-cfo-canonical tests passed.");
