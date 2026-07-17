/**
 * Work Colleague Premium content generation must be locale-aware — English
 * requests must never contain Korean prose (same bug class as Family: the
 * rule-based generator had zero locale param and always emitted Korean
 * regardless of site locale).
 * Run: npx tsx tests/unit/work-premium-locale.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
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
  return buildWorkColleagueReport({
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

section("Explicit locale: en-US — no Korean prose leaks into fields WorkColleagueReportView renders");
const enReport = buildReport("en-US");
const office = enReport.office;

assertNoHangul("headline", enReport.headline);
assertNoHangul("one_line_definition", enReport.one_line_definition);

for (const p of ["person_a", "person_b"]) {
  const dna = office.section_dna[p];
  assertNoHangul(`section_dna.${p}.character_title`, dna.character_title);
  assertNoHangul(`section_dna.${p}.work_style`, dna.work_style);
  assertNoHangul(`section_dna.${p}.inner_standard`, dna.inner_standard);
  assertNoHangul(`section_dna.${p}.overall_character`, dna.overall_character);
}
ok("section_dna (DnaCard) is Korean-free");

assertNoHangul("section_mix_fit.person_a_work_style", office.section_mix_fit.person_a_work_style);
assertNoHangul("section_mix_fit.person_b_work_style", office.section_mix_fit.person_b_work_style);
assertNoHangul("section_mix_fit.communication_fit", office.section_mix_fit.communication_fit);
ok("section_mix_fit is Korean-free");

assertNoHangul("section_respect.person_a_boundary", office.section_respect.person_a_boundary);
assertNoHangul("section_respect.person_b_boundary", office.section_respect.person_b_boundary);
ok("section_respect is Korean-free");

for (const p of ["person_a", "person_b"]) {
  const role = office.section_roles[p];
  role.weapons.forEach((w) => assertNoHangul(`section_roles.${p}.weapons[]`, w));
  role.handoff_tasks.forEach((t) => {
    assertNoHangul(`section_roles.${p}.handoff_tasks[].task_label`, t.task_label);
    assertNoHangul(`section_roles.${p}.handoff_tasks[].reason`, t.reason);
  });
}
assertNoHangul("section_roles.synergy_one_liner", office.section_roles.synergy_one_liner);
ok("section_roles (RoleCard) is Korean-free");

for (const p of ["person_a", "person_b"]) {
  const fit = office.section_ideal_roles[p];
  assertNoHangul(`section_ideal_roles.${p}.why`, fit.why);
  fit.ideal_roles.forEach((r) => assertNoHangul(`section_ideal_roles.${p}.ideal_roles[]`, r));
  fit.ideal_departments.forEach((d) => assertNoHangul(`section_ideal_roles.${p}.ideal_departments[]`, d));
}
assertNoHangul("section_ideal_roles.together_combo", office.section_ideal_roles.together_combo);
ok("section_ideal_roles (IdealRoleCard) is Korean-free");

for (const p of ["person_a", "person_b"]) {
  const upset = office.section_upset[p];
  assertNoHangul(`section_upset.${p}.upset_signals`, upset.upset_signals);
  upset.do_list.forEach((d) => assertNoHangul(`section_upset.${p}.do_list[]`, d));
  upset.avoid_list.forEach((d) => assertNoHangul(`section_upset.${p}.avoid_list[]`, d));
}
ok("section_upset (UpsetGuideCard) is Korean-free");

assertNoHangul("section_warning.conflict_trigger", office.section_warning.conflict_trigger);
assertNoHangul("section_warning.de_escalation.hashtag", office.section_warning.de_escalation.hashtag);
assertNoHangul("section_warning.de_escalation.title", office.section_warning.de_escalation.title);
assertNoHangul("section_warning.de_escalation.detail", office.section_warning.de_escalation.detail);
ok("section_warning (DeEscalationBlock) is Korean-free");

const topics = enReport.snapshot_panel.narrative?.topics ?? [];
assert.equal(topics.length, 3, "expected 3 narrative topics (intimacy/stability/conflict)");
topics.forEach((t) => {
  assertNoHangul("narrative.topics[].title", t.title);
  assertNoHangul("narrative.topics[].interpretation", t.interpretation);
});
ok("snapshot_panel narrative (TopicCard) is Korean-free");

section("Explicit locale: ko-KR — must produce Korean prose (regression guard)");
const koReport = buildReport("ko-KR");
assert.ok(HANGUL_RE.test(koReport.office.section_dna.person_a.work_style));
assert.ok(HANGUL_RE.test(koReport.office.section_warning.de_escalation.detail));
ok("explicit ko-KR still contains Korean (no regression)");

section("Omitted locale — must match legacy pre-migration behavior: Korean, NOT English");
// Policy: only an explicit locale: "en-US" request may switch to English.
// A caller that omits `locale` entirely (any pre-existing script, test, or
// future code that forgets to pass it) must see EXACTLY the old behavior —
// Korean — so nothing that previously worked silently flips language.
const omittedReport = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
assert.ok(
  HANGUL_RE.test(omittedReport.office.section_dna.person_a.work_style),
  "omitting locale must fall back to Korean (legacy behavior), not silently switch to English",
);
ok("omitting locale falls back to Korean — legacy behavior preserved, no silent language switch");

console.log("\nOK: work premium locale tests passed");
