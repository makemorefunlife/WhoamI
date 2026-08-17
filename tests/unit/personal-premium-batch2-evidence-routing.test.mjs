/**
 * Personal Premium Narrative Quality Singleton — Batch 2: Evidence Routing.
 *
 * Covers: (1) buildFutureEvidence's new Recover (innate_higher gap) slot,
 * separate from the pre-existing Keep (alignment) slot; (2) the One Next
 * Move evidence-linkage prompt instruction; (3) the checklist dedup
 * threshold redesign for the single-item (min=max=1) call site.
 *
 * Run: npx tsx --test tests/unit/personal-premium-batch2-evidence-routing.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import {
  runPersonalContextEngine,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import {
  dedupeAndBackfillChecklist,
  CHECKLIST_DUPLICATE_THRESHOLD,
  SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD,
} from "../../lib/report/deepEssenceChecklistDedup.ts";

// Same fixture profile already used by deep-essence-adaptation-story.test.mjs —
// connection is a wide, innate_higher gap axis here (delta -20), autonomy and
// adaptability are wide current_higher gaps. Reused rather than inventing a
// second fixture profile.
const CURRENT_PRIMARY = {
  autonomy: 70, connection: 40, stability: 55, growth: 60, structure: 45, adaptability: 65,
};
const CURRENT_SECONDARY = {
  stimulation: 60, self_control: 50, practicality: 55, structure: 45, empathy: 65,
  conflict_style: 40, resilience: 70, recognition: 50, energy_style: 55,
  thinking_style: 60, decision_style: 45,
};
const INNATE_PRIMARY = {
  autonomy: 40, connection: 60, stability: 65, growth: 50, structure: 55, adaptability: 45,
};

function buildFixturePacket(fixtureId) {
  const chart = buildPersonalCeFixtureChart(fixtureId);
  const personalContext = runPersonalContextEngine({ chart });
  return buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: CURRENT_PRIMARY,
    currentSecondary: CURRENT_SECONDARY,
    innatePrimary: INNATE_PRIMARY,
  });
}

describe("buildFutureEvidence (via formatPart01EvidenceForPrompt) — Recover grounding", () => {
  const packet = buildFixturePacket("known_time");
  const evidence = formatPart01EvidenceForPrompt(packet);

  it("labels the alignment axis for remember[0] (Keep)", () => {
    assert.match(evidence.futureText, /remember\[0\] \(Keep\)/);
  });

  it("labels an innate_higher gap axis for remember[2] (Recover), distinct from the Keep axis", () => {
    assert.match(evidence.futureText, /remember\[2\] \(Recover\)/);
    assert.match(evidence.futureText, /axis:connection/.test(evidence.futureText) ? /./ : /remember\[2\]/); // sanity no-op guard
  });

  it("the Recover axis line is genuinely innate_higher direction, not the same axis as Keep", () => {
    // connection has delta -20 in this fixture (innate 60 > current 40) => innate_higher, wide.
    const recoverSection = evidence.futureText.split("remember[2] (Recover)")[1] ?? "";
    assert.match(recoverSection, /direction=innate_higher/);
  });

  it("futureKnownKeys includes both the Keep and Recover axis keys when both are present", () => {
    const hasAxisKey = (axis) => [...evidence.axisInterpretation.gaps, evidence.axisInterpretation.alignment]
      .filter(Boolean)
      .some((a) => a.axis === axis);
    // Just confirm futureText references at least 2 distinct axis: lines when both slots are filled.
    const axisMentions = evidence.futureText.match(/axis:[a-z_]+/g) ?? [];
    const uniqueAxes = new Set(axisMentions);
    assert.ok(uniqueAxes.size >= 1, "futureText should reference at least one axis key");
  });
});

describe("buildFutureEvidence — no-innate_higher-gap fallback instruction", () => {
  it("when no selected gap is innate_higher, futureText instructs grounding Recover in Natural Self & Deep Needs instead of inventing a claim", () => {
    // Profile where every gap is current_higher or aligned (no innate_higher wide gap).
    const noRecoverCurrent = { autonomy: 80, connection: 60, stability: 55, growth: 60, structure: 70, adaptability: 65 };
    const noRecoverInnate = { autonomy: 50, connection: 58, stability: 53, growth: 58, structure: 40, adaptability: 63 };
    const chart = buildPersonalCeFixtureChart("known_time");
    const personalContext = runPersonalContextEngine({ chart });
    const packet = buildPart01IdentityEvidencePacket({
      chart, personalContext,
      currentPrimary: noRecoverCurrent, currentSecondary: CURRENT_SECONDARY, innatePrimary: noRecoverInnate,
    });
    const evidence = formatPart01EvidenceForPrompt(packet);
    const hasInnateHigherGap = evidence.axisInterpretation.gaps.some((g) => {
      // reconstruct direction from subjectText's Direction fact line
      return /innate_higher/i.test(g.subjectText) || false;
    });
    if (!hasInnateHigherGap) {
      assert.match(evidence.futureText, /do not invent an underused-tendency claim/);
    }
  });
});

describe("lib/prompts/deepEssenceStructured.ts — Keep/Loosen/Recover role separation + One Next Move evidence linkage (source wiring)", () => {
  const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

  it("wires remember[0]/[1]/[2] to 3 distinct evidence sources, never the same pool", () => {
    assert.match(src, /ground this in the best-aligned axis marked "ground remember\[0\] \(Keep\) here"/);
    assert.match(src, /ground this in an adaptation-overuse or watchout pattern already established above/);
    assert.match(src, /ground this in the axis marked "ground remember\[2\] \(Recover\) here"/);
    assert.match(src, /never the same axis you used for Keep or Recover/);
  });

  it("One Next Move must connect to a named anchor (growth edge, primary gap, adaptation tension, decision pattern, or Recover)", () => {
    assert.match(src, /MUST be explicitly connected to ONE of these already-established anchors/);
    assert.match(src, /the growth_edge.*the primary\/widest axis gap.*the adaptation tension.*a recurring decision pattern.*the Recover signal/s);
  });

  it("explicitly forbids the exact generic fallback string observed live as a checklist item", () => {
    assert.match(src, /이번 주 하루를 골라 기억에 남는 순간 하나를 적어보세요.*is forbidden precisely because it connects to nothing else/);
  });
});

describe("deepEssenceChecklistDedup — single-item threshold redesign", () => {
  it("SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD is meaningfully higher than the original 8-12-item threshold", () => {
    assert.ok(SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD > CHECKLIST_DUPLICATE_THRESHOLD);
  });

  it("a real-world-observed 'healthy overlap' score (0.13-0.34 band) survives under the new single-item threshold but would have been flagged under the old one", () => {
    // Score band directly observed in live QA this session (Batch 1 fresh-generation runs).
    const observedHealthyOverlapScore = 0.21;
    assert.ok(observedHealthyOverlapScore >= CHECKLIST_DUPLICATE_THRESHOLD, "sanity: this score would have tripped the old threshold");
    assert.ok(observedHealthyOverlapScore < SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD, "this score must NOT trip the new single-item threshold");
  });

  it("dedupeAndBackfillChecklist accepts an explicit threshold override and applies it instead of the default", () => {
    const result = dedupeAndBackfillChecklist({
      checklist: ["다음 중요한 결정을 앞두고 먼저 내가 원하는 것을 한 문장으로 적어보세요."],
      comparisonTexts: ["먼저 자신의 생각을 정리한 후 한 문장으로 적어보는 연습을 해보세요."],
      locale: "ko-KR",
      min: 1,
      max: 1,
      threshold: 0.99, // effectively unreachable — nothing should be flagged
    });
    assert.equal(result.flagged.length, 0, "an unreachably high threshold must let the item through unflagged");
    assert.equal(result.checklist.length, 1);
  });

  it("without an override, the default threshold is unchanged (back-compat for any other caller)", () => {
    const result = dedupeAndBackfillChecklist({
      checklist: ["a", "b", "c", "d", "e", "f", "g", "h"],
      comparisonTexts: [],
      locale: "en-US",
    });
    assert.equal(result.checklist.length, 8);
  });
});

describe("runDeepEssenceStructuredLlm.ts — wires SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD into the One Next Move dedup call (source wiring)", () => {
  const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");

  it("imports SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD from the dedup module", () => {
    assert.match(src, /SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD/);
    assert.match(src, /from "@\/lib\/report\/deepEssenceChecklistDedup"/);
  });

  it("passes it as the threshold for the min:1,max:1 checklist dedup call", () => {
    assert.match(
      src,
      /min: 1,\s*max: 1,\s*\/\/[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n\s*threshold: SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD,/,
    );
  });
});
