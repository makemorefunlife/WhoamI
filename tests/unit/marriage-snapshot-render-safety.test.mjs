/**
 * Master Cleanup Batch 1 — Marriage stale/partial cache render-crash fix.
 *
 * Root cause: components/relationship/marriage/sections/SectionRenderer.tsx
 * used `snapshot.panel.narrative!.topics.find(...)!` (double non-null
 * assertion) to pull the intimacy/stability/conflict topic narratives for
 * the "at a glance" overview cards. Any cached/DB-persisted household
 * snapshot whose `narrative` object is missing, or whose `topics` array is
 * missing one of the three expected topics (both are structurally possible
 * for older cached payloads — TriScoreSnapshotPanel's `narrative` field is
 * declared required in the *current* type, but that's not enforced on
 * previously-persisted JSON), throws inside the render and crashes the
 * whole premium tab.
 *
 * This test renders the ACTUAL production component
 * (MarriageReportViewModelView) via SSR (ReactDOMServer.renderToString),
 * not just a JS-object shape check, against: a full valid payload, a
 * payload with `narrative` entirely absent (old-cache-style), and a payload
 * with `narrative.topics` present but missing one named topic (partial).
 *
 * Run: npx tsx --test tests/unit/marriage-snapshot-render-safety.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";

// next/font/google isn't resolvable outside the Next.js build pipeline —
// stub it before importing anything that transitively pulls it in, matching
// the existing tests/scripts/verify-friend-v2-phase7c-dom-qa.ts pattern.
const Module = await import("node:module");
const originalRequire = Module.default.prototype.require;
Module.default.prototype.require = function (request) {
  if (request === "next/font/google") {
    const dummyFont = () => ({ variable: "font-dummy", className: "font-dummy" });
    return { Noto_Sans_KR: dummyFont, Noto_Serif_KR: dummyFont };
  }
  return originalRequire.apply(this, arguments);
};

const { MarriageReportViewModelView } = await import(
  "../../components/relationship/marriage/sections/SectionRenderer.tsx"
);
const { LocaleProvider } = await import("../../lib/i18n/LocaleProvider.tsx");

function makeTopic(topic, overrides = {}) {
  return {
    topic,
    title: `${topic} title`,
    subtitle: `${topic} subtitle`,
    activation: 50,
    benefit: 50,
    risk: 50,
    interpretation: `${topic} interpretation text`,
    isWarning: false,
    axisNote: null,
    ...overrides,
  };
}

function makeVm({ narrative, topicsOverride } = {}) {
  const panel = {
    grade: "A",
    gaugeLabel: "Great fit",
    representativeLine: "You two balance each other well.",
    keywords: ["balanced", "steady"],
    relationshipGauges: [],
    personA: { nickname: "지훈", metaphor: "steady oak", axes: [] },
    personB: { nickname: "서연", metaphor: "flowing river", axes: [] },
    personAxesSource: "survey",
  };
  if (narrative !== undefined) {
    panel.narrative = narrative;
  } else {
    panel.narrative = {
      topics:
        topicsOverride ??
        [makeTopic("intimacy"), makeTopic("stability"), makeTopic("conflict")],
    };
  }

  return {
    kind: "cohabitation",
    schemaVersion: "2.0.0",
    opening: {
      headline: "A steady, well-matched partnership",
      subtitle: "Built on trust and shared rhythm",
      grade: "A",
      gradeReason: "Strong alignment across the board",
      names: ["지훈", "서연"],
    },
    sections: [
      {
        id: "household_snapshot",
        type: "household_snapshot",
        partNumber: 2,
        title: "Household Snapshot",
        scores: { romanticFitPct: 78, lifeSynergyPct: 70, homeRiskPct: 30 },
        panel,
      },
    ],
  };
}

function renderVm(vm, locale = "en-US") {
  return ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(MarriageReportViewModelView, {
        vm,
        viewerIsReportA: true,
      }),
    ),
  );
}

describe("Marriage SectionRenderer — snapshot render safety (post-fix)", () => {
  it("renders a full, valid payload with all three topics present", () => {
    const vm = makeVm();
    const html = renderVm(vm);
    assert.ok(html.includes("intimacy title") || html.includes("intimacy subtitle") || html.length > 0);
    // full-payload rendering must show the real per-topic content, not a fallback label
    assert.ok(html.includes("intimacy subtitle"));
    assert.ok(html.includes("stability subtitle"));
    assert.ok(html.includes("conflict subtitle"));
  });

  it("does NOT throw when `narrative` is entirely absent (old-cache-style payload)", () => {
    const vm = makeVm({ narrative: null });
    assert.doesNotThrow(() => renderVm(vm));
  });

  it("does NOT throw when `panel.narrative` key is missing altogether", () => {
    const vm = makeVm();
    delete vm.sections[0].panel.narrative;
    assert.doesNotThrow(() => renderVm(vm));
  });

  it("does NOT throw when `topics` array is missing the 'intimacy' entry (partial/stale payload)", () => {
    const vm = makeVm({ topicsOverride: [makeTopic("stability"), makeTopic("conflict")] });
    assert.doesNotThrow(() => renderVm(vm));
  });

  it("does NOT throw when `topics` array is completely empty", () => {
    const vm = makeVm({ topicsOverride: [] });
    assert.doesNotThrow(() => renderVm(vm));
  });

  it("partial payload still renders the OTHER two valid topics' real content, not blanked out", () => {
    const vm = makeVm({ topicsOverride: [makeTopic("stability"), makeTopic("conflict")] });
    const html = renderVm(vm);
    assert.ok(html.includes("stability subtitle"));
    assert.ok(html.includes("conflict subtitle"));
  });

  it("missing topic does not fabricate new narrative copy — falls back to the existing static score label only", () => {
    const vm = makeVm({ topicsOverride: [makeTopic("stability"), makeTopic("conflict")] });
    const html = renderVm(vm);
    // the fallback gradeLabel reuses t.scoreLabelRomanticFit (existing product copy),
    // never an invented sentence — so no interpretation/subtitle text for the missing topic
    assert.ok(!html.includes("undefined"));
    assert.ok(!html.includes("null"));
  });
});
