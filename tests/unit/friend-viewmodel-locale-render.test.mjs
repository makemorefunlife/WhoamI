/**
 * Master Cleanup Batch 1 — Friend KO fallback leak in EN reports.
 *
 * Root cause: buildFriendReportViewModel.ts's buildFriendChapterViewModels
 * had per-chapter Korean-only literal fallback strings (used whenever the
 * friend_saju_deep LLM overlay is absent/disabled/failed, or — for
 * ch07/ch09 — unconditionally) that were never gated on `isKo`, unlike the
 * adjacent coverageCards branches in the same function which already did
 * this correctly. Result: an en-US report with the overlay off/failed
 * could render Korean sentences.
 *
 * This test drives the REAL production functions
 * (buildFriendReportViewModel -> FriendReportViewModelView, SSR-rendered),
 * not just a JS-object shape check, across all 4 required combinations:
 * A) ko-KR + normal narrative (overlay present)
 * B) en-US + normal narrative (overlay present)
 * C) ko-KR + missing/disabled overlay (fallback path)
 * D) en-US + missing/disabled overlay (fallback path) — this is the exact
 *    combination the bug lived in.
 *
 * Run: npx tsx --test tests/unit/friend-viewmodel-locale-render.test.mjs
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

const { buildFriendReportViewModel } = await import(
  "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts"
);
const { FriendReportViewModelView } = await import(
  "../../components/relationship/friend/sections/SectionRenderer.tsx"
);
const { LocaleProvider } = await import("../../lib/i18n/LocaleProvider.tsx");

const CHAPTER_KEYS = [
  "ch01_why_us",
  "ch02_who_we_are",
  "ch03_social_dna_tempo",
  "ch04_play_travel",
  "ch05_communication_third_person",
  "ch06_conflict_repair",
  "ch07_expectation_boundaries",
  "ch08_distance_durability",
  "ch09_action_playbook",
];

function makeStoryPlan() {
  return {
    schemaVersion: "2.0.0",
    meta: {
      nicknameA: "지훈",
      nicknameB: "서연",
      locale: "ko-KR",
      storyPlanId: "test-plan",
      generatedAt: new Date().toISOString(),
    },
    chapters: CHAPTER_KEYS.map((chapterKey, i) => ({
      chapterKey,
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}`,
      userQuestion: `Question ${i + 1}`,
      primaryMeanings: [],
      supportingMeanings: [],
      synthesisCandidates: [],
      coverageModels: [],
      actionCandidates: [],
      prohibitedMeanings: [],
      narrativeGoal: "goal",
      narrativePriority: "MEDIUM",
    })),
    meaningOwnershipMap: {},
    llmHandoffPayload: {
      organizedMeanings: {},
      discrepancyNotes: [],
      chapterHandoffs: [],
    },
  };
}

/** overlayPresent=true supplies real English/Korean deep-overlay text (normal narrative path). */
function makeReport({ overlayPresent, coverage }) {
  const deep = overlayPresent
    ? {
        section_1_spark: { spark_narrative: "OVERLAY_SPARK_TEXT" },
        section_2_nature: { a_nature: "OVERLAY_NATURE_TEXT" },
        section_3_tempo: { tempo_narrative: "OVERLAY_TEMPO_TEXT" },
        section_4_friend_frames: {
          travel_teamwork: "OVERLAY_TRAVEL_TEXT",
          counseling_mismatch: "OVERLAY_COUNSELING_TEXT",
          distance_resilience: "OVERLAY_DISTANCE_TEXT",
        },
        section_5_action: { together: "OVERLAY_REPAIR_TEXT" },
      }
    : undefined;

  return {
    headline: "Test headline",
    summary_line: "Test summary",
    one_line_friendship: "Test one-liner",
    snapshot_panel: {
      grade: "A",
      gaugeLabel: "Great",
      representativeLine: "line",
      keywords: [],
      relationshipGauges: [],
      personA: { nickname: "지훈", metaphor: "m", axes: [] },
      personB: { nickname: "서연", metaphor: "m", axes: [] },
      personAxesSource: "survey",
      narrative: { topics: [] },
    },
    friend: {},
    meta: {
      grade: "A",
      grade_reason: "reason",
      uncertain_items: [],
      connection_pct: 70,
      banter_pct: 70,
      risk_pct: 30,
      nickname_a: "지훈",
      nickname_b: "서연",
      canonical_story_plan: makeStoryPlan(),
      friend_saju_deep: deep,
      ...(coverage ? { canonical_bundle: { coverage } } : {}),
    },
  };
}

