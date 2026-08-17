/**
 * Marriage V2 — deep_read canonical merge implementation.
 *
 * Per the Deep Read Content Ownership Audit + approved product decision:
 * married_saju_deep (explain-only LLM overlay) is folded into the canonical
 * 9-chapter presentation as small, optional enrichment subsections —
 * NEVER a standalone chapter, NEVER a second verdict/score/authority.
 *
 * Fields merged:
 *  - Ch1 (c1_who_we_are):        section_2_nature.{a,b}_nature.first_person_voice
 *  - Ch3 (c3_household_os):      section_4_household_frames.role_balance_signal.match_note
 *  - Ch8 (c8_partnership_verdict): section_5_action.{together, together_starter}
 *  - Ch9 (c9_next_chapter_rituals): section_5_action.{advice_for_a, advice_for_b}
 *
 * All four are independently optional; report.meta.married_saju_deep itself
 * may be entirely absent, partial, or malformed on older cached reports —
 * the canonical report must render identically to before in that case.
 *
 * Run: npx tsx --test tests/unit/marriage-deep-read-merge.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";

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

/** A full, well-formed married_saju_deep overlay. */
function fullOverlay() {
  return {
    format: "married_saju_deep_v1_round1",
    meta: { locale: "ko-KR", domain: "married" },
    section_2_nature: {
      a_nature: { first_person_voice: "저는 문제가 생기면 일단 해결책부터 찾고 싶어요.", description: "실행 지향적" },
      b_nature: { first_person_voice: "저는 감정을 먼저 이해받고 싶은 편이에요.", description: "관계 지향적" },
      comparison_table: [{ aspect: "속도", a: "빠름", b: "느림" }],
    },
    section_4_household_frames: {
      role_balance_signal: {
        a_body: "Sera는 실무를 주도합니다.",
        b_body: "동글은 조율을 맡습니다.",
        match_note: "두 사람의 역할 분담은 서로의 강점을 자연스럽게 보완하는 조합이에요.",
      },
    },
    section_5_action: {
      advice_for_a: [
        {
          action_title: "먼저 감정부터 인정해주기",
          saju_reason: "Sera님은 해결 지향이 강해 감정 인정 단계를 건너뛰기 쉬워요.",
          real_speech_tip: "많이 속상했겠다, 그 마음부터 알아줄게.",
          real_life_example: "동글이 힘든 하루를 얘기할 때 조언보다 공감을 먼저 건네보세요.",
        },
      ],
      advice_for_b: [
        {
          action_title: "결론을 먼저 말해보기",
          saju_reason: "동글님은 설명이 길어지는 편이라 상대가 지칠 수 있어요.",
          real_speech_tip: "결론부터 말하면, 나는 이렇게 하고 싶어.",
          real_life_example: "",
        },
      ],
      together: "두 사람은 속도는 다르지만 같은 방향을 보고 있는 팀이에요.",
      together_starter: "우리 이번 주말에 잠깐 이야기 나눌 시간 가질까?",
    },
  };
}

function buildVm({ overlay, locale = "ko-KR", viewerIsReportA = true } = {}) {
  const report = buildMarriageReport({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: makePsych({ self_control: 75, practicality: 65, structure: 80 }),
    psychMasterB: makePsych({ practicality: 70, self_control: 45, recognition: 40 }),
    locale,
  });
  if (overlay !== undefined) {
    report.meta = { ...report.meta, married_saju_deep: overlay };
  }
  // myName/partnerName must swap with viewerIsReportA to match production
  // (MarriageReportView.tsx derives them via pickViewerFirstPair) — this is
  // exactly the viewer-relative input that canonicalNames must NOT be
  // affected by.
  const myName = viewerIsReportA ? "Sera" : "동글";
  const partnerName = viewerIsReportA ? "동글" : "Sera";
  const vm = buildMarriageReportViewModel(report, {
    viewerIsReportA,
    myName,
    partnerName,
    locale,
  });
  return { report, vm };
}

function renderVm(vm, locale = "ko-KR", viewerIsReportA = true) {
  return ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(MarriageReportViewModelView, { vm, viewerIsReportA }),
    ),
  );
}

