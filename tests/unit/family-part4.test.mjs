/**
 * Family Part4 — layer copy + recognition enrichment.
 * Run: npx tsx tests/unit/family-part4.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import {
  appendFilialRecognitionEnrichment,
  buildFilialRecognitionEnrichment,
} from "../../lib/relationship/familyParent/familyRecognitionEnrichment.ts";
import { buildPsychMatchResult } from "../../lib/relationship/psychMatch/index.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { PSYCH_MASTER_JSON_VERSION } from "../../lib/personCore/schemaVersion.ts";
import { SECONDARY_AXIS_KEYS } from "../../lib/v2/survey/types.ts";
import { messagesEnUS } from "../../lib/i18n/messages/en-US.ts";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR.ts";
import { buildNeutralV2Profile } from "../../lib/v2/survey/neutralProfile.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
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

function samplePsych(recognitionA, recognitionB) {
  const base = () => {
    const secondary_axes = Object.fromEntries(
      SECONDARY_AXIS_KEYS.map((k) => [k, 50]),
    );
    return {
      schema_version: PSYCH_MASTER_JSON_VERSION,
      secondary_axes,
      survey_source: "v2_10q",
      survey_completed_at: "2026-07-20T00:00:00.000Z",
      survey_input_fingerprint: "part4-test",
      home_life_dna: {
        lifestyle_title: "t",
        family_identity_category: "balanced",
        family_identity_line: "t",
        life_values_line: "t",
        private_home_self_line: "t",
        energy_battery_line: "t",
      },
    };
  };
  const a = base();
  const b = base();
  a.secondary_axes.recognition = recognitionA;
  b.secondary_axes.recognition = recognitionB;
  return { a, b };
}

function buildReport(overrides = {}) {
  return buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: sajuChild,
    sajuJsonB: sajuParent,
    locale: "ko-KR",
    ...overrides,
  });
}

section("Destiny — no current-year framing");
{
  const report = buildReport({ analysisYear: 2026 });
  const d = report.family.section_destiny;
  const text = `${d.harmony_one_liner} ${d.favoritism_warning}`;
  assert.ok(!/\b20\d{2}\b/.test(text));
  assert.ok(!/올해/.test(text));
  ok("destiny copy has no year / 올해 framing");
}

section("Filial — no innate DNA framing");
{
  const report = buildReport();
  const filial = report.family.section_filial_reward.future_reward;
  assert.ok(!/\bDNA\b/i.test(filial));
  assert.ok(!/타고난/.test(filial));
  ok("filial has no DNA / innate framing");
}

section("Locale layer labels");
{
  const en = messagesEnUS.relationshipDrilldown.family;
  const ko = messagesKoKR.relationshipDrilldown.family;
  assert.ok(en.destinyLayerLabel);
  assert.ok(en.parentLensLayerLabel);
  assert.ok(en.filialLayerLabel);
  assert.ok(HANGUL_RE.test(ko.destinyLayerLabel));
  assert.ok(HANGUL_RE.test(ko.parentLensLayerLabel));
  assert.ok(HANGUL_RE.test(ko.filialLayerLabel));
  assert.ok(!HANGUL_RE.test(en.destinyLayerHint));
  assert.ok(!/lens/i.test(en.parentLensLayerLabel));
  assert.ok(!/lens/i.test(en.parentLensLayerHint));
  assert.ok(!/렌즈/.test(ko.parentLensLayerLabel));
  assert.ok(!/렌즈/.test(ko.parentLensLayerHint));
  ok("ko/en Part4 layer labels present without lens wording");
}

section("Task1 — no user-facing lens wording on role labels");
{
  assert.ok(!/렌즈|lens/i.test(messagesKoKR.hub.motherLensShort));
  assert.ok(!/렌즈|lens/i.test(messagesKoKR.hub.fatherLensShort));
  assert.ok(!/렌즈|lens/i.test(messagesKoKR.report.motherLens));
  assert.ok(!/렌즈|lens/i.test(messagesKoKR.report.fatherLens));
  assert.ok(!/렌즈|lens/i.test(messagesKoKR.report.premiumEmptyFamilyHint));
  assert.ok(!/lens/i.test(messagesEnUS.hub.motherLensShort));
  assert.ok(!/lens/i.test(messagesEnUS.hub.fatherLensShort));
  assert.ok(!/lens/i.test(messagesEnUS.report.motherLens));
  assert.ok(!/lens/i.test(messagesEnUS.report.fatherLens));
  assert.ok(!/lens/i.test(messagesEnUS.report.premiumEmptyFamilyHint));
  const mother = buildReport({ parentType: "mother" });
  const father = buildReport({
    parentType: "father",
    roles: { roleA: "child", roleB: "father" },
  });
  assert.ok(!/렌즈|lens/i.test(mother.family.parent_lens_summary));
  assert.ok(!/렌즈|lens/i.test(father.family.parent_lens_summary));
  ok("hub/report/summary copy has no lens wording");
}

section("Recognition enrichment — psych absent → filial body unchanged");
{
  const without = buildReport();
  const base = without.family.section_filial_reward.future_reward;
  assert.ok(!base.includes("설문 참고"));
  assert.ok(!/Survey note/i.test(base));
  ok("no psych → no enrichment");
}

section("Recognition enrichment — psych present → append only");
{
  const { a, b } = samplePsych(50, 56); // gap 6 > p90(4) → tension
  const withPsych = buildReport({ psychMasterA: a, psychMasterB: b });
  const without = buildReport();
  const enriched = withPsych.family.section_filial_reward.future_reward;
  const base = without.family.section_filial_reward.future_reward;
  assert.ok(enriched.startsWith(base) || enriched.includes(base.slice(0, 40)));
  assert.ok(enriched.includes("설문 참고"));
  assert.ok(enriched.length > base.length);
  // Core fields unchanged
  assert.equal(
    withPsych.family.section_filial_reward.reward_index,
    without.family.section_filial_reward.reward_index,
  );
  assert.deepEqual(
    withPsych.family.section_destiny,
    without.family.section_destiny,
  );
  assert.equal(withPsych.meta.bond_pct, without.meta.bond_pct);
  assert.equal(withPsych.meta.synergy_pct, without.meta.synergy_pct);
  assert.equal(withPsych.meta.risk_pct, without.meta.risk_pct);
  ok("enrichment appends; destiny/scores/reward_index unchanged");
}

section("Recognition match_type fixtures");
{
  const tension = buildPsychMatchResult({
    profileA: { ...buildNeutralV2Profile(), secondary_axes: { ...buildNeutralV2Profile().secondary_axes, recognition: 50 } },
    profileB: { ...buildNeutralV2Profile(), secondary_axes: { ...buildNeutralV2Profile().secondary_axes, recognition: 56 } },
  });
  const rowT = tension.axis_results.find((r) => r.axis_key === "recognition");
  assert.equal(rowT.match_type, "tension");
  assert.ok(buildFilialRecognitionEnrichment(tension, "en-US")?.includes("Survey note"));

  const similar = buildPsychMatchResult({
    profileA: { ...buildNeutralV2Profile(), secondary_axes: { ...buildNeutralV2Profile().secondary_axes, recognition: 50 } },
    profileB: { ...buildNeutralV2Profile(), secondary_axes: { ...buildNeutralV2Profile().secondary_axes, recognition: 50 } },
  });
  assert.equal(
    similar.axis_results.find((r) => r.axis_key === "recognition").match_type,
    "similarity",
  );
  const enSim = buildFilialRecognitionEnrichment(similar, "en-US");
  assert.ok(/similarly|steady/i.test(enSim));
  assert.ok(!HANGUL_RE.test(enSim));
  ok("enrichment maps existing match_type only");
}

section("Survey incomplete / missing psych → null enrichment");
{
  assert.equal(buildFilialRecognitionEnrichment(null, "ko-KR"), null);
  assert.equal(buildFilialRecognitionEnrichment(undefined, "ko-KR"), null);
  const incomplete = samplePsych(50, 56);
  incomplete.a.survey_source = "incomplete";
  const report = buildReport({
    psychMasterA: incomplete.a,
    psychMasterB: incomplete.b,
  });
  assert.ok(!report.family.section_filial_reward.future_reward.includes("설문 참고"));
  ok("incomplete survey falls back without enrichment");
}

section("mother/father — same recognition enrichment");
{
  const { a, b } = samplePsych(50, 50);
  const mother = buildReport({
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    psychMasterA: a,
    psychMasterB: b,
  });
  const father = buildReport({
    roles: { roleA: "child", roleB: "father" },
    parentType: "father",
    psychMasterA: a,
    psychMasterB: b,
  });
  const enM = buildFilialRecognitionEnrichment(
    mother.meta.psych_match,
    "ko-KR",
  );
  const enF = buildFilialRecognitionEnrichment(
    father.meta.psych_match,
    "ko-KR",
  );
  assert.equal(enM, enF);
  assert.ok(mother.family.section_filial_reward.future_reward.includes(enM));
  assert.ok(father.family.section_filial_reward.future_reward.includes(enF));
  ok("recognition enrichment role-invariant");
}

section("en-US enrichment Hangul-free");
{
  const { a, b } = samplePsych(50, 56);
  const en = buildReport({
    locale: "en-US",
    psychMasterA: a,
    psychMasterB: b,
  });
  assert.ok(!HANGUL_RE.test(en.family.section_filial_reward.future_reward));
  assert.ok(/Survey note/i.test(en.family.section_filial_reward.future_reward));
  ok("en-US filial enrichment Hangul-free");
}

section("Compatibility — fields + ViewModel; reward_index not required in UI");
{
  const report = buildReport();
  assert.ok(report.family.section_destiny);
  assert.ok(report.family.section_filial_reward);
  assert.ok(report.family.parent_lens_summary);
  assert.ok(!/렌즈|lens/i.test(report.family.parent_lens_summary));
  assert.ok(report.family.section_filial_reward.reward_index);
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const destiny = vm.sections.find((s) => s.type === "destiny");
  const filial = vm.sections.find((s) => s.type === "filial_reward");
  assert.equal(destiny.partNumber, 4);
  assert.equal(filial.partNumber, 4);
  assert.ok(destiny.parentLensSummary);
  assert.ok(!/렌즈|lens/i.test(destiny.parentLensSummary));
  assert.ok(filial.rewardIndex);
  assert.deepEqual(
    report.family.section_compare_table.map((r) => r.id),
    [
      "correction_style",
      "bond_distance",
      "affection_expression",
      "guidance_balance",
      "gathering_recovery",
      "home_climate",
    ],
  );
  const compare = vm.sections.find((s) => s.type === "compare_table");
  assert.deepEqual(
    compare.rows.map((r) => r.id),
    [
      "correction_style",
      "bond_distance",
      "guidance_balance",
      "home_climate",
    ],
  );
  ok("Part4 fields + Part2 rows preserved");
}

section("append helper is idempotent");
{
  const match = buildPsychMatchResult({
    profileA: buildNeutralV2Profile(),
    profileB: buildNeutralV2Profile(),
  });
  const once = appendFilialRecognitionEnrichment("base.", match, "en-US");
  const twice = appendFilialRecognitionEnrichment(once, match, "en-US");
  assert.equal(once, twice);
  ok("append does not duplicate");
}

console.log("\nAll family-part4 checks passed.");
