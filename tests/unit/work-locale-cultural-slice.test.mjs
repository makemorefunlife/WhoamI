/**
 * Work locale cultural slice — same evidence → same canonical judgment;
 * locale only changes explanation / scripts / actions.
 * Run: npx tsx tests/unit/work-locale-cultural-slice.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkPrescriptions } from "../../lib/relationship/workColleague/buildWorkPrescriptions.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const LATIN_PROSE_RE = /\b(the|and|with|your|meeting|Slack)\b/i;

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
  const secondary_axes = Object.fromEntries(SECONDARY_KEYS.map((k) => [k, 50]));
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

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");
const psychA = samplePsych({ thinking_style: 70, structure: 65, recognition: 70 });
const psychB = samplePsych({ thinking_style: 30, structure: 35, recognition: 40 });

const pairWorkLow = {
  micromanaging_poison_index: 20,
  micromanaging_band: "low",
  leadership_conflict_index: 20,
  leadership_conflict_band: "low",
  drive_clash_notes: [],
};

function buildReport(locale) {
  return buildWorkColleagueReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    pairWork: pairWorkLow,
    locale,
  });
}

function assertNoHangul(label, value) {
  assert.ok(typeof value === "string" && value.length > 0, `${label} empty`);
  assert.ok(!HANGUL_RE.test(value), `${label} leaked Korean: ${value}`);
}

function flattenStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => flattenStrings(v, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => flattenStrings(v, out));
  }
  return out;
}

section("Canonical judgment identical across en-US / ko-KR");
const en = buildReport("en-US");
const ko = buildReport("ko-KR");

assert.equal(en.meta.grade, ko.meta.grade);
assert.equal(en.meta.fit_pct, ko.meta.fit_pct);
assert.equal(en.meta.synergy_pct, ko.meta.synergy_pct);
assert.equal(en.meta.risk_pct, ko.meta.risk_pct);

const enReporting = en.office.section_mix_fit.reporting_style_fit;
const koReporting = ko.office.section_mix_fit.reporting_style_fit;
assert.ok(enReporting && koReporting);
assert.equal(enReporting.person_a.style, koReporting.person_a.style);
assert.equal(enReporting.person_b.style, koReporting.person_b.style);

const enBreak = en.office.section_respect.break_boundary_fit;
const koBreak = ko.office.section_respect.break_boundary_fit;
assert.ok(enBreak && koBreak);
assert.equal(enBreak.person_a.style, koBreak.person_a.style);
assert.equal(enBreak.person_b.style, koBreak.person_b.style);

const enLead = en.office.section_roles.leadership_split;
const koLead = ko.office.section_roles.leadership_split;
if (enLead && koLead) {
  assert.equal(enLead.external_lead, koLead.external_lead);
  assert.equal(enLead.internal_qa_lead, koLead.internal_qa_lead);
  assert.equal(enLead.align, koLead.align);
  assert.equal(enLead.confidence, koLead.confidence);
}

const enCanon = en.canonical_projections?.comparison_table;
const koCanon = ko.canonical_projections?.comparison_table;
if (enCanon && koCanon) {
  assert.deepEqual(enCanon, koCanon);
}
ok("grade / styles / leadership / comparison canonical match");

section("De-escalation card selection stable (color = same category winner)");
const deEnFromReport = en.office.section_warning.de_escalation;
const deKoFromReport = ko.office.section_warning.de_escalation;
assert.equal(
  deEnFromReport.color,
  deKoFromReport.color,
  "same evidence must pick same de-escalation category",
);
assert.notEqual(deEnFromReport.title, deKoFromReport.title);
assert.notEqual(deEnFromReport.detail, deKoFromReport.detail);
ok("de-escalation category stable; copy differs by locale");

section("en-US cultural framing — no Hangul, no KR workplace leaks");
assertNoHangul("reporting.summary", enReporting.summary);
assert.match(enReporting.summary, /standup|Slack\/Teams|async|updating/i);

const cushionEn = en.office.section_upset.feedback_cushion;
assert.ok(cushionEn);
assertNoHangul("feedback_cushion.to_a", cushionEn.to_a);
assertNoHangul("feedback_cushion.to_b", cushionEn.to_b);
assert.match(cushionEn.to_a + cushionEn.to_b, /Try:/);

const deEn = deEnFromReport;
assertNoHangul("de_escalation.title", deEn.title);
assertNoHangul("de_escalation.detail", deEn.detail);
assert.ok(!/FoodFixesEverything|Peace Treaty|meal/i.test(deEn.hashtag + deEn.title));
assert.ok(!/카톡|밥·|망신|눈치/.test(deEn.detail));

const rxEn = en.meta.prescription_work;
assert.ok(rxEn);
const baselineEn = rxEn.items.find((i) => i.topic === "office_baseline");
assert.ok(baselineEn);
for (const s of flattenStrings(baselineEn)) assertNoHangul("office_baseline en", s);
assert.ok(!flattenStrings(baselineEn).some((s) => /카톡/.test(s)));
assert.match(baselineEn.do_list.join(" "), /Slack\/Teams|peer-to-peer|async/i);
assert.ok(!/\bboss\b|상사/.test(baselineEn.summary + baselineEn.do_list.join(" ")));
ok("en-US slice is Hangul-free and North-American framed");

section("ko-KR cultural framing — Hangul present, honorific/private feedback cues");
assert.ok(HANGUL_RE.test(koReporting.summary));
assert.ok(!LATIN_PROSE_RE.test(koReporting.summary.replace(/Alex|Jordan/g, "")));

const cushionKo = ko.office.section_upset.feedback_cushion;
assert.ok(cushionKo);
assert.ok(HANGUL_RE.test(cushionKo.to_a));
assert.ok(HANGUL_RE.test(cushionKo.to_b));
assert.match(cushionKo.to_a + cushionKo.to_b, /예:|따로|1:1/);

const deKo = deKoFromReport;
assert.ok(HANGUL_RE.test(deKo.detail));
assert.ok(!/Slack\/Teams|Peace Treaty|Take It Offline/.test(deKo.title + deKo.detail));

const baselineKo = ko.meta.prescription_work.items.find((i) => i.topic === "office_baseline");
assert.ok(baselineKo);
assert.ok(HANGUL_RE.test(baselineKo.dont_list.join(" ")));
assert.ok(!baselineKo.dont_list.some((s) => /카톡/.test(s)), "baseline avoids Kakao-only assumption");
assert.match(baselineKo.dont_list.join(" "), /메신저|따로/);
ok("ko-KR slice uses natural Korean workplace framing");

section("Omitted locale → legacy ko-KR fallback");
const omitted = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  pairWork: pairWorkLow,
});
assert.equal(
  omitted.office.section_mix_fit.reporting_style_fit.person_a.style,
  koReporting.person_a.style,
);
assert.ok(HANGUL_RE.test(omitted.office.section_mix_fit.reporting_style_fit.summary));
assert.equal(
  omitted.office.section_warning.de_escalation.color,
  ko.office.section_warning.de_escalation.color,
);
ok("omitted locale preserves Korean legacy fallback");

section("Prescription builder alone — baseline locale split");
const rxOnlyEn = buildWorkPrescriptions({
  pair: pairWorkLow,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "en-US",
});
const rxOnlyKo = buildWorkPrescriptions({
  pair: pairWorkLow,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(rxOnlyEn.items[0].topic, "office_baseline");
assert.equal(rxOnlyKo.items[0].topic, "office_baseline");
assert.notEqual(rxOnlyEn.items[0].do_list[0], rxOnlyKo.items[0].do_list[0]);
ok("office_baseline prescription locale copies diverge");

console.log("\nOK: work locale cultural slice tests passed");
