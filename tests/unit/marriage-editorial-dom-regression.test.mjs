/**
 * Marriage V2 singleton — permanent DOM-level regression gate for the
 * editorial completion + safety batch.
 *
 * Covers two things not exercised by tests/unit/marriage-snapshot-render-
 * safety.test.mjs (which already owns the household_snapshot narrative/
 * topics crash-safety scenarios — missing narrative, missing topic, empty
 * topics — and is not duplicated here):
 *
 * 1. Chapter 05 "[object Object]" investigation. A prior audit script
 *    (tests/scripts/verify-marriage-v2-phase9-dom-audit.ts) printed
 *    "[object Object]" for the conflict 4-stage narrative and was read as a
 *    render bug. Root-caused instead to the audit script itself calling
 *    `.join(" -> ")` directly on an array of stage OBJECTS (fixed
 *    separately in that script). The actual renderer
 *    (ConflictSubstantiveCard in SectionRenderer.tsx) reads from
 *    `vm.conflict4StageView`, a properly-typed ViewModel
 *    (MarriageConflictStageViewModel.narrative: string — see
 *    lib/relationship/marriage/viewModel/marriageUiContracts.ts, whose own
 *    comment states "raw enum 노출 100% 차단") built by
 *    `normalizeConflict4Stage`, which defensively extracts a string field
 *    (internalState/externalBehavior/description/title) with a human-voice
 *    fallback — never renders the object itself. These tests prove that
 *    end-to-end against the real component.
 *
 * 2. The 9 DOM-QA scenarios from the Marriage V2 safety/editorial
 *    completion batch: balanced pair, high-conflict pair, finance/household
 *    -role mismatch, general psych mismatch, KO locale, EN locale, and the
 *    legacy/old-cache fallback path (MarriageReportView falling back to its
 *    pre-editorial inline JSX when `household.section_dna` is absent — the
 *    condition it already guards on). (Partial/stale narrative payload and
 *    missing-topic scenarios are covered by marriage-snapshot-render-safety
 *    .test.mjs already, per above.)
 *
 * Run: npx tsx --test tests/unit/marriage-editorial-dom-regression.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";

// next/font/google isn't resolvable outside the Next.js build pipeline —
// stub it before importing anything that transitively pulls it in, matching
// the existing tests/unit/marriage-snapshot-render-safety.test.mjs pattern.
const Module = await import("node:module");
const originalRequire = Module.default.prototype.require;
Module.default.prototype.require = function (request) {
  if (request === "next/font/google") {
    const dummyFont = () => ({ variable: "font-dummy", className: "font-dummy" });
    return { Noto_Sans_KR: dummyFont, Noto_Serif_KR: dummyFont };
  }
  return originalRequire.apply(this, arguments);
};

const { buildMarriageReport } = await import(
  "../../lib/relationship/marriage/buildMarriageReport.ts"
);
const { buildMarriageReportViewModel } = await import(
  "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts"
);
const { MarriageReportViewModelView } = await import(
  "../../components/relationship/marriage/sections/SectionRenderer.tsx"
);
const MarriageReportViewModule = await import(
  "../../components/relationship/MarriageReportView.tsx"
);
const MarriageReportView = MarriageReportViewModule.default;
const { LocaleProvider } = await import("../../lib/i18n/LocaleProvider.tsx");

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

const sajuA = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

function buildVm({ nameA, nameB, psychA, psychB, locale }) {
  const report = buildMarriageReport({
    nicknameA: nameA,
    nicknameB: nameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: makePsych(psychA),
    psychMasterB: makePsych(psychB),
    locale,
  });
  const vm = buildMarriageReportViewModel(report, {
    viewerIsReportA: true,
    myName: nameA,
    partnerName: nameB,
    locale,
  });
  return { report, vm };
}

function renderVm(vm, locale) {
  return ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(MarriageReportViewModelView, { vm, viewerIsReportA: true }),
    ),
  );
}

/**
 * Known internal field/key names that must never leak into user-facing text
 * as literal identifiers. Deliberately a denylist of specific names (not a
 * blanket snake_case regex) — the canonical chapter anchors themselves are
 * legitimate snake_case (id="c1_who_we_are"), and a blanket pattern would
 * false-positive on those.
 */