function renderReport(report, locale) {
  // Names are legitimately locale-invariant content (a real person's name
  // isn't translated) — use Latin-script names for en-US fixtures so the
  // Korean-character assertions below test the actual fallback *prose*,
  // not the person's name.
  const myName = locale === "en-US" ? "Jihoon" : "지훈";
  const partnerName = locale === "en-US" ? "Seoyeon" : "서연";
  const vm = buildFriendReportViewModel(report, {
    viewerIsReportA: true,
    myName,
    partnerName,
    locale,
  });
  const html = ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(FriendReportViewModelView, {
        vm,
        viewerIsReportA: true,
      }),
    ),
  );
  return { vm, html };
}

// Matches any Hangul syllable block.
const KOREAN_RE = /[가-힣]/;

describe("Friend ViewModel/Renderer — locale-safe fallback (post-fix)", () => {
  it("A) ko-KR + normal narrative: uses the real overlay text, not a fallback", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: true }), "ko-KR");
    const texts = vm.chapters.map((c) => c.narrativeText);
    assert.ok(texts.includes("OVERLAY_SPARK_TEXT"));
    assert.ok(texts.includes("OVERLAY_TEMPO_TEXT"));
  });

  it("B) en-US + normal narrative: uses the real overlay text, not a fallback", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: true }), "en-US");
    const texts = vm.chapters.map((c) => c.narrativeText);
    assert.ok(texts.includes("OVERLAY_SPARK_TEXT"));
    assert.ok(texts.includes("OVERLAY_TEMPO_TEXT"));
  });

  it("C) ko-KR + missing overlay: every chapter's fallback narrativeText is Korean", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: false }), "ko-KR");
    for (const ch of vm.chapters) {
      assert.ok(ch.narrativeText, `chapter ${ch.chapterKey} has no narrativeText at all`);
      assert.ok(
        KOREAN_RE.test(ch.narrativeText),
        `chapter ${ch.chapterKey} fallback should be Korean for ko-KR, got: ${ch.narrativeText}`,
      );
    }
  });

  it("D) en-US + missing overlay: zero Korean leakage in any chapter's fallback narrativeText (the confirmed bug)", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: false }), "en-US");
    for (const ch of vm.chapters) {
      assert.ok(ch.narrativeText, `chapter ${ch.chapterKey} has no narrativeText at all`);
      assert.ok(
        !KOREAN_RE.test(ch.narrativeText),
        `chapter ${ch.chapterKey} leaked Korean into en-US fallback: ${ch.narrativeText}`,
      );
    }
  });

  it("D) en-US + missing overlay: coverageCards headlines are also locale-safe (adjacent bug pattern)", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: false }), "en-US");
    for (const ch of vm.chapters) {
      for (const card of Object.values(ch.coverageCards ?? {})) {
        if (card && typeof card.headline === "string") {
          assert.ok(
            !KOREAN_RE.test(card.headline),
            `chapter ${ch.chapterKey} coverageCard headline leaked Korean: ${card.headline}`,
          );
        }
      }
    }
  });

  it("D) en-US + missing overlay: full production render has no raw enums and no undefined/null leaks", () => {
    const { html } = renderReport(makeReport({ overlayPresent: false }), "en-US");
    assert.ok(!html.includes(">undefined<"));
    assert.ok(!html.includes(">null<"));
  });

  it("D) en-US + missing overlay: zero Korean leakage anywhere in the full production render (follow-up fix)", () => {
    // Follow-up to the batch above: FriendEditorialSections.tsx had 10
    // hardcoded, unguarded Korean card labels (contactInitiator/planningLead/
    // reconnectionLead in ch03, ideaCreator/practicalExecutor/energyPace in
    // ch04/ch05-teamwork, situationNote/recommendationNote in
    // thirdPersonExclusion, rhythmAdvice/meetingFrequencyNeed in
    // distanceProfile) that were previously reported as an out-of-scope
    // finding — now fixed via the same `pick(locale, en, ko)` helper already
    // used throughout that file. This asserts zero Korean leakage across the
    // ENTIRE rendered page, not just narrativeText/coverageCards headline.
    const { html } = renderReport(makeReport({ overlayPresent: false }), "en-US");
    assert.ok(
      !KOREAN_RE.test(html),
      "full en-US production render must contain zero Korean characters",
    );
  });

  it("C) ko-KR + missing overlay: full production render still succeeds and contains Korean content", () => {
    const { html } = renderReport(makeReport({ overlayPresent: false }), "ko-KR");
    assert.ok(KOREAN_RE.test(html));
    assert.ok(!html.includes(">undefined<"));
    assert.ok(!html.includes(">null<"));
  });
});