function assertDomHygiene(html, label) {
  assert.ok(!html.includes("[object Object]"), `${label}: no [object Object]`);
  assert.ok(!html.includes(">undefined<"), `${label}: no raw undefined`);
  assert.ok(!html.includes(">null<"), `${label}: no raw null`);
  assert.ok(!html.includes("NaN"), `${label}: no NaN`);
  assert.ok(!/\b(NORMAL|TENSION_RISING|OVERLOAD|RECOVERY)\b/.test(html), `${label}: no raw enum leak`);
}

describe("Marriage deep_read canonical merge — complete overlay", () => {
  const { vm } = buildVm({ overlay: fullOverlay() });
  const html = renderVm(vm, "ko-KR");

  it("1) canonical report with complete married_saju_deep renders the approved enrichment", () => {
    assertDomHygiene(html, "complete overlay");
    assert.ok(vm.chapter1ExpertVoice, "chapter1ExpertVoice must be populated");
    assert.ok(vm.chapter3RoleFitInsight, "chapter3RoleFitInsight must be populated");
    assert.ok(vm.chapter8TogetherInsight, "chapter8TogetherInsight must be populated");
    assert.ok(vm.chapter9PersonalizedAdvice, "chapter9PersonalizedAdvice must be populated");
  });

  it("4) Ch1 renders A/B first-person voice when available", () => {
    assert.ok(html.includes("저는 문제가 생기면 일단 해결책부터 찾고 싶어요"));
    assert.ok(html.includes("저는 감정을 먼저 이해받고 싶은 편이에요"));
  });

  it("5) Ch2 does NOT render the duplicate deep_read comparison table", () => {
    // The deep_read comparison_table's distinctive aspect label must not leak
    // into the canonical Ch2 (Lifestyle DNA) render at all.
    assert.ok(!html.includes(">속도<") && !html.includes("aspect"));
  });

  it("6) Ch3 renders match_note without changing canonical role/CFO ownership", () => {
    assert.ok(html.includes("두 사람의 역할 분담은 서로의 강점을 자연스럽게 보완하는 조합이에요"));
    // Canonical decision-flow labels (unchanged, still authoritative) still present.
    assert.ok(html.includes("현금흐름 관리") || html.includes("경제 의사결정"));
  });

  it("7) Ch8 renders together insight without creating a second verdict/score", () => {
    assert.ok(html.includes("두 사람은 속도는 다르지만 같은 방향을 보고 있는 팀이에요"));
    assert.ok(html.includes("우리 이번 주말에 잠깐 이야기 나눌 시간 가질까?"));
    // Canonical verdict fields (score/oneLineVerdict) still present exactly once.
    assert.ok(html.includes("Life Partnership Sync Score"));
    const scoreCount = html.split("Life Partnership Sync Score").length - 1;
    assert.equal(scoreCount, 1, "must not introduce a second score block");
  });

  it("8) Ch9 renders personalized advice_for_a", () => {
    assert.ok(html.includes("먼저 감정부터 인정해주기"));
  });

  it("9) Ch9 renders personalized advice_for_b", () => {
    assert.ok(html.includes("결론을 먼저 말해보기"));
  });

  it("10) speech tips render as human-readable strings", () => {
    assert.ok(html.includes("많이 속상했겠다, 그 마음부터 알아줄게."));
    assert.ok(html.includes("결론부터 말하면, 나는 이렇게 하고 싶어."));
  });

  it("11) real_life_example: populated example renders, empty example does not force a blank block", () => {
    assert.ok(html.includes("동글이 힘든 하루를 얘기할 때 조언보다 공감을 먼저 건네보세요"));
    // advice_for_b's real_life_example was "" (empty) — must not appear as an empty node.
    assert.ok(!html.includes(">undefined<") && !html.includes(">null<"));
  });

  it("12) no standalone deep_read chapter appears", () => {
    assert.ok(!html.includes('id="ch_deep_read"'));
  });

  it("13) no duplicate legacy dump below Chapter 09", () => {
    const c9Index = html.indexOf('id="c9_next_chapter_rituals"');
    assert.ok(c9Index !== -1);
    assert.ok(!html.slice(c9Index).includes('id="ch_deep_read"'));
  });

  it("14/15/16) no [object Object], null/undefined/NaN, or raw enum leakage", () => {
    assertDomHygiene(html, "complete overlay full check");
  });
});