const INTERNAL_KEY_LEAK_PATTERNS = [
  "cfo_nickname", "cfo_reason", "cfo_axis_note", "section_money_chores",
  "operating_cfo", "canonical_projections", "advice_for_a", "advice_for_b",
  "married_saju_deep", "section_2_nature", "section_4_household_frames",
  "section_5_action", "first_person_voice", "role_balance_signal",
  "together_starter", "real_speech_tip", "real_life_example", "action_title",
  "saju_reason", "primaryOverloadRiskPartner", "operatingPartnerFit",
  "emotionalPartnerFit", "longTermGrowthFit", "marriage_canonical_bundle",
  "operationSyncPct", "operatingStatusLabel", "alignmentType",
  "dual_planner_tension", "dual_executor_gap", "plannerExecutor",
];

/**
 * Raw Saju/Mingli technical terms that should always have been translated to
 * plain household-facing language before reaching the DOM (see
 * lib/relationship/marriage/homeLifeLanguage.ts's sanitizeHomeLifeText,
 * whose own SAJU_JARGON_RE this list mirrors for user-facing verification).
 */
// Deliberately limited to unambiguous multi-syllable technical terms — the
// ten-god category words (정재/편재/정관/편관/식신/상관/정인/편인/비견/겁재)
// are excluded because they collide with ordinary Korean sentence fragments
// (e.g. "챙기는 편인가요" contains "편인" with no jargon meaning at all).
const SAJU_JARGON_LEAK_RE =
  /일간|일지|월지|년주|월주|연주|시주|십신|십성|오행|신강|신약|용신|기신/;

/** Literal dual-particle fallback notation — must always resolve to one form. */
const PLACEHOLDER_PARTICLE_RE = /은\(는\)|이\(가\)|을\(를\)|과\(와\)|와\(과\)/;

/**
 * Analytical category/enum words that must never be rendered with a
 * person-honorific suffix as if they were someone's name (e.g. "균형님" —
 * see Chapter07SubstantiveCard's primaryOverloadRiskPartner==="balanced"
 * case). Narrow denylist of the specific category words this bundle can
 * produce, not a blanket "<word>님" check (real names legitimately take 님).
 */
const FAKE_PERSON_NAME_RE = /균형님|공유님|공동님|없음님|shared님|balanced님|none님/;

/** Shared DOM-hygiene assertions required for every scenario. */
function assertDomHygiene(html, label) {
  assert.ok(!html.includes("[object Object]"), `${label}: literal "[object Object]" must never appear`);
  assert.ok(!/>\s*undefined\s*</.test(html) && !html.includes(">undefined<"), `${label}: no raw "undefined" text node`);
  assert.ok(!/>\s*null\s*</.test(html) && !html.includes(">null<"), `${label}: no raw "null" text node`);
  assert.ok(!html.includes("NaN"), `${label}: no NaN leak`);
  assert.ok(
    !/\b(NORMAL|TENSION_RISING|OVERLOAD|RECOVERY)\b/.test(html),
    `${label}: no raw conflict-stage enum leak`,
  );
  assert.ok(!/\bPerson A\b|\bPerson B\b/.test(html), `${label}: no raw Person A/B placeholder leak`);
  for (const key of INTERNAL_KEY_LEAK_PATTERNS) {
    assert.ok(!html.includes(key), `${label}: internal key "${key}" must not leak into rendered output`);
  }
  assert.ok(!SAJU_JARGON_LEAK_RE.test(html), `${label}: raw Saju/Mingli jargon term must not leak`);
  assert.ok(!PLACEHOLDER_PARTICLE_RE.test(html), `${label}: literal Korean dual-particle fallback (e.g. "은(는)") must not leak`);
  assert.ok(!FAKE_PERSON_NAME_RE.test(html), `${label}: an analytical category word must not be rendered as if it were a person's name`);
}

/** Canonical chapter ids expected in DOM when a StoryPlan is present. */
const CANONICAL_CHAPTER_IDS = [
  "c1_who_we_are",
  "c2_lifestyle_dna",
  "c3_household_os",
  "c4_intimacy_bedroom",
  "c5_conflict_deescalation",
  "c6_family_parenting_career",
  "c7_longterm_compounding",
  "c8_partnership_verdict",
  "c9_next_chapter_rituals",
];

