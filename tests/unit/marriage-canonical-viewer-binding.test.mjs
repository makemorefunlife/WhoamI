/**
 * Marriage V2 — canonical A/B vs viewer-relative name-binding regression.
 *
 * Canonical bundle data (economicPartnership.profileA/profileB, crisisRole,
 * expectationsAndNeeds, conflict4Stage, lifePartnershipVerdict) is keyed by
 * CANONICAL report_id_a/report_id_b — it does not move when the viewer is
 * report B. `vm.canonicalNames` is the fixed [personA, personB] pairing that
 * every canonically-keyed card/normalizer must use instead of the
 * viewer-relative `vm.opening.names` ([myName, partnerName], which swaps
 * with viewerIsReportA).
 *
 * This test injects deliberately distinct marker strings into a real,
 * type-valid MarriageCanonicalBundle (built via buildMarriageReport, then
 * mutated) so that any A/B mislabeling is caught by an exact string match,
 * not fragile natural-language snapshotting. It renders with BOTH
 * viewerIsReportA states and asserts canonical-A-bound markers always stay
 * attached to canonicalNameA's name in the DOM, regardless of viewer.
 *
 * Run: npx tsx --test tests/unit/marriage-canonical-viewer-binding.test.mjs
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

/** Canonical nicknames — NEVER swap; these are report_id_a / report_id_b. */
const CANON_A = "CanonAlpha";
const CANON_B = "CanonBeta";

/**
 * Overwrite the CE-generated canonical bundle with deterministic marker
 * strings for every field the substantive cards read, so the assertions
 * below are exact-match rather than natural-language snapshots.
 */
function injectMarkers(report) {
  const bundle = report.canonical_projections.marriage_canonical_bundle;

  bundle.economicPartnership.profileA.primaryRoleLabel = "A_ONLY_ECON_ROLE";
  bundle.economicPartnership.profileB.primaryRoleLabel = "B_ONLY_ECON_ROLE";
  bundle.economicPartnership.decisionFlow.cashFlowTracker = CANON_A;
  bundle.economicPartnership.decisionFlow.executor = CANON_B;

  bundle.crisisRole.practicalLead = "a";
  bundle.crisisRole.emotionalAnchor = "b";
  bundle.crisisRole.narrative = "A_ONLY_CRISIS_NARRATIVE";

  bundle.expectationsAndNeeds.expectationsAtoB = [
    { whatNotToExpect: "A_ONLY_EXPECTATION_TEXT" },
  ];
  bundle.expectationsAndNeeds.expectationsBtoA = [
    { whatNotToExpect: "B_ONLY_EXPECTATION_TEXT" },
  ];

  bundle.coupleBurnout.primaryOverloadRiskPartner = "a";

  // operationSyncPct has no numeric authority and is no longer read for
  // presentation — the Household-Operating Fit tile now renders a human
  // status label derived from plannerExecutor.alignmentType instead.
  bundle.plannerExecutor.alignmentType = "dual_planner_tension";
  bundle.lifePartnershipVerdict.emotionalSyncPct = 77;
  bundle.lifePartnershipVerdict.longTermSynergyPct = 68;

  return report;
}

function buildVm({ locale = "en-US", viewerIsReportA = true } = {}) {
  let report = buildMarriageReport({
    nicknameA: CANON_A,
    nicknameB: CANON_B,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: makePsych({ self_control: 75, practicality: 65, structure: 80 }),
    psychMasterB: makePsych({ practicality: 70, self_control: 45, recognition: 40 }),
    locale,
  });
  report = injectMarkers(report);

  // myName/partnerName swap with viewerIsReportA to match production
  // (MarriageReportView.tsx derives them via pickViewerFirstPair) — this is
  // exactly the viewer-relative input that canonically-keyed cards must NOT
  // be affected by.
  const myName = viewerIsReportA ? CANON_A : CANON_B;
  const partnerName = viewerIsReportA ? CANON_B : CANON_A;
  const vm = buildMarriageReportViewModel(report, {
    viewerIsReportA,
    myName,
    partnerName,
    locale,
  });
  return { report, vm };
}

