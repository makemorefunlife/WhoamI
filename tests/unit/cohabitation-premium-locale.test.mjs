/**
 * Cohabitation Premium content generation must be locale-aware — English
 * requests must never contain Korean prose (same bug class as Family/Work).
 * Run: npx tsx tests/unit/cohabitation-premium-locale.test.mjs
 */
import assert from "node:assert/strict";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

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

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");

function buildReport(locale) {
  return buildMarriageReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    locale,
  });
}

function assertNoHangul(label, value) {
  assert.ok(!HANGUL_RE.test(value), `${label} leaked Korean: ${value}`);
}

section("Explicit locale: en-US — no Korean prose leaks into fields MarriageReportView renders");
const enReport = buildReport("en-US");
const hh = enReport.household;

assertNoHangul("headline", enReport.headline);
assertNoHangul("one_line_household", enReport.one_line_household);

for (const p of ["person_a", "person_b"]) {
  const dna = hh.section_dna[p];
  assertNoHangul(`section_dna.${p}.life_values`, dna.life_values);
  assertNoHangul(`section_dna.${p}.private_home_self`, dna.private_home_self);
  assertNoHangul(`section_dna.${p}.energy_battery`, dna.energy_battery);
  assertNoHangul(`section_dna.${p}.family_identity`, dna.family_identity);
}
ok("section_dna (DnaCard) is Korean-free");

assertNoHangul("section_weather_forecast.summary_line", hh.section_weather_forecast.summary_line);
hh.section_weather_forecast.years.forEach((y) => {
  assertNoHangul("weather year_label", y.year_label);
  assertNoHangul("weather weather_label", y.weather_label);
  if (y.advisory) assertNoHangul("weather advisory", y.advisory);
});
ok("section_weather_forecast is Korean-free");

assertNoHangul("section_bedroom.matrix.sexual_chemistry_summary", hh.section_bedroom.matrix.sexual_chemistry_summary);
assertNoHangul("section_bedroom.matrix.frequency_one_liner", hh.section_bedroom.matrix.frequency_one_liner);
for (const p of ["person_a", "person_b"]) {
  const bp = hh.section_bedroom.matrix[p];
  assertNoHangul(`bedroom.${p}.stamina`, bp.stamina);
  assertNoHangul(`bedroom.${p}.fantasy`, bp.fantasy);
  assertNoHangul(`bedroom.${p}.manner`, bp.manner);
}
assertNoHangul("section_bedroom.sleep_fit.title", hh.section_bedroom.sleep_fit.title);
assertNoHangul("section_bedroom.sleep_fit.narrative", hh.section_bedroom.sleep_fit.narrative);
assertNoHangul("section_bedroom.sleep_fit.prescription", hh.section_bedroom.sleep_fit.prescription);
assertNoHangul("section_bedroom.attachment_style", hh.section_bedroom.attachment_style);
ok("section_bedroom (BedroomProfileCard + sleep_fit + attachment) is Korean-free");

assertNoHangul("section_money_chores.cfo_reason", hh.section_money_chores.cfo_reason);
assertNoHangul("section_money_chores.chores_guideline", hh.section_money_chores.chores_guideline);
ok("section_money_chores is Korean-free");

assertNoHangul("section_family_boundary.inlaw_stress_summary", hh.section_family_boundary.inlaw_stress_summary);
assertNoHangul("section_family_boundary.person_a_boundary_note", hh.section_family_boundary.person_a_boundary_note);
assertNoHangul("section_family_boundary.person_b_boundary_note", hh.section_family_boundary.person_b_boundary_note);
ok("section_family_boundary is Korean-free");

assertNoHangul("section_parenting.combined_attitude", hh.section_parenting.combined_attitude);
assertNoHangul("section_parenting.person_a_style", hh.section_parenting.person_a_style);
assertNoHangul("section_parenting.person_b_style", hh.section_parenting.person_b_style);
assertNoHangul("section_parenting.harmony_tip", hh.section_parenting.harmony_tip);
ok("section_parenting is Korean-free");

assertNoHangul("section_privacy.person_a_private_line", hh.section_privacy.person_a_private_line);
assertNoHangul("section_privacy.person_b_private_line", hh.section_privacy.person_b_private_line);
ok("section_privacy is Korean-free");

for (const p of ["person_a", "person_b"]) {
  const upset = hh.section_upset[p];
  assertNoHangul(`section_upset.${p}.upset_signals`, upset.upset_signals);
  upset.do_list.forEach((d) => assertNoHangul(`section_upset.${p}.do_list[]`, d));
  upset.avoid_list.forEach((d) => assertNoHangul(`section_upset.${p}.avoid_list[]`, d));
}
ok("section_upset (UpsetGuideCard) is Korean-free");

assertNoHangul("section_warning.conflict_trigger", hh.section_warning.conflict_trigger);
const cc = hh.section_warning.conflict_communication;
assertNoHangul("conflict_communication.title", cc.title);
assertNoHangul("conflict_communication.pattern_label", cc.pattern_label);
assertNoHangul("conflict_communication.narrative", cc.narrative);
assertNoHangul("conflict_communication.emotional_neglect_risk", cc.emotional_neglect_risk);
const de = hh.section_warning.de_escalation;
for (const p of ["person_a", "person_b"]) {
  assertNoHangul(`de_escalation.${p}.hashtag`, de[p].hashtag);
  assertNoHangul(`de_escalation.${p}.archetype_label`, de[p].archetype_label);
  assertNoHangul(`de_escalation.${p}.psych_state`, de[p].psych_state);
  assertNoHangul(`de_escalation.${p}.avoid_actions`, de[p].avoid_actions);
  assertNoHangul(`de_escalation.${p}.solution_script`, de[p].solution_script);
}
if (de.shared_trigger_note) assertNoHangul("de_escalation.shared_trigger_note", de.shared_trigger_note);
ok("section_warning (conflict_communication + de_escalation cards) is Korean-free");

const topics = enReport.snapshot_panel.narrative?.topics ?? [];
assert.equal(topics.length, 3, "expected 3 narrative topics (intimacy/stability/conflict)");
topics.forEach((t) => {
  assertNoHangul("narrative.topics[].title", t.title);
  assertNoHangul("narrative.topics[].interpretation", t.interpretation);
});
ok("snapshot_panel narrative (TopicCard) is Korean-free");

section("Explicit locale: ko-KR — must produce Korean prose (regression guard)");
const koReport = buildReport("ko-KR");
assert.ok(HANGUL_RE.test(koReport.household.section_dna.person_a.life_values));
assert.ok(HANGUL_RE.test(koReport.household.section_warning.de_escalation.person_a.solution_script));
ok("explicit ko-KR still contains Korean (no regression)");

section("Omitted locale — must match legacy pre-migration behavior: Korean, NOT English");
const omittedReport = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
assert.ok(
  HANGUL_RE.test(omittedReport.household.section_dna.person_a.life_values),
  "omitting locale must fall back to Korean (legacy behavior), not silently switch to English",
);
ok("omitting locale falls back to Korean — legacy behavior preserved, no silent language switch");

console.log("\nOK: cohabitation premium locale tests passed");