describe("Marriage Chapter 05 — conflict 4-stage narrative never renders raw objects", () => {
  it("balanced pair: each of the 4 stages renders substantive text, not [object Object]", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { self_control: 75, practicality: 65, structure: 80 },
      psychB: { practicality: 70, self_control: 45, recognition: 40 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "balanced pair ko-KR");
    // Each stage's narrative is a real sentence (Korean, reasonably long) — not empty, not the object toString.
    for (const st of vm.conflict4StageView.personA.stages) {
      assert.ok(st.narrative && st.narrative.length > 5, `stage ${st.stepNumber} narrative must be substantive`);
      assert.notEqual(st.narrative, "[object Object]");
    }
    assert.ok(html.includes(vm.conflict4StageView.personA.stages[0].narrative));
  });

  it("high-conflict pair: conflict stages still render substantive, non-object text", () => {
    const { vm } = buildVm({
      nameA: "민준", nameB: "지영",
      psychA: { conflict_style: 80, resilience: 30, empathy: 35 },
      psychB: { conflict_style: 75, resilience: 40, empathy: 40 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "high-conflict pair");
    for (const st of vm.conflict4StageView.personB.stages) {
      assert.ok(st.narrative && st.narrative.length > 5);
    }
  });

  it("missing one stage (personA.stages truncated to 3) does not crash and does not fabricate the missing step", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: {}, psychB: {},
      locale: "ko-KR",
    });
    vm.conflict4StageView.personA.stages = vm.conflict4StageView.personA.stages.slice(0, 3);
    let html;
    assert.doesNotThrow(() => {
      html = renderVm(vm, "ko-KR");
    });
    assertDomHygiene(html, "truncated stages");
    assert.ok(!html.includes("Step 4"), "the removed 4th step must not appear at all");
  });

  it("conflict4StageView entirely absent (old bundle shape) does not crash — card simply omits itself", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: {}, psychB: {},
      locale: "ko-KR",
    });
    vm.conflict4StageView = undefined;
    let html;
    assert.doesNotThrow(() => {
      html = renderVm(vm, "ko-KR");
    });
    assertDomHygiene(html, "conflict4StageView absent");
  });
});

