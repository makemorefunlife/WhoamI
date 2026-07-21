/**
 * Family Part3 — Child DNA (innate) + Growth Tunnel (analysisYear).
 * Run: npx tsx tests/unit/family-part3.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { resolveAffectionExpressionBucket } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { resolveDominantElement } from "../../lib/saju/pairChartAnalysis.ts";
import { analyzeFamilyPairSaju } from "../../lib/saju/familyAnalysis.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { messagesEnUS } from "../../lib/i18n/messages/en-US.ts";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR.ts";

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

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
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

section("Child DNA — mother/father role invariant");
{
  const mother = buildReport({
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    analysisYear: 2026,
  });
  const father = buildReport({
    roles: { roleA: "child", roleB: "father" },
    parentType: "father",
    analysisYear: 2026,
  });
  assert.deepEqual(
    mother.family.section_child_dna,
    father.family.section_child_dna,
  );
  assert.equal(
    mother.family.section_growth_tunnel.current_challenge,
    father.family.section_growth_tunnel.current_challenge,
  );
  assert.deepEqual(
    mother.family.section_growth_tunnel.focus_areas,
    father.family.section_growth_tunnel.focus_areas,
  );
  ok("identical child DNA + growth tunnel across mother/father");
}

section("Child DNA — deterministic + no survey / no year framing");
{
  const a = buildReport({ analysisYear: 2026 });
  const b = buildReport({ analysisYear: 2026 });
  assert.deepEqual(a.family.section_child_dna, b.family.section_child_dna);
  assert.ok(a.family.section_child_dna.genius_title);
  assert.ok(a.family.section_child_dna.communication_style);
  const dnaText = Object.values(a.family.section_child_dna).join(" ");
  assert.ok(!/\b20\d{2}\b/.test(dnaText), "Child DNA must not mention a calendar year");
  assert.ok(!/올해/.test(dnaText), "Child DNA must not use this-year framing");
  ok("deterministic DNA without year/time framing");
}

section("Dominant element SSOT — affection === DNA archetype source");
{
  const chartChild = buildChartContext(sajuChild.saju);
  const { dominant } = resolveDominantElement(chartChild);
  const affection = resolveAffectionExpressionBucket(chartChild);
  assert.equal(affection.bucket, dominant);

  const pair = analyzeFamilyPairSaju(
    sajuParent.saju,
    sajuChild.saju,
    "mother",
  );
  assert.equal(pair.childSignals.dominantArchetype, dominant);
  assert.equal(pair.childSignals.dominantArchetype, affection.bucket);
  ok("Part2 affection + Part3 DNA share resolveDominantElement");
}

section("Growth Tunnel — analysisYear fixture + year in copy");
{
  const y2026 = buildReport({ locale: "ko-KR", analysisYear: 2026 });
  const y2038 = buildReport({ locale: "ko-KR", analysisYear: 2038 });
  const c2026 = y2026.family.section_growth_tunnel.current_challenge;
  const c2038 = y2038.family.section_growth_tunnel.current_challenge;
  assert.ok(c2026.includes("2026"), `expected 2026 in copy: ${c2026}`);
  assert.ok(c2038.includes("2038"), `expected 2038 in copy: ${c2038}`);
  assert.ok(c2026.includes("올해") || c2026.includes("성장 터널"));
  assert.ok(
    c2026.includes("시기") ||
      c2026.includes("고정된 성격이 아닙니다") ||
      c2026.includes("고정된 문제"),
  );
  assert.notEqual(c2026, c2038);
  ok("growth tunnel embeds analysisYear and time-layer framing");
}

section("Growth Tunnel — clash vs non-clash focus areas differ by year");
{
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const payloads = years.map((y) => ({
    year: y,
    focus: buildReport({ analysisYear: y }).family.section_growth_tunnel.focus_areas,
    challenge: buildReport({ analysisYear: y }).family.section_growth_tunnel
      .current_challenge,
  }));
  const clashish = payloads.filter((p) =>
    p.focus.some((f) => f.includes("자존감") || f.includes("학교")),
  );
  const calm = payloads.filter((p) =>
    p.focus.some((f) => f.includes("새로운 도전") || f.includes("감정 표현")),
  );
  assert.ok(clashish.length >= 1, "expected at least one clash year in fixture range");
  assert.ok(calm.length >= 1, "expected at least one non-clash year in fixture range");
  assert.ok(
    clashish.some((p) => /자존심|예민|압력/.test(p.challenge)),
    "clash year copy should mention pressure/sensitivity",
  );
  assert.ok(
    calm.some((p) => /고정된 성격이 아닙니다|시기적/.test(p.challenge)),
    "non-clash year still uses time-layer framing",
  );
  ok("clash and non-clash years both covered");
}

section("Growth Tunnel — en-US year + no Hangul; ko-KR has Hangul");
{
  const en = buildReport({ locale: "en-US", analysisYear: 2026 });
  const ko = buildReport({ locale: "ko-KR", analysisYear: 2026 });
  const enChallenge = en.family.section_growth_tunnel.current_challenge;
  const koChallenge = ko.family.section_growth_tunnel.current_challenge;
  assert.ok(enChallenge.includes("2026"));
  assert.ok(/time-specific|this year/i.test(enChallenge));
  assert.ok(!HANGUL_RE.test(enChallenge));
  assert.ok(HANGUL_RE.test(koChallenge));
  for (const [key, value] of Object.entries(en.family.section_child_dna)) {
    assert.ok(!HANGUL_RE.test(value), `en DNA.${key} leaked Hangul`);
  }
  for (const [key, value] of Object.entries(ko.family.section_child_dna)) {
    assert.ok(HANGUL_RE.test(value) || /[🌿🔥🧸💎🌊]/.test(value), `ko DNA.${key}`);
  }
  ok("locale isolation for Part3 bodies");
}

section("Locale catalog — layer labels");
{
  const en = messagesEnUS.relationshipDrilldown.family;
  const ko = messagesKoKR.relationshipDrilldown.family;
  assert.equal(en.dnaLayerLabel, "Innate pattern");
  assert.ok(/learns|relates|focuses/i.test(en.dnaLayerHint));
  assert.equal(en.growthLayerLabel, "This year's growth tunnel");
  assert.ok(/time-specific|current year/i.test(en.growthLayerHint));
  assert.ok(HANGUL_RE.test(ko.dnaLayerLabel));
  assert.ok(HANGUL_RE.test(ko.growthLayerLabel));
  assert.ok(ko.part3Title.includes("타고난") || ko.part3Title.includes("올해"));
  assert.ok(/Innate|this year's growth/i.test(en.part3Title));
  ok("ko/en layer labels present");
}

section("Compatibility — section ids + ViewModel block types");
{
  const report = buildReport({ analysisYear: 2026 });
  assert.ok(report.family.section_child_dna);
  assert.ok(report.family.section_growth_tunnel);
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const dna = vm.sections.find((s) => s.type === "child_dna");
  const growth = vm.sections.find((s) => s.type === "growth_tunnel");
  assert.ok(dna);
  assert.ok(growth);
  assert.equal(dna.partNumber, 3);
  assert.equal(growth.partNumber, 3);
  assert.equal(dna.id, "child_dna");
  assert.equal(growth.id, "growth_tunnel");
  const compare = vm.sections.find((s) => s.type === "compare_table");
  assert.ok(compare);
  assert.equal(compare.rows.length, 4);
  assert.deepEqual(
    compare.rows.map((r) => r.id),
    [
      "correction_style",
      "bond_distance",
      "guidance_balance",
      "home_climate",
    ],
  );
  ok("section_child_dna / section_growth_tunnel + ViewModel types preserved");
}

section("Part2 row set unchanged");
{
  const report = buildReport({ analysisYear: 2026 });
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
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
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
  ok("Part2 body keeps 6 rows; ViewModel displays core 4");
}

console.log("\nAll family-part3 checks passed.");
