/**
 * Family Premium content generation must be locale-aware — English requests
 * must never contain Korean prose (the bug: rule-based generators had zero
 * locale param and always emitted Korean regardless of site locale).
 * Run: npx tsx tests/unit/family-premium-locale.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
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

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

function buildReport(locale) {
  return buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: sajuChild,
    sajuJsonB: sajuParent,
    locale,
  });
}

section("Explicit locale: en-US — no Korean prose leaks into Family Premium content");
const enReport = buildReport("en-US");
// NOTE: report.meta.uncertain_items comes from the shared saju-engine blueprint
// (lib/saju/sajuBlueprint.ts), used identically by all 5 relationship kinds and
// never rendered by FamilyParentReportView.tsx or any other component — it is
// out of scope for this Family-only pilot and intentionally excluded below.
assert.ok(!HANGUL_RE.test(enReport.headline));
assert.ok(!HANGUL_RE.test(enReport.one_line_family));
assert.ok(!HANGUL_RE.test(enReport.snapshot_panel.gaugeLabel));
assert.ok(enReport.snapshot_panel.keywords.every((k) => !HANGUL_RE.test(k)));
assert.ok(
  enReport.snapshot_panel.relationshipGauges.every((g) => !HANGUL_RE.test(g.label)),
);
ok("en-US top-level headline/snapshot fields have zero Hangul characters");

// Spot-check the exact fields the UI renders (FamilyParentReportView.tsx)
const dna = enReport.family.section_child_dna;
for (const [key, value] of Object.entries(dna)) {
  assert.ok(!HANGUL_RE.test(value), `section_child_dna.${key} leaked Korean: ${value}`);
}
assert.ok(!HANGUL_RE.test(enReport.family.section_roles.parent_role_label));
assert.ok(!HANGUL_RE.test(enReport.one_line_family));
assert.ok(!HANGUL_RE.test(enReport.family.section_destiny.harmony_one_liner));
assert.ok(!HANGUL_RE.test(enReport.family.section_destiny.favoritism_warning));
assert.ok(!HANGUL_RE.test(enReport.family.parent_lens_summary));
assert.ok(!HANGUL_RE.test(enReport.family.section_growth_tunnel.current_challenge));
assert.ok(!HANGUL_RE.test(enReport.family.section_filial_reward.future_reward));
assert.ok(!HANGUL_RE.test(enReport.family.section_de_escalation.hashtag));
assert.ok(!HANGUL_RE.test(enReport.family.section_de_escalation.psych_state));
ok("every field rendered by FamilyParentReportView is Korean-free in en-US");

section("Explicit locale: ko-KR — must produce Korean prose (regression guard)");
const koReport = buildReport("ko-KR");
const koJson = JSON.stringify(koReport);
assert.ok(
  HANGUL_RE.test(koJson),
  "locale: 'ko-KR' must still produce Korean prose",
);
ok("explicit ko-KR still contains Korean (no regression)");

section("Omitted locale — must match legacy pre-migration behavior: Korean, NOT English");
// Policy: only an explicit locale: "en-US" request may switch to English.
// A caller that omits `locale` entirely (any pre-existing script, test, or
// future code that forgets to pass it) must see EXACTLY the old behavior —
// Korean — so nothing that previously worked silently flips language.
const omittedReport = buildFamilyParentReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
});
assert.ok(
  HANGUL_RE.test(JSON.stringify(omittedReport)),
  "omitting locale must fall back to Korean (legacy behavior), not silently switch to English",
);
ok("omitting locale falls back to Korean — legacy behavior preserved, no silent language switch");

console.log("\nOK: family premium locale tests passed");