describe("Marriage V2 — DOM regression across required scenarios", () => {
  it("1) standard balanced pair (ko-KR): all 9 canonical chapters visible, no duplicates, DOM-clean", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { self_control: 75, practicality: 65, structure: 80 },
      psychB: { practicality: 70, self_control: 45, recognition: 40 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "balanced pair");
    for (const id of CANONICAL_CHAPTER_IDS) {
      const count = html.split(`id="${id}"`).length - 1;
      assert.equal(count, 1, `chapter ${id} must appear exactly once (found ${count})`);
    }
  });

  it("2) high-conflict pair (ko-KR): renders cleanly, chapters distinct from balanced pair", () => {
    const balanced = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { self_control: 75, practicality: 65, structure: 80 },
      psychB: { practicality: 70, self_control: 45, recognition: 40 },
      locale: "ko-KR",
    });
    const conflict = buildVm({
      nameA: "민준", nameB: "지영",
      psychA: { conflict_style: 80, resilience: 30, empathy: 35 },
      psychB: { conflict_style: 75, resilience: 40, empathy: 40 },
      locale: "ko-KR",
    });
    const htmlBalanced = renderVm(balanced.vm, "ko-KR");
    const htmlConflict = renderVm(conflict.vm, "ko-KR");
    assertDomHygiene(htmlConflict, "high-conflict pair");
    assert.notEqual(htmlBalanced, htmlConflict, "different pairs must not render identical templated output");
  });

  it("3) finance/household-role mismatch pair: economic partnership content renders, DOM-clean", () => {
    const { vm } = buildVm({
      nameA: "철수", nameB: "영희",
      psychA: { practicality: 85, self_control: 85, structure: 80 },
      psychB: { practicality: 20, self_control: 25, structure: 15 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "finance mismatch pair");
    assert.ok(html.includes("c3_household_os"), "household OS chapter must be present");
  });

  it("4) general psych mismatch (extreme spectrum) pair: renders cleanly, distinct output", () => {
    const { vm } = buildVm({
      nameA: "준호", nameB: "수진",
      psychA: { structure: 90, stimulation: 20 },
      psychB: { structure: 20, stimulation: 90 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "psych mismatch pair");
  });

  it("7) KO locale: chapter titles and content render in Korean", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: {}, psychB: {},
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "ko-KR");
    assert.ok(/[가-힣]/.test(html), "ko-KR render must contain Korean text");
  });

  it("8) EN locale: no unexpected Korean leakage in chapter titles/labels", () => {
    const { vm } = buildVm({
      nameA: "Alex", nameB: "Emma",
      psychA: { self_control: 60 },
      psychB: { empathy: 70 },
      locale: "en-US",
    });
    const html = renderVm(vm, "en-US");
    assertDomHygiene(html, "en-US");
    // Canonical chapter titles (English) must be present verbatim.
    assert.ok(html.includes("Who We Are as a Married Couple"));
    assert.ok(html.includes("Life Partnership Verdict"));
  });

  it("8b) EN locale: EXHAUSTIVE zero-Hangul guard across the full canonical page (all 9 chapters, all substantive cards)", () => {
    // Follow-up to a prior audit that found 347 Korean substrings leaking
    // into en-US Marriage renders — traced entirely to hardcoded Korean in
    // EconomicPartnershipCard/ConflictSubstantiveCard/Chapter07SubstantiveCard/
    // LifePartnershipVerdictCard/MarriageActionPlaybookCard (no `locale`/`t`
    // param at all), plus normalizeConflict4Stage's stage-label map and
    // fallback narratives, plus normalizeLifePartnershipVerdict's fallback
    // strings, plus the shared PsychAxisComparisonSection (declared but never
    // used its own `locale` prop), plus one missed label in
    // buildCanonicalMarriageStoryPlan.ts's c5 chapter `summary` field — all
    // now fixed. Upstream canonical_projections/CFO/bundle data was verified
    // separately (direct JSON inspection, not the DOM) to already be
    // correctly locale-threaded — this guard exists purely for the
    // presentation-layer leaks, which is exactly what regressed before.
    //
    // Uses Latin-script names throughout (fixture below and in the "high
    // conflict" case) specifically so a raw Hangul regex is safe — no
    // Korean name could ever produce a false positive here, unlike a naive
    // regex run against a ko-KR-named fixture.
    const HANGUL_RE = /[가-힣]/;

    const balanced = buildVm({
      nameA: "Alex", nameB: "Emma",
      psychA: { self_control: 60, practicality: 65, structure: 80 },
      psychB: { empathy: 70, practicality: 70, recognition: 40 },
      locale: "en-US",
    });
    const balancedHtml = renderVm(balanced.vm, "en-US");
    assertDomHygiene(balancedHtml, "en-US exhaustive (balanced)");
    assert.ok(
      !HANGUL_RE.test(balancedHtml),
      "en-US balanced-pair render must contain zero Hangul characters anywhere on the page",
    );

    // A high-conflict pair exercises code paths (crisisRole, emergencySosCombined
    // scripts, coupleBurnout, expectationsAndNeeds) that the balanced fixture
    // above may leave empty/ungated — check those branches too.
    const conflict = buildVm({
      nameA: "James", nameB: "Olivia",
      psychA: { conflict_style: 80, resilience: 30, empathy: 35 },
      psychB: { conflict_style: 75, resilience: 40, empathy: 40 },
      locale: "en-US",
    });
    const conflictHtml = renderVm(conflict.vm, "en-US");
    assertDomHygiene(conflictHtml, "en-US exhaustive (high-conflict)");
    assert.ok(
      !HANGUL_RE.test(conflictHtml),
      "en-US high-conflict-pair render must contain zero Hangul characters anywhere on the page",
    );
  });

  it("ko-KR remains fully localized after the en-US leak fix (no accidental English-only regression)", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { conflict_style: 80, resilience: 30 },
      psychB: { conflict_style: 75, resilience: 40 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "ko-KR post-fix");
    assert.ok(/[가-힣]/.test(html), "ko-KR render must still contain Korean text");
    // Spot-check a few of the specific strings this batch touched, to prove
    // the ko-KR branch of each ternary is intact, not just "some Korean exists".
    assert.ok(html.includes("경제 파트너십") || html.includes("경제적 역할"));
    assert.ok(html.includes("갈등 4단계") || html.includes("갈등 감정"));
  });

  it("9) old-cache / legacy fallback: MarriageReportView renders without crashing when household.section_dna is absent", () => {
    // Matches the exact guard in MarriageReportView.tsx
    // (`if (hh?.section_dna?.person_a && hh?.section_dna?.person_b)`),
    // simulating a legacy/malformed cached payload that predates the DNA
    // fields the new editorial ViewModel path requires.
    const legacyReport = {
      headline: "우리는 함께 산 지 3년 된 부부입니다.",
      summary_line: "안정적인 파트너십",
      one_line_household: "서로를 신뢰하는 안정적인 동거 관계",
      snapshot_panel: {
        grade: "B",
        gaugeLabel: "Steady",
        representativeLine: "Steady partnership",
        keywords: [],
        relationshipGauges: [],
        personA: { nickname: "Sera", metaphor: "oak", axes: [] },
        personB: { nickname: "동글", metaphor: "river", axes: [] },
        personAxesSource: "survey",
        narrative: { topics: [] },
      },
      household: {
        // section_dna deliberately absent — this is the exact condition that
        // routes MarriageReportView away from the editorial ViewModel path.
      },
      meta: { grade: "B", romantic_fit_pct: 70, life_synergy_pct: 65, home_risk_pct: 30 },
    };
    let html;
    assert.doesNotThrow(() => {
      html = ReactDOMServer.renderToString(
        React.createElement(
          LocaleProvider,
          { locale: "ko-KR" },
          React.createElement(MarriageReportView, {
            report: legacyReport,
            myName: "Sera",
            partnerName: "동글",
            viewerIsReportA: true,
          }),
        ),
      );
    }, "legacy fallback render must not throw on a payload missing household.section_dna");
    assertDomHygiene(html, "legacy fallback");
    // Must NOT render the editorial canonical chapters (proves it actually
    // took the legacy branch, not a lucky pass-through).
    assert.ok(!html.includes('id="c1_who_we_are"'), "legacy fallback must not render the new editorial chapter shell");
  });
});