describe("Friend ViewModel — no fabricated Person A/B role ownership when coverage evidence is absent", () => {
  it("missing initiative/role coverage entirely: planningLead/ideaCreator/practicalExecutor do NOT fabricate a specific person", () => {
    // No `coverage` passed at all (matches production shape when
    // report.meta.canonical_bundle.coverage is absent).
    const { vm } = renderReport(makeReport({ overlayPresent: true }), "ko-KR");
    const ch03 = vm.chapters.find((c) => c.chapterKey === "ch03_social_dna_tempo");
    const ch04 = vm.chapters.find((c) => c.chapterKey === "ch04_play_travel");

    for (const [label, value] of [
      ["ch03 planningLead", ch03.coverageCards.initiativeRole.planningLead],
      ["ch04 ideaCreator", ch04.coverageCards.travelPlayRole.ideaCreator],
      ["ch04 practicalExecutor", ch04.coverageCards.travelPlayRole.practicalExecutor],
    ]) {
      assert.ok(
        !value.includes("지훈") && !value.includes("서연"),
        `${label} fabricated a specific person's name with no evidence: ${value}`,
      );
      assert.equal(value, "상황에 따라 유연함", `${label} should use the neutral no-evidence fallback`);
    }
  });

  it("missing initiative/role coverage entirely (en-US): same neutral fallback, not a fabricated name", () => {
    const { vm } = renderReport(makeReport({ overlayPresent: true }), "en-US");
    const ch03 = vm.chapters.find((c) => c.chapterKey === "ch03_social_dna_tempo");
    const ch04 = vm.chapters.find((c) => c.chapterKey === "ch04_play_travel");

    for (const [label, value] of [
      ["ch03 planningLead", ch03.coverageCards.initiativeRole.planningLead],
      ["ch04 ideaCreator", ch04.coverageCards.travelPlayRole.ideaCreator],
      ["ch04 practicalExecutor", ch04.coverageCards.travelPlayRole.practicalExecutor],
    ]) {
      assert.ok(
        !value.includes("Jihoon") && !value.includes("Seoyeon"),
        `${label} fabricated a specific person's name with no evidence: ${value}`,
      );
      assert.equal(value, "Flexible by situation", `${label} should use the neutral no-evidence fallback`);
    }
  });

  it("partial coverage object (initiativeRole present but missing planningLead): does not crash, does not fabricate the missing field", () => {
    const { vm } = renderReport(
      makeReport({
        overlayPresent: true,
        coverage: { initiativeRole: { contactInitiator: "A" } },
      }),
      "ko-KR",
    );
    const ch03 = vm.chapters.find((c) => c.chapterKey === "ch03_social_dna_tempo");
    // The real, evidenced field is honored...
    assert.equal(ch03.coverageCards.initiativeRole.contactInitiator, "지훈님");
    // ...but the field with no evidence in the (present-but-partial) coverage
    // object still falls back to the neutral copy, not a fabricated name.
    assert.equal(ch03.coverageCards.initiativeRole.planningLead, "상황에 따라 유연함");
  });

  it("partial coverage object does not throw and produces a valid SSR render", () => {
    assert.doesNotThrow(() => {
      renderReport(
        makeReport({
          overlayPresent: true,
          coverage: { travelPlayRole: { ideaCreator: "B" } },
        }),
        "en-US",
      );
    });
  });
});