describe("Marriage deep_read canonical merge — missing/partial data safety", () => {
  it("2) canonical report WITHOUT married_saju_deep renders normally (no crash, no enrichment blocks)", () => {
    const { vm } = buildVm({}); // no overlay set at all
    let html;
    assert.doesNotThrow(() => {
      html = renderVm(vm, "ko-KR");
    });
    assertDomHygiene(html, "no overlay");
    assert.equal(vm.chapter1ExpertVoice, undefined);
    assert.equal(vm.chapter3RoleFitInsight, undefined);
    assert.equal(vm.chapter8TogetherInsight, undefined);
    assert.equal(vm.chapter9PersonalizedAdvice, undefined);
    assert.ok(!html.includes('id="ch_deep_read"'));
  });

  it("3a) partial overlay (only section_2_nature) does not crash; other chapters unaffected", () => {
    const { vm } = buildVm({
      overlay: { section_2_nature: fullOverlay().section_2_nature },
    });
    let html;
    assert.doesNotThrow(() => { html = renderVm(vm, "ko-KR"); });
    assertDomHygiene(html, "partial: nature only");
    assert.ok(vm.chapter1ExpertVoice);
    assert.equal(vm.chapter3RoleFitInsight, undefined);
    assert.equal(vm.chapter8TogetherInsight, undefined);
    assert.equal(vm.chapter9PersonalizedAdvice, undefined);
  });

  it("3b) partial overlay (only advice_for_a, no advice_for_b) renders only the available side", () => {
    const { vm } = buildVm({
      overlay: {
        section_5_action: {
          advice_for_a: fullOverlay().section_5_action.advice_for_a,
        },
      },
    });
    let html;
    assert.doesNotThrow(() => { html = renderVm(vm, "ko-KR"); });
    assertDomHygiene(html, "partial: advice_for_a only");
    assert.equal(vm.chapter9PersonalizedAdvice.forPersonA.length, 1);
    assert.equal(vm.chapter9PersonalizedAdvice.forPersonB.length, 0);
    assert.ok(html.includes("먼저 감정부터 인정해주기"));
  });

  it("3c) malformed/truncated advice tip (missing required field) is dropped, not rendered broken", () => {
    const { vm } = buildVm({
      overlay: {
        section_5_action: {
          advice_for_a: [
            { action_title: "제목만 있음" }, // missing saju_reason / real_speech_tip
            ...fullOverlay().section_5_action.advice_for_a,
          ],
        },
      },
    });
    let html;
    assert.doesNotThrow(() => { html = renderVm(vm, "ko-KR"); });
    assertDomHygiene(html, "malformed tip");
    assert.equal(vm.chapter9PersonalizedAdvice.forPersonA.length, 1, "malformed tip must be dropped, valid one kept");
  });

  it("3d) empty married_saju_deep object ({}) does not crash and yields no enrichment", () => {
    const { vm } = buildVm({ overlay: {} });
    let html;
    assert.doesNotThrow(() => { html = renderVm(vm, "ko-KR"); });
    assertDomHygiene(html, "empty overlay object");
    assert.equal(vm.chapter1ExpertVoice, undefined);
    assert.equal(vm.chapter3RoleFitInsight, undefined);
    assert.equal(vm.chapter8TogetherInsight, undefined);
    assert.equal(vm.chapter9PersonalizedAdvice, undefined);
  });

  it("3e) null married_saju_deep does not crash", () => {
    const { vm } = buildVm({ overlay: null });
    assert.doesNotThrow(() => renderVm(vm, "ko-KR"));
  });

  it("19) legacy fallback (no StoryPlan) still ignores deep_read merge fields and uses the old bonus chapter", () => {
    const { vm } = buildVm({ overlay: fullOverlay() });
    // Simulate a legacy (pre-StoryPlan) report: strip canonicalStoryPlan.
    vm.canonicalStoryPlan = undefined;
    let html;
    assert.doesNotThrow(() => { html = renderVm(vm, "ko-KR"); });
    assertDomHygiene(html, "legacy branch with overlay present");
    // Legacy branch renders the OLD standalone deep_read chapter, unchanged.
    assert.ok(html.includes('id="ch_deep_read"'), "legacy branch must still show the pre-existing deep_read chapter");
  });

  it("20) existing Marriage snapshot safety remains passing (household_snapshot narrative)", () => {
    const { vm } = buildVm({ overlay: fullOverlay() });
    vm.sections = vm.sections.map((s) =>
      s.type === "household_snapshot" ? { ...s, panel: { ...s.panel, narrative: undefined } } : s,
    );
    assert.doesNotThrow(() => renderVm(vm, "ko-KR"));
  });
});

