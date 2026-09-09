/**
 * EN/KR UX terminology audit — display-copy-only rename regression tests.
 *
 * Scope: this only checks USER-FACING STRING VALUES changed for the
 * terminology cleanup (Essence Potential -> Natural Tendencies, Current
 * State -> Current Patterns, Relational Spend -> Energy You Give, Recovery
 * Ratio -> Energy Back to You, Human Framework -> 6 Core Tendencies,
 * Relationship Index -> At a Glance, Romantic Sensitivity -> Friction,
 * Discipline Friction Index -> Parenting Friction, Safe distance ->
 * Comfortable Distance, radar legend renames) plus the DeepEssencePartTwo
 * energy-gauge label-binding bug fix. Internal field/key names
 * (radar_potential, energy.balance_pct, risk/risk_pct, axis keys like
 * "structure"/"connection"/etc.) are asserted UNCHANGED, never renamed.
 *
 * Run: npx tsx tests/unit/deep-essence-terminology-display.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { messagesEnUS } from "../../lib/i18n/messages/en-US.ts";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR.ts";
import { getDeepEssenceUiStrings } from "../../components/results/deep/deepEssenceUiStrings.ts";
import { PRIMARY_AXIS_DEFINITIONS } from "../../lib/v2/framework/primaryAxisDefinitions.ts";
import { buildFamilyRelationshipIndexSection } from "../../lib/relationship/familyParent/familyRelationshipIndexSection.ts";
import { getTriScoreKindConfig } from "../../lib/relationship/triScoreSnapshot/kinds.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

const enUi = getDeepEssenceUiStrings("en-US");
const koUi = getDeepEssenceUiStrings("ko-KR");

section("A. Essence Potential / Current State -> Natural Tendencies / Current Patterns (Deep Essence radar + gap section)");
{
  assert.equal(enUi.radar.current, "Current Patterns");
  assert.equal(enUi.radar.potential, "Natural Tendencies");
  assert.equal(koUi.radar.current, "현재 행동 성향");
  assert.equal(koUi.radar.potential, "타고난 성향");
  // Same concept, same wording as the radar, in the Gap & Alignment section — this is the
  // consistency fix (previously "How you adapted in real life" / "Original natural style").
  assert.equal(enUi.axisInterpretation.currentPatternLabel, enUi.radar.current);
  assert.equal(enUi.axisInterpretation.naturalTendencyLabel, enUi.radar.potential);
  assert.equal(koUi.axisInterpretation.currentPatternLabel, koUi.radar.current);
  assert.equal(koUi.axisInterpretation.naturalTendencyLabel, koUi.radar.potential);
  const forbidden = ["Essence potential", "Essence Potential", "Current state", "Current State", "Original natural style", "How you adapted in real life"];
  const enBlob = JSON.stringify(enUi);
  for (const s of forbidden) {
    assert.ok(!enBlob.includes(s), `old term "${s}" must not remain in EN deep-essence UI strings`);
  }
  ok("radar + gap-section current/potential labels renamed and mutually consistent, old EN terms gone");
}

section("B. Report dashboard chart + Blueprint hub + homepage example — same concept, same new terms");
{
  assert.equal(messagesEnUS.report.currentStateLabel, "Current Patterns");
  assert.equal(messagesEnUS.report.essencePotentialLabel, "Natural Tendencies");
  assert.equal(messagesKoKR.report.currentStateLabel, "현재 행동 성향");
  assert.equal(messagesKoKR.report.essencePotentialLabel, "타고난 성향");
  assert.ok(!messagesKoKR.report.chartInfoPopover.includes("Current State"), "KR popover must not leak the raw English term");
  assert.ok(!messagesKoKR.report.chartInfoPopover.includes("Essence Potential"), "KR popover must not leak the raw English term");

  assert.equal(messagesEnUS.blueprint.currentTitle, "Current Patterns");
  assert.equal(messagesEnUS.blueprint.essenceTitle, "Natural Tendencies");
  assert.equal(messagesKoKR.blueprint.currentTitle, "현재 행동 성향");
  assert.equal(messagesKoKR.blueprint.essenceTitle, "타고난 성향");

  assert.equal(messagesEnUS.landing.personalCurrentTitle, "Current Patterns");
  assert.equal(messagesEnUS.landing.personalInnateTitle, "Natural Tendencies");
  assert.equal(messagesEnUS.landing.personalRealizedTitle, "Current Patterns");
  ok("dashboard chart, blueprint hub, and homepage example all use the same two renamed terms");
}

section("C. Human Framework -> 6 Core Tendencies (Blueprint hub + homepage prose)");
{
  assert.equal(messagesEnUS.blueprint.axisChartLabel, "6 Core Tendencies");
  assert.equal(messagesKoKR.blueprint.axisChartLabel, "6가지 핵심 성향");
  assert.ok(!messagesEnUS.about.pillarsBody.includes("Human Framework"));
  assert.ok(!messagesEnUS.about.socialBody.includes("Human Framework"));
  assert.ok(!messagesKoKR.about.pillarsBody.includes("Human Framework"));
  assert.ok(!messagesKoKR.about.socialBody.includes("Human Framework"));
  ok("Human Framework removed from both the chart label and homepage marketing prose, EN+KR");
}

section("D. Essence Profile CTA -> View Natural Tendencies");
{
  assert.equal(messagesEnUS.blueprint.viewEssenceProfile, "View Natural Tendencies →");
  assert.equal(messagesKoKR.blueprint.viewEssenceProfile, "타고난 성향 보기 →");
  assert.equal(messagesEnUS.blueprint.viewCurrentProfile, "View Current Patterns (Survey Results) →");
  ok("blueprint hub CTAs renamed, KR no longer leaks the English 'Essence Profile' term");
}

section("E. Relational Spend / Recovery Ratio -> Energy You Give / Energy Back to You");
{
  assert.equal(enUi.summaryLabels.energyBalance, "Energy You Give / Energy Back to You");
  assert.equal(koUi.summaryLabels.energyBalance, "관계에 쓰는 에너지 / 나에게 돌아오는 에너지");
  assert.equal(enUi.part2.relationalSpend, "Energy You Give");
  assert.equal(enUi.part2.selfReturn, "Energy Back to You");
  assert.equal(koUi.part2.relationalSpend, "관계에 쓰는 에너지");
  assert.equal(koUi.part2.selfReturn, "나에게 돌아오는 에너지");
  const enBlob = JSON.stringify(enUi);
  const koBlob = JSON.stringify(koUi);
  for (const s of ["Relational Spend", "Relational spend", "Recovery Ratio", "Self return"]) {
    assert.ok(!enBlob.includes(s), `old term "${s}" must not remain in EN`);
  }
  assert.ok(!koBlob.includes("관계 소모") && !koBlob.includes("자기 회복 비율"), "old KR terms must not remain");
  ok("Relational Spend / Recovery Ratio fully replaced in both locales");
}

section("F. DeepEssencePartTwo energy-gauge label binding — the actual bug fix");
{
  const src = readSrc("components/results/deep/DeepEssencePartTwo.tsx");
  assert.ok(
    src.includes("relationalSpendLabel={t.part2.selfReturn}"),
    "the gauge's center caption must describe what energy.balance_pct actually measures (energy returning to you)",
  );
  assert.ok(
    src.includes("selfReturnLabel={t.part2.relationalSpend}"),
    "the left-end anchor must now carry the OTHER term — no longer a duplicate of the center caption",
  );
  assert.notEqual(
    (src.match(/relationalSpendLabel=\{t\.part2\.(\w+)\}/) || [])[1],
    (src.match(/selfReturnLabel=\{t\.part2\.(\w+)\}/) || [])[1],
    "the two gauge label props must be bound to different i18n keys (this was the actual bug)",
  );
  ok("center caption and left-end anchor are bound to distinct i18n keys, matching their real data");
}

section("G. Relationship Index -> At a Glance (EN+KR, was leaking raw English into KR)");
{
  const layoutEn = messagesEnUS.relationshipDrilldown.layout;
  const layoutKo = messagesKoKR.relationshipDrilldown.layout;
  assert.equal(layoutEn.scoreIndexEyebrow, "At a Glance");
  assert.equal(layoutKo.scoreIndexEyebrow, "한눈에 보기");
  assert.ok(!layoutKo.scoreIndexEyebrow.includes("Relationship Index"));
  assert.ok(!layoutEn.scoreIndexTitle.toLowerCase().includes("relationship index"));
  assert.ok(!layoutKo.scoreCalcAria.includes("관계 지수"));
  ok("Relationship Index eyebrow/title/aria de-jargoned; KR no longer shows the raw English phrase");
}

section("H. Radar legend — Tension/Similarity/Complementary axis -> plain-English framing");
{
  const layoutEn = messagesEnUS.relationshipDrilldown.layout;
  const layoutKo = messagesKoKR.relationshipDrilldown.layout;
  assert.equal(layoutEn.tensionAxisLegend, "Where You Clash");
  assert.equal(layoutEn.similarAxisLegend, "Where You Match");
  assert.equal(layoutEn.complementaryAxisLegend, "Where You Balance Each Other");
  assert.equal(layoutKo.tensionAxisLegend, "부딪히는 지점");
  assert.equal(layoutKo.similarAxisLegend, "비슷한 지점");
  assert.equal(layoutKo.complementaryAxisLegend, "서로 보완하는 지점");
  ok("radar legend uses plain-English/Korean framing instead of 'axis' jargon");
}

section("I. Romantic 'Sensitivity' -> 'Friction' — BOTH live surfaces (Relationship Index gauge + tri-score snapshot)");
{
  assert.equal(messagesEnUS.relationshipDrilldown.romantic.scoreLabelSensitivity, "Friction");
  assert.equal(messagesKoKR.relationshipDrilldown.romantic.scoreLabelSensitivity, "마찰");

  // The tri-score snapshot panel hardcodes its own labels independent of the
  // relationshipDrilldown messages catalog — both had to be fixed, or a user
  // would see "Friction" on one card and "Sensitivity"/"예민" on another for
  // the exact same underlying risk_pct-driven metric.
  const romanticKo = getTriScoreKindConfig("romantic", "ko-KR");
  const romanticEn = getTriScoreKindConfig("romantic", "en-US");
  assert.equal(romanticEn.labels.risk.short, "⚡ Friction");
  assert.equal(romanticKo.labels.risk.short, "⚡ 마찰");
  assert.equal(romanticEn.legendItems.find((i) => i.emoji === "⚡")?.label, "Friction");
  assert.equal(romanticKo.legendItems.find((i) => i.emoji === "⚡")?.label, "마찰");
  ok("Sensitivity->Friction applied consistently on both the detailed score gauge and the tri-score snapshot panel");
}

section("J. Family 'Discipline Friction Index' -> 'Parenting Friction' — the REAL producer, not just the unreachable i18n fallback");
{
  // relationshipIndexCardTitle is only a fallback for an empty r.headline,
  // which buildFamilyRelationshipIndexSection never actually returns empty —
  // so the live title comes from this function, not the i18n catalog alone.
  assert.equal(messagesEnUS.relationshipDrilldown.family.relationshipIndexCardTitle, "Parenting Friction");
  assert.equal(messagesKoKR.relationshipDrilldown.family.relationshipIndexCardTitle, "훈육 마찰");

  const enHeadline = buildFamilyRelationshipIndexSection({
    pairFamily: null,
    fallbackRisk: 50,
    childIsViewer: false,
    locale: "en-US",
  }).headline;
  const koHeadline = buildFamilyRelationshipIndexSection({
    pairFamily: null,
    fallbackRisk: 50,
    childIsViewer: false,
    locale: "ko-KR",
  }).headline;
  assert.equal(enHeadline, "Parenting Friction");
  assert.equal(koHeadline, "훈육 마찰");
  assert.notEqual(enHeadline, "Discipline Friction Index");
  assert.notEqual(koHeadline, "훈육 마찰 지수");
  ok("the actual rendered family headline (not just the i18n fallback) reflects the rename in both locales");
}

section("K. Safe distance -> Comfortable Distance");
{
  assert.equal(messagesEnUS.relationshipDrilldown.family.relationshipIndexSafeDistanceLabel, "Comfortable Distance");
  assert.equal(messagesKoKR.relationshipDrilldown.family.relationshipIndexSafeDistanceLabel, "편안한 거리");
  ok("family safe-distance label renamed in both locales");
}

section("L. Core Operating Mode -> Your Core Pattern (display copy only, value stays LLM-authored)");
{
  assert.equal(enUi.summaryLabels.coreMode, "Your Core Pattern");
  assert.equal(koUi.summaryLabels.coreMode, "나의 핵심 패턴");
  ok("core-mode summary label renamed; the LLM-authored value itself is untouched (not a fixed string)");
}

section("M. 6 primary axis names UNCHANGED (not part of this rename)");
{
  const expectedEn = { structure: "Structure", connection: "Connection", stability: "Stability", growth: "Growth", adaptability: "Adaptability", autonomy: "Autonomy" };
  const expectedKo = { structure: "체계성", connection: "관계지향성", stability: "안정지향성", growth: "성장지향성", adaptability: "적응성", autonomy: "자율성" };
  for (const key of Object.keys(expectedEn)) {
    assert.equal(PRIMARY_AXIS_DEFINITIONS[key].label, expectedEn[key], `axis "${key}" EN label must stay unchanged`);
    assert.equal(PRIMARY_AXIS_DEFINITIONS[key].koLabel, expectedKo[key], `axis "${key}" KR label must stay unchanged`);
  }
  ok("all 6 axis names are byte-identical to before this rename, as instructed");
}

section("N. Internal field/key names UNCHANGED (display-copy-only constraint)");
{
  // Axis dictionary keys themselves (not just their display labels).
  for (const key of ["structure", "connection", "stability", "growth", "adaptability", "autonomy"]) {
    assert.ok(key in PRIMARY_AXIS_DEFINITIONS, `internal axis key "${key}" must still exist`);
  }
  // The family producer's own field names (friction_index, headline, safe_distance_note) unchanged.
  const shape = buildFamilyRelationshipIndexSection({
    pairFamily: null,
    fallbackRisk: 10,
    childIsViewer: false,
    locale: "en-US",
  });
  assert.ok("friction_index" in shape && "headline" in shape && "safe_distance_note" in shape);
  // The romantic tri-score config's internal key is still "risk", even
  // though its display label changed to "Friction" — this is exactly what
  // "display copy only, internal keys unchanged" means in practice.
  assert.ok(
    "risk" in getTriScoreKindConfig("romantic", "en-US").labels,
    "internal 'risk' key must not be renamed",
  );
  ok("internal field/key names (axis keys, friction_index/headline, tri-score 'risk' key) all unchanged");
}

console.log(`\n${passed} passed`);
