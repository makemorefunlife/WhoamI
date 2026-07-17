/**
 * Friend (Social DNA) Premium content generation must be locale-aware —
 * English requests must never contain Korean prose (same bug class as
 * Family/Work/Cohabitation: the rule-based generator had zero locale param
 * and always emitted Korean regardless of site locale).
 * Run: npx tsx tests/unit/friend-premium-locale.test.mjs
 */
import assert from "node:assert/strict";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
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

const pairFriendship = {
  johu_gap: {
    heat_gap: 40,
    moisture_gap: 20,
    temperature_mismatch: true,
    band_a: "cold",
    band_b: "hot",
  },
  energy_drain_index: 65,
  energy_drain_band: "medium",
};

function buildReport(locale) {
  return buildFriendReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    pairFriendship,
    locale,
  });
}

function assertNoHangul(label, value) {
  assert.ok(!HANGUL_RE.test(value), `${label} leaked Korean: ${value}`);
}

section("Explicit locale: en-US — no Korean prose leaks into fields FriendReportView renders");
const enReport = buildReport("en-US");
const friend = enReport.friend;

assertNoHangul("headline", enReport.headline);
assertNoHangul("one_line_friendship", enReport.one_line_friendship);

for (const p of ["section_social_dna_a", "section_social_dna_b"]) {
  const dna = friend[p];
  assertNoHangul(`${p}.social_title`, dna.social_title);
  assertNoHangul(`${p}.friend_position`, dna.friend_position);
  assertNoHangul(`${p}.tikitaka_label`, dna.tikitaka_label);
  assertNoHangul(`${p}.tikitaka_description`, dna.tikitaka_description);
  assertNoHangul(`${p}.battery_description`, dna.battery_description);
  assertNoHangul(`${p}.private_self`, dna.private_self);
}
ok("section_social_dna_a/b is Korean-free");

assertNoHangul("section_snapshot.one_line_friendship", friend.section_snapshot.one_line_friendship);
ok("section_snapshot is Korean-free");

assertNoHangul("section_soulmate.soulmate_verdict", friend.section_soulmate.soulmate_verdict);
ok("section_soulmate is Korean-free");

assertNoHangul("section_play_money.treasurer_reason", friend.section_play_money.treasurer_reason);
assertNoHangul("section_play_money.optimal_hangout", friend.section_play_money.optimal_hangout);
ok("section_play_money is Korean-free");

assertNoHangul("section_breakup_guide.trigger_warning_a", friend.section_breakup_guide.trigger_warning_a);
assertNoHangul("section_breakup_guide.trigger_warning_b", friend.section_breakup_guide.trigger_warning_b);
ok("section_breakup_guide is Korean-free");

assertNoHangul("section_de_escalation.hashtag", friend.section_de_escalation.hashtag);
assertNoHangul("section_de_escalation.archetype_label", friend.section_de_escalation.archetype_label);
assertNoHangul("section_de_escalation.cheat_script", friend.section_de_escalation.cheat_script);
ok("section_de_escalation is Korean-free");

const topics = enReport.snapshot_panel.narrative?.topics ?? [];
assert.equal(topics.length, 3, "expected 3 narrative topics (intimacy/stability/conflict)");
topics.forEach((t) => {
  assertNoHangul("narrative.topics[].title", t.title);
  assertNoHangul("narrative.topics[].interpretation", t.interpretation);
});
assertNoHangul("snapshot_panel.gaugeLabel", enReport.snapshot_panel.gaugeLabel);
enReport.snapshot_panel.keywords.forEach((k) => assertNoHangul("snapshot_panel.keywords[]", k));
ok("snapshot_panel (gaugeLabel/keywords/narrative) is Korean-free");

const prescription = enReport.meta.prescription_friendship;
assert.ok(prescription, "expected prescription_friendship to be present (pairFriendship was provided)");
assertNoHangul("prescription_friendship.intro_line", prescription.intro_line);
prescription.items.forEach((item, i) => {
  assertNoHangul(`prescription_friendship.items[${i}].headline`, item.headline);
  assertNoHangul(`prescription_friendship.items[${i}].evidence.summary`, item.evidence.summary);
  item.do_list.forEach((d) => assertNoHangul(`prescription_friendship.items[${i}].do_list[]`, d));
  item.dont_list.forEach((d) => assertNoHangul(`prescription_friendship.items[${i}].dont_list[]`, d));
});
ok("prescription_friendship is Korean-free");

assert.equal(enReport.meta.grade.length > 0, true);
ok("meta.locale-independent fields present (grade)");

section("Explicit locale: ko-KR — must produce Korean prose (regression guard)");
const koReport = buildReport("ko-KR");
assert.ok(HANGUL_RE.test(koReport.friend.section_social_dna_a.social_title));
assert.ok(HANGUL_RE.test(koReport.friend.section_de_escalation.cheat_script));
assert.ok(HANGUL_RE.test(koReport.meta.prescription_friendship.intro_line));
ok("explicit ko-KR still contains Korean (no regression)");

section("Omitted locale — must match legacy pre-migration behavior: Korean, NOT English");
// Policy: only an explicit locale: "en-US" request may switch to English.
// A caller that omits `locale` entirely (any pre-existing script, test, or
// future code that forgets to pass it) must see EXACTLY the old behavior —
// Korean — so nothing that previously worked silently flips language.
const omittedReport = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  pairFriendship,
});
assert.ok(
  HANGUL_RE.test(omittedReport.friend.section_social_dna_a.social_title),
  "omitting locale must fall back to Korean (legacy behavior), not silently switch to English",
);
ok("omitting locale falls back to Korean — legacy behavior preserved, no silent language switch");

console.log("\nOK: friend premium locale tests passed");