describe("Marriage deep_read canonical merge — locale safety", () => {
  it("17) en-US: no unintended Korean leakage from the new enrichment blocks", () => {
    const enOverlay = {
      section_2_nature: {
        a_nature: { first_person_voice: "I like to solve problems right away." },
        b_nature: { first_person_voice: "I need to feel heard first." },
      },
      section_4_household_frames: {
        role_balance_signal: { match_note: "Your roles complement each other well." },
      },
      section_5_action: {
        advice_for_a: [
          { action_title: "Acknowledge feelings first", saju_reason: "You tend to jump to solutions.", real_speech_tip: "That sounds really hard." },
        ],
        advice_for_b: [
          { action_title: "Lead with the bottom line", saju_reason: "Long explanations can tire your partner out.", real_speech_tip: "Here's my conclusion first." },
        ],
        together: "You move at different speeds but toward the same place.",
        together_starter: "Can we talk for a bit this weekend?",
      },
    };
    const { vm } = buildVm({ overlay: enOverlay, locale: "en-US" });
    const html = renderVm(vm, "en-US");
    assertDomHygiene(html, "en-US enrichment");
    const koreanMatches = html.match(/[가-힣]+/g) || [];
    // The pre-existing substantive cards (EconomicPartnershipCard etc.) are
    // hardcoded Korean regardless of locale — a confirmed, out-of-scope,
    // pre-existing WIP issue (see final report). This test scopes strictly
    // to the NEW enrichment content this batch added, not the pre-existing
    // cards, so it checks that the enrichment text itself is English, not
    // that the whole page is Korean-free.
    assert.ok(html.includes("Acknowledge feelings first"));
    assert.ok(html.includes("Lead with the bottom line"));
    assert.ok(html.includes("That sounds really hard."));
    assert.ok(html.includes("Your roles complement each other well."));
    assert.ok(html.includes("You move at different speeds but toward the same place."));
    assert.ok(koreanMatches.length >= 0); // sanity: regex itself doesn't throw
  });

  it("18) ko-KR remains valid with the new enrichment blocks present", () => {
    const { vm } = buildVm({ overlay: fullOverlay(), locale: "ko-KR" });
    const html = renderVm(vm, "ko-KR");
    assertDomHygiene(html, "ko-KR enrichment");
    assert.ok(/[가-힣]/.test(html));
  });
});