function renderVm(vm, locale, viewerIsReportA) {
  const raw = ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(MarriageReportViewModelView, { vm, viewerIsReportA }),
    ),
  );
  // React SSR inserts <!-- --> between adjacent text/expression nodes at
  // JSX boundaries (e.g. `Cash flow:</span> {value}`) — strip them so
  // substring assertions can match across those boundaries. It also
  // HTML-escapes text content (' -> &#x27;, & -> &amp;, etc.) — decode the
  // common ones so assertions can use plain literal strings.
  return raw
    .replace(/<!--\s*-->/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

for (const viewerIsReportA of [true, false]) {
  describe(`Marriage canonical A/B binding — viewerIsReportA=${viewerIsReportA}`, () => {
    const { vm } = buildVm({ locale: "en-US", viewerIsReportA });
    const html = renderVm(vm, "en-US", viewerIsReportA);

    it("vm.canonicalNames is always [CanonAlpha, CanonBeta] regardless of viewer", () => {
      assert.deepEqual(vm.canonicalNames, [CANON_A, CANON_B]);
    });

    it("Ch3 Economic role: A's marker role stays attached to CanonAlpha's name", () => {
      const idxName = html.indexOf(`${CANON_A}'s Economic Role`);
      const idxRole = html.indexOf("A_ONLY_ECON_ROLE");
      assert.ok(idxName >= 0, "CanonAlpha's Economic Role header must render");
      assert.ok(idxRole >= 0, "A_ONLY_ECON_ROLE marker must render");
      // The A-role marker must appear before the B-role marker section header,
      // i.e. within CanonAlpha's own inset block, not CanonBeta's.
      const idxBName = html.indexOf(`${CANON_B}'s Economic Role`);
      assert.ok(idxName < idxRole && idxRole < idxBName, "A marker must sit inside CanonAlpha's block");
    });

    it("Ch3 Economic role: B's marker role stays attached to CanonBeta's name", () => {
      const idxBName = html.indexOf(`${CANON_B}'s Economic Role`);
      const idxBRole = html.indexOf("B_ONLY_ECON_ROLE");
      assert.ok(idxBName >= 0 && idxBRole >= 0);
      assert.ok(idxBRole > idxBName, "B marker must sit inside CanonBeta's block");
    });

    it("Ch3 decision flow: cash-flow tracker is CanonAlpha, executor is CanonBeta", () => {
      assert.ok(html.includes(`Cash flow:</span> ${CANON_A}`));
      assert.ok(html.includes(`Executes:</span> ${CANON_B}`));
    });

    it("Ch5 crisis role: practical lead is CanonAlpha, emotional anchor is CanonBeta", () => {
      assert.ok(
        html.includes(`Crisis role split: ${CANON_A} (practical lead) × ${CANON_B} (emotional anchor)`),
      );
      assert.ok(html.includes("A_ONLY_CRISIS_NARRATIVE"));
    });

    it("Ch7 expectations: AtoB marker sits under CanonAlpha ➔ CanonBeta, BtoA under the reverse", () => {
      // "CanonAlpha ➔ CanonBeta" alone also matches the unrelated Ch5 SOS
      // script header — anchor on the Ch7-specific full header text.
      const idxAtoB = html.indexOf(`${CANON_A} ➔ ${CANON_B}: what not to expect`);
      const idxAtoBMarker = html.indexOf("A_ONLY_EXPECTATION_TEXT");
      const idxBtoA = html.indexOf(`${CANON_B} ➔ ${CANON_A}: what not to expect`);
      const idxBtoAMarker = html.indexOf("B_ONLY_EXPECTATION_TEXT");
      assert.ok(idxAtoB >= 0 && idxAtoBMarker > idxAtoB && idxAtoBMarker < idxBtoA);
      assert.ok(idxBtoA >= 0 && idxBtoAMarker > idxBtoA);
    });

    it("Ch7 burnout risk: primary overload partner is CanonAlpha", () => {
      assert.ok(html.includes(`Burnout & household-PM depletion risk: ${CANON_A}`));
    });

    it("Ch8 verdict: real distinct fit percentages render (not the 85/80/82 fallback)", () => {
      const fitIdx = html.indexOf("Household-Operating Fit");
      const fitBlock = html.slice(fitIdx, fitIdx + 600);
      assert.ok(fitBlock.includes(">77<"), "emotionalSyncPct=77 must map to emotionalPartnerFit");
      assert.ok(fitBlock.includes(">68<"), "longTermSynergyPct=68 must map to longTermGrowthFit");
      assert.ok(
        !fitBlock.includes(">85<") && !fitBlock.includes(">80<") && !fitBlock.includes(">82<"),
        "hardcoded fallback numbers must not appear in the fit block",
      );
    });

    it("Ch8 verdict: Household-Operating Fit shows a real canonical status label, not a fake percentage", () => {
      const fitIdx = html.indexOf("Household-Operating Fit");
      const fitBlock = html.slice(fitIdx, fitIdx + 300);
      assert.ok(
        fitBlock.includes("Co-planners who need clear ownership"),
        "must render the human label for plannerExecutor.alignmentType='dual_planner_tension'",
      );
      assert.ok(!/>85<|>85%|85%<\/span>/.test(fitBlock), "the old hardcoded 85 constant must not appear");
      assert.ok(!fitBlock.includes("dual_planner_tension"), "raw alignmentType enum must never leak");
    });
  });
}

describe("Marriage canonical A/B binding — cross-viewer consistency", () => {
  const a = buildVm({ locale: "en-US", viewerIsReportA: true });
  const b = buildVm({ locale: "en-US", viewerIsReportA: false });
  const htmlA = renderVm(a.vm, "en-US", true);
  const htmlB = renderVm(b.vm, "en-US", false);

  it("canonical markers appear identically regardless of who is viewing", () => {
    for (const marker of [
      "A_ONLY_ECON_ROLE",
      "B_ONLY_ECON_ROLE",
      "A_ONLY_CRISIS_NARRATIVE",
      "A_ONLY_EXPECTATION_TEXT",
      "B_ONLY_EXPECTATION_TEXT",
    ]) {
      assert.ok(htmlA.includes(marker), `viewerA render missing ${marker}`);
      assert.ok(htmlB.includes(marker), `viewerB render missing ${marker}`);
    }
    assert.ok(htmlA.includes(`Cash flow:</span> ${CANON_A}`));
    assert.ok(htmlB.includes(`Cash flow:</span> ${CANON_A}`), "viewer-B render must NOT relabel cash-flow tracker to CanonBeta");
  });
});

console.log("marriage-canonical-viewer-binding: describe blocks registered");
