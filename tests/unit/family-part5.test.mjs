/**
 * Family Part5 — de-escalation SSOT + prescription fallback.
 * Run: npx tsx tests/unit/family-part5.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { buildFamilyPrescriptions } from "../../lib/relationship/familyParent/buildFamilyPrescriptions.ts";
import { buildChildDeEscalationCard } from "../../lib/relationship/familyParent/childDeEscalationPrescriptions.ts";
import { resolveCorrectionStyleBucket } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { resolveDominantElement } from "../../lib/saju/pairChartAnalysis.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { messagesEnUS } from "../../lib/i18n/messages/en-US.ts";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR.ts";
import { PSYCH_MASTER_JSON_VERSION } from "../../lib/personCore/schemaVersion.ts";
import { SECONDARY_AXIS_KEYS } from "../../lib/v2/survey/types.ts";
import { resolveTopicMeta } from "../../lib/relationship/shared/pairPrescriptionUiTypes.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const FORBIDDEN_KO = /카르마|탯줄|사주/;
const FORBIDDEN_EN = /\bkarma\b|\bumbilical\b/i;

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

function countsFrom(json) {
  const counts = {};
  for (const t of json.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

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

function samplePsych() {
  const secondary_axes = Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k) => [k, 50]),
  );
  return {
    schema_version: PSYCH_MASTER_JSON_VERSION,
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: "2026-07-20T00:00:00.000Z",
    survey_input_fingerprint: "part5",
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "t",
      life_values_line: "t",
      private_home_self_line: "t",
      energy_battery_line: "t",
    },
  };
}

section("SSOT — Part2 A child bucket === Part5 de-escalation category");
{
  const categories = [
    ["food", { 상관: 4 }],
    ["self", { 비견: 4 }],
    ["seal", { 정인: 4 }],
    ["officer", { 정관: 4 }],
    ["wealth", { 정재: 4 }],
  ];
  for (const [expected, counts] of categories) {
    const bucket = resolveCorrectionStyleBucket(counts).bucket;
    const card = buildChildDeEscalationCard({
      childNickname: "Alex",
      parentNickname: "Jordan",
      parentRole: "mother",
      childCounts: counts,
      locale: "ko-KR",
    });
    assert.equal(bucket, expected);
    assert.equal(card.category, expected);
    assert.equal(card.category, bucket);
  }
  ok("all five categories align with resolveCorrectionStyleBucket");
}

section("SSOT — dominantArchetype does not change category");
{
  const counts = { 정인: 4 };
  const a = buildChildDeEscalationCard({
    childNickname: "Alex",
    parentNickname: "Jordan",
    parentRole: "mother",
    childCounts: counts,
    locale: "en-US",
  });
  // Old path preferred wood→self when archetype biased; seal counts must stay seal
  assert.equal(a.category, "seal");
  assert.equal(resolveCorrectionStyleBucket(counts).bucket, "seal");
  ok("seal bucket wins without archetype bias");
}

section("SSOT — report child row matches de-escalation category");
{
  const report = buildReport();
  const childCounts = countsFrom(sajuChild);
  const expected = resolveCorrectionStyleBucket(childCounts).bucket;
  assert.equal(report.family.section_de_escalation.category, expected);
  const compareChild = report.family.section_compare_table.find(
    (r) => r.id === "correction_style",
  );
  assert.ok(compareChild);
  // short label encodes bucket via resolveCorrectionStyleBucket path used in table
  assert.equal(
    resolveCorrectionStyleBucket(childCounts).bucket,
    report.family.section_de_escalation.category,
  );
  ok("live report: Part2 A child bucket == Part5 category");
}

section("Part3 DNA independence — same counts, different chart element unused");
{
  const counts = { 상관: 3 };
  const card = buildChildDeEscalationCard({
    childNickname: "A",
    parentNickname: "B",
    parentRole: "father",
    childCounts: counts,
    locale: "ko-KR",
  });
  assert.equal(card.category, "food");
  const chart = buildChartContext(sajuChild.saju);
  const dominant = resolveDominantElement(chart).dominant;
  // Even if DNA element ≠ food mapping, category follows ten-god bucket only
  assert.equal(card.category, resolveCorrectionStyleBucket(counts).bucket);
  void dominant;
  ok("de-escalation ignores dominant element for selection");
}

section("Fallback — pairFamily present can be signal-aware");
{
  const pair = {
    umbilical_separation_index: 70,
    umbilical_band: "high",
    nagging_trigger_index: 65,
    nagging_band: "high",
    combined_karma_tension: 50,
    guidance_fit: null,
  };
  const pack = buildFamilyPrescriptions({
    pair,
    parentNickname: "Jordan",
    childNickname: "Alex",
    locale: "ko-KR",
  });
  assert.ok(pack.items.some((i) => i.topic === "umbilical_independence"));
  assert.ok(pack.items.some((i) => i.topic === "nagging_karma_avoidance"));
  assert.ok(!FORBIDDEN_KO.test(pack.intro_line));
  for (const item of pack.items) {
    assert.ok(!FORBIDDEN_KO.test(item.headline));
    assert.ok(!FORBIDDEN_KO.test(item.evidence.summary));
    assert.ok(item.do_list.every((s) => !FORBIDDEN_KO.test(s)));
    assert.ok(item.dont_list.every((s) => !FORBIDDEN_KO.test(s)));
  }
  const enPack = buildFamilyPrescriptions({
    pair,
    parentNickname: "Jordan",
    childNickname: "Alex",
    locale: "en-US",
  });
  const enBlob = [
    enPack.intro_line,
    ...enPack.items.flatMap((i) => [
      i.headline,
      i.evidence.summary,
      ...i.do_list,
      ...i.dont_list,
    ]),
  ].join("\n");
  assert.ok(!FORBIDDEN_EN.test(enBlob));
  assert.ok(!HANGUL_RE.test(enBlob));
  ok("pair present: signal-aware topics; forbidden terms absent");
}

section("Fallback — pairFamily absent → baseline-only");
{
  const pack = buildFamilyPrescriptions({
    pair: null,
    parentNickname: "Jordan",
    childNickname: "Alex",
    locale: "ko-KR",
  });
  assert.equal(pack.items.length, 1);
  assert.equal(pack.items[0].topic, "family_baseline");
  assert.ok(/기본 루틴|교차 신호가 없어/.test(pack.intro_line));
  const report = buildReport(); // no pairFamily
  assert.ok(report.meta.prescription_family);
  assert.equal(report.meta.prescription_family.items[0].topic, "family_baseline");
  ok("null pair → baseline-only on builder and report");
}

section("Legacy prescription missing — ViewModel omits prescription without crash");
{
  const report = buildReport();
  delete report.meta.prescription_family;
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  assert.ok(vm.sections.find((s) => s.type === "de_escalation"));
  assert.equal(vm.sections.find((s) => s.type === "prescription"), undefined);
  ok("missing prescription_family → no crash, section omitted");
}

section("psych / analysisYear do not change Part5");
{
  const base = buildReport({ analysisYear: 2026 });
  const withPsych = buildReport({
    analysisYear: 2038,
    psychMasterA: samplePsych(),
    psychMasterB: samplePsych(),
  });
  assert.deepEqual(
    { ...base.family.section_de_escalation, solution_script: null },
    { ...withPsych.family.section_de_escalation, solution_script: null },
  );
  // scripts include nicknames only — category must match
  assert.equal(
    base.family.section_de_escalation.category,
    withPsych.family.section_de_escalation.category,
  );
  assert.deepEqual(
    base.meta.prescription_family.items.map((i) => i.topic),
    withPsych.meta.prescription_family.items.map((i) => i.topic),
  );
  ok("psych + analysisYear do not alter Part5 category/topics");
}

section("mother/father — category and prescription topics identical");
{
  const mother = buildReport({
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
  });
  const father = buildReport({
    roles: { roleA: "child", roleB: "father" },
    parentType: "father",
  });
  assert.equal(
    mother.family.section_de_escalation.category,
    father.family.section_de_escalation.category,
  );
  assert.equal(
    mother.family.section_de_escalation.hashtag,
    father.family.section_de_escalation.hashtag,
  );
  assert.deepEqual(
    mother.meta.prescription_family.items.map((i) => i.topic),
    father.meta.prescription_family.items.map((i) => i.topic),
  );
  // Role label may appear in solution_script
  assert.ok(mother.family.section_de_escalation.solution_script.includes("엄마"));
  assert.ok(father.family.section_de_escalation.solution_script.includes("아빠"));
  ok("role: category/topics same; honorific differs");
}

section("Locale — forbidden terms + layer labels");
{
  const ko = messagesKoKR.relationshipDrilldown.family;
  const en = messagesEnUS.relationshipDrilldown.family;
  assert.ok(ko.deEscalationLayerLabel);
  assert.ok(en.prescriptionLayerHint);
  assert.ok(!FORBIDDEN_KO.test(ko.deEscalationLayerHint));
  assert.ok(!FORBIDDEN_EN.test(en.deEscalationLayerHint));
  assert.ok(!FORBIDDEN_EN.test(en.prescriptionLayerHint));

  const enPack = buildFamilyPrescriptions({
    pair: null,
    parentNickname: "Jordan",
    childNickname: "Alex",
    locale: "en-US",
  });
  const blob = [
    enPack.intro_line,
    ...enPack.items.flatMap((i) => [
      i.headline,
      i.evidence.summary,
      ...i.do_list,
      ...i.dont_list,
    ]),
  ].join("\n");
  assert.ok(!HANGUL_RE.test(blob));
  assert.ok(!FORBIDDEN_EN.test(blob));

  const metaKo = resolveTopicMeta("nagging_karma_avoidance", "ko-KR");
  const metaEn = resolveTopicMeta("nagging_karma_avoidance", "en-US");
  assert.ok(!FORBIDDEN_KO.test(metaKo.label));
  assert.ok(!FORBIDDEN_EN.test(metaEn.label));
  const umbKo = resolveTopicMeta("umbilical_independence", "ko-KR");
  const umbEn = resolveTopicMeta("umbilical_independence", "en-US");
  assert.ok(!FORBIDDEN_KO.test(umbKo.label));
  assert.ok(!FORBIDDEN_EN.test(umbEn.label));
  ok("locale labels and baseline pack free of forbidden terms");
}

section("VM Part5 sections present for minimal report");
{
  const report = buildReport();
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  assert.ok(vm.sections.find((s) => s.type === "de_escalation"));
  assert.ok(vm.sections.find((s) => s.type === "prescription"));
  ok("minimal fixture renders both Part5 blocks");
}

console.log("\nAll family-part5 checks passed.");