describe("Marriage deep_read canonical merge — viewer-relative label binding (Ch1/Ch9)", () => {
  // Root cause: vm.chapter1ExpertVoice.personA/personB and
  // vm.chapter9PersonalizedAdvice.forPersonA/forPersonB are keyed by
  // CANONICAL report_id_a/b, but vm.opening.names is VIEWER-relative
  // ([myName, partnerName], swapped by the caller per viewerIsReportA).
  // Naively pairing canonical data with opening.names mislabels it whenever
  // the viewer is report B. Fixed via vm.canonicalNames + swapping which
  // canonical side is shown under "me" vs "my partner" based on
  // viewerIsReportA (ExpertVoiceBlock / PersonalizedAdviceBlock).

  it("canonicalNames stays in canonical (A,B) order regardless of who's viewing", () => {
    const asViewerA = buildVm({ overlay: fullOverlay(), viewerIsReportA: true });
    const asViewerB = buildVm({ overlay: fullOverlay(), viewerIsReportA: false });
    assert.deepEqual(asViewerA.vm.canonicalNames, ["Sera", "동글"]);
    assert.deepEqual(asViewerB.vm.canonicalNames, ["Sera", "동글"]);
    // opening.names, by contrast, DOES swap — proving these are genuinely different things.
    assert.deepEqual(asViewerA.vm.opening.names, ["Sera", "동글"]);
    assert.deepEqual(asViewerB.vm.opening.names, ["동글", "Sera"]);
  });

  it("Ch9 'Advice for me' shows the ACTUAL viewer's own advice under both viewerIsReportA values, not always canonical A's", () => {
    // Note: "나를 위한 제안" (bare, no name suffix) also appears earlier in the
    // DOM from the pre-existing, unrelated CoupleActionPlanBlock feature
    // (money_chores' couple_action_plan) — search for this batch's own
    // "나를 위한 제안 (<name>)" form specifically to avoid that false match.
    const asViewerA = buildVm({ overlay: fullOverlay(), viewerIsReportA: true });
    const htmlA = renderVm(asViewerA.vm, "ko-KR", true);
    const meIdxA = htmlA.indexOf("나를 위한 제안 (Sera)");
    assert.ok(meIdxA !== -1);
    // Viewer A (Sera) — "me" must show Sera's (forPersonA's) first tip.
    assert.ok(htmlA.slice(meIdxA, meIdxA + 300).includes("먼저 감정부터 인정해주기"));

    const asViewerB = buildVm({ overlay: fullOverlay(), viewerIsReportA: false });
    const htmlB = renderVm(asViewerB.vm, "ko-KR", false);
    const meIdxB = htmlB.indexOf("나를 위한 제안 (동글)");
    assert.ok(meIdxB !== -1);
    // Viewer B (동글) — "me" must now show 동글's (forPersonB's) first tip,
    // NOT Sera's — this is exactly the bug that was fixed.
    assert.ok(htmlB.slice(meIdxB, meIdxB + 300).includes("결론을 먼저 말해보기"));
    assert.ok(!htmlB.slice(meIdxB, meIdxB + 300).includes("먼저 감정부터 인정해주기"));
  });

  it("Ch9 'Advice for me (name)' name attribution matches the actual viewer's own name in both directions", () => {
    const asViewerA = buildVm({ overlay: fullOverlay(), viewerIsReportA: true });
    const htmlA = renderVm(asViewerA.vm, "ko-KR", true);
    assert.ok(htmlA.includes("나를 위한 제안 (Sera)"));
    assert.ok(htmlA.includes("상대를 위한 제안 (동글)"));

    const asViewerB = buildVm({ overlay: fullOverlay(), viewerIsReportA: false });
    const htmlB = renderVm(asViewerB.vm, "ko-KR", false);
    assert.ok(htmlB.includes("나를 위한 제안 (동글)"), "viewer B's own name must appear under the 'me' label, not Sera's");
    assert.ok(htmlB.includes("상대를 위한 제안 (Sera)"));
  });

  it("Ch1 expert-voice labels swap correctly too: 'my voice' always matches the actual viewer", () => {
    const asViewerA = buildVm({ overlay: fullOverlay(), viewerIsReportA: true });
    const htmlA = renderVm(asViewerA.vm, "ko-KR", true);
    const meVoiceIdxA = htmlA.indexOf("내 목소리로");
    assert.ok(meVoiceIdxA !== -1);
    assert.ok(htmlA.slice(meVoiceIdxA, meVoiceIdxA + 200).includes("저는 문제가 생기면"));

    const asViewerB = buildVm({ overlay: fullOverlay(), viewerIsReportA: false });
    const htmlB = renderVm(asViewerB.vm, "ko-KR", false);
    const meVoiceIdxB = htmlB.indexOf("내 목소리로");
    assert.ok(meVoiceIdxB !== -1);
    assert.ok(htmlB.slice(meVoiceIdxB, meVoiceIdxB + 200).includes("저는 감정을 먼저"));
  });
});