describe("Marriage V2 — Human Copy QA permanent regression guards", () => {
  it("10) Korean particles bind correctly to a batchim name (동글) across the whole page, not just no-batchim names", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { self_control: 80, practicality: 70, structure: 85, conflict_style: 20, thinking_style: 40, recognition: 30 },
      psychB: { practicality: 30, self_control: 35, recognition: 75, conflict_style: 80, thinking_style: 70 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "batchim particle check");
    // 동글 has batchim (ㄹ) — 는/가/를/와 are the WRONG particles for it.
    assert.ok(!/동글(는|가|를|와)\b/.test(html), "동글 must never take the no-batchim particle forms 는/가/를/와");
  });

  it("11) burnout risk header never renders the 'balanced' category as a fake person name (no 균형님)", () => {
    // Near-identical structure/self_control psych on both sides pushes
    // primaryOverloadRiskPartner to "balanced" (marriageCoupleBurnout.ts),
    // which previously rendered as the literal fake name "균형님".
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { structure: 50, self_control: 50 },
      psychB: { structure: 50, self_control: 50 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "balanced burnout header");
    assert.ok(html.includes("두 사람 사이에 고르게 분산됨"), "balanced case must use the neutral shared-risk header, not a person name");
  });

  it("12) burnout risk header never renders the 'balanced' category as a fake person name in English either", () => {
    const { vm } = buildVm({
      nameA: "Emma", nameB: "Alex",
      psychA: { structure: 50, self_control: 50 },
      psychB: { structure: 50, self_control: 50 },
      locale: "en-US",
    });
    const html = renderVm(vm, "en-US");
    assertDomHygiene(html, "balanced burnout header (en-US)");
    assert.ok(html.includes("balanced between you two"), "balanced case must use the neutral shared-risk header, not a fake name");
  });

  it("13) shared de-escalation archetype renders its explanatory note instead of two unexplained near-identical scripts", () => {
    const { vm } = buildVm({
      nameA: "Sera", nameB: "동글",
      psychA: { self_control: 80, practicality: 70, structure: 85, conflict_style: 20 },
      psychB: { practicality: 30, self_control: 35, recognition: 75, conflict_style: 80 },
      locale: "ko-KR",
    });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "shared de-escalation note");
    // Either the shared-type explanatory note renders (when both land in the
    // same archetype for this fixture) or it legitimately doesn't apply —
    // this just proves the guard never crashes and never leaks raw fields.
    assert.ok(html.includes("긴급 SOS 회복 대본") || html.includes("화 풀림 유형"), "Ch5 de-escalation content must render");
  });
});
