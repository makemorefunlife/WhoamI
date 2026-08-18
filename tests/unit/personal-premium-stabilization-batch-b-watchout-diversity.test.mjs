/**
 * Personal Premium Final Narrative Stabilization — Batch B: Watchout
 * Diversity.
 *
 * v1 (prompt-only: FAILED-pattern description + priority rule + fuzzy
 * observability) was fresh-QA'd twice against 5 live profiles and never
 * cleared threshold either round (3-of-3 collapse 1/5, 2-of-3 overlap 2/5,
 * both rounds) — a purely descriptive "ask what domain this lives in"
 * check does not reliably stop the model from collapsing all three
 * watchouts onto one mechanism.
 *
 * v2 (this file) replaces the after-the-fact prose check with a structured,
 * sequential commitment: each watchout now carries an internal-only
 * cost_domain field (never rendered — same provenance-only pattern as
 * evidence_refs) drawn from a fixed 7-value enum, and the model must pick
 * watchouts[1]'s domain as explicitly DIFFERENT from watchouts[0]'s before
 * writing either body, and watchouts[2]'s as different from both when the
 * evidence supports a third domain (2-domain fallback otherwise). This
 * can't fully guarantee distinctness without a second LLM call to correct a
 * detected collision (out of scope — see STOP CONDITIONS), but it turns
 * collision DETECTION from a fuzzy prose-similarity guess into an exact,
 * deterministic string-equality check, which is what
 * "watchouts_cost_domain_collision" below tests.
 *
 * Run: npx tsx --test tests/unit/personal-premium-stabilization-batch-b-watchout-diversity.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import {
  coerceDeepEssencePartA,
} from "../../lib/report/coerceDeepEssenceStructured.ts";
import {
  similarityScore,
  normalizeForComparison,
  WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD,
} from "../../lib/report/deepEssenceChecklistDedup.ts";

const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

describe("Prompt contract — watchout diversity, deterministic sequential cost_domain commitment", () => {
  it("watchouts schema requires a cost_domain field per item, picked before the body", () => {
    assert.match(src, /"cost_domain": "exactly one value from WATCHOUT_COST_DOMAINS below — pick it BEFORE writing body/);
  });

  it("defines the fixed 7-value domain enum", () => {
    assert.match(src, /WATCHOUT_COST_DOMAINS = \[decision_load, emotional_labor, adaptation_load, boundary_maintenance, uncertainty_handling, relationship_calibration, self_suppression\]/);
  });

  it("forces watchouts[1] and watchouts[2] to sequentially differ from the domains already committed", () => {
    assert.match(src, /watchouts\[1\]\.cost_domain — it MUST be a different value from watchouts\[0\]\.cost_domain/);
    assert.match(src, /watchouts\[2\]\.cost_domain — it MUST be a different value from BOTH watchouts\[0\] and watchouts\[1\]/);
  });

  it("requires body content to actually match the committed domain, not just carry a distinct label", () => {
    assert.match(src, /do not pick a domain label and then write body content that actually belongs to a different domain/);
  });

  it("offers the 2-domain fallback (different cost angle, not an invented third domain) when evidence only supports 2 mechanisms", () => {
    assert.match(src, /2-DOMAIN FALLBACK \(evidence outranks forcing a third domain\)/);
    assert.match(src, /do NOT invent an unsupported third domain from nothing/);
  });

  it("keeps the behavior-vs-result self-check as a secondary net on top of the structured field", () => {
    assert.match(src, /SELF-CHECK \(this is the failure mode that has leaked live even under the rule above/);
    assert.match(src, /names a BEHAVIOR.*names that same behavior's RESULT/s);
  });
});

describe("Prompt contract — no invented biography in strengths/watchouts", () => {
  it("forbids the specific invented scenarios observed live", () => {
    for (const phrase of ["친구가 힘들어할 때", "새로운 직장에 들어갔을 때", "팀 프로젝트에서", "상사와 이야기할 때", "가족 문제에서"]) {
      assert.match(src, new RegExp(phrase));
    }
  });

  it("names the allowed generalized-condition alternative", () => {
    assert.match(src, /중요한 결정을 앞두고/);
    assert.match(src, /여러 사람의 기대를 동시에 고려할 때/);
  });
});

describe("deepEssenceChecklistDedup.ts — similarityScore reused (not reinvented) for watchout observability", () => {
  it("similarityScore is now exported for reuse", () => {
    assert.equal(typeof similarityScore, "function");
  });

  it("WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD is a distinct constant from the two checklist thresholds", () => {
    assert.equal(typeof WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD, "number");
    assert.ok(WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD > 0 && WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD < 1);
  });

  it("two near-identical KO sentences score high; two genuinely different KO sentences score low", () => {
    const a = normalizeForComparison("중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식이에요.", "ko-KR");
    const b = normalizeForComparison("중요한 결정을 내릴 때 다른 사람의 확신을 먼저 확인하는 방식입니다.", "ko-KR");
    const c = normalizeForComparison("자신의 감정을 오랫동안 숨기고 표현하지 않는 경향이 있어요.", "ko-KR");
    const highScore = similarityScore(a, b, "ko-KR");
    const lowScore = similarityScore(a, c, "ko-KR");
    assert.ok(highScore > lowScore, `expected near-duplicate score (${highScore}) > distinct score (${lowScore})`);
    assert.ok(highScore >= WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD, `near-duplicate score ${highScore} should cross the overlap threshold`);
  });
});

describe("coerceDeepEssencePartA — watchout diversity observability (fuzzy prose signal + exact cost_domain signal)", () => {
  function partAInput(watchouts) {
    return {
      summary: { core_mode: "x", energy_balance: "50 / 50", growth_edge: "y" },
      radar_potential: { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 },
      strengths: [
        { title: "s1", body: "body1" },
        { title: "s2", body: "body2" },
        { title: "s3", body: "body3" },
      ],
      watchouts: watchouts.map((w, i) =>
        typeof w === "string" ? { title: `w${i}`, body: w } : { title: `w${i}`, ...w },
      ),
      energy: {
        headline: "h", balance_pct: 50,
        bars: [{ label: "a", value: 50, tone: "highlight" }, { label: "b", value: 50, tone: "accent" }, { label: "c", value: 50, tone: "ink" }],
        summary: "s", fuels: ["f1", "f2", "f3"], drains: ["d1", "d2", "d3"], optimal: ["o1", "o2"],
      },
    };
  }
  const floor = { autonomy: 0, connection: 0, stability: 0, growth: 0, structure: 0, adaptability: 0 };

  it("logs a watchouts_semantic_overlap note when 2 of 3 watchout bodies are near-duplicates", () => {
    const input = partAInput([
      "중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식이 익숙해요.",
      "중요한 결정을 내릴 때 다른 사람의 확신을 먼저 확인하려는 경향이 있어요.",
      "자신의 감정을 오랫동안 숨기고 표현하지 않는 경향이 있어요.",
    ]);
    const { notes } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.ok(
      notes.some((n) => n.startsWith("watchouts_semantic_overlap_")),
      `expected a watchouts_semantic_overlap note, got: ${JSON.stringify(notes)}`,
    );
  });

  it("logs NO overlap note when all 3 watchout bodies are genuinely distinct", () => {
    const input = partAInput([
      "중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식이 익숙해요.",
      "자신의 감정을 오랫동안 숨기고 표현하지 않는 경향이 있어요.",
      "새로운 환경에 적응하는 데 시간이 오래 걸리는 편이에요.",
    ]);
    const { notes } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.ok(!notes.some((n) => n.startsWith("watchouts_semantic_overlap_")));
  });

  it("logs an EXACT watchouts_cost_domain_collision note when two watchouts share the identical cost_domain value", () => {
    const input = partAInput([
      { body: "결정을 내리기 전 계속 확인하는 방식이에요.", cost_domain: "decision_load" },
      { body: "완전히 다른 내용의 두 번째 항목이에요.", cost_domain: "decision_load" },
      { body: "세 번째 역시 전혀 다른 내용이에요.", cost_domain: "boundary_maintenance" },
    ]);
    const { notes } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.ok(
      notes.some((n) => n === "watchouts_cost_domain_collision_0_1_decision_load"),
      `expected an exact cost_domain collision note, got: ${JSON.stringify(notes)}`,
    );
  });

  it("logs NO cost_domain collision note when all 3 domains are distinct", () => {
    const input = partAInput([
      { body: "첫 번째 항목이에요.", cost_domain: "decision_load" },
      { body: "두 번째 항목이에요.", cost_domain: "emotional_labor" },
      { body: "세 번째 항목이에요.", cost_domain: "boundary_maintenance" },
    ]);
    const { notes } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.ok(!notes.some((n) => n.startsWith("watchouts_cost_domain_collision_")));
  });

  it("does not fail or fabricate a collision note when cost_domain is missing (older cache / LLM omitted the field)", () => {
    const input = partAInput([
      "첫 번째 항목이에요.",
      "두 번째 항목이에요.",
      "세 번째 항목이에요.",
    ]);
    const { value, notes } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.equal(value.watchouts.length, 3);
    assert.ok(!notes.some((n) => n.startsWith("watchouts_cost_domain_collision_")));
  });

  it("does not alter the watchouts themselves — observability only, no correction/regeneration", () => {
    const bodies = [
      "중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식이 익숙해요.",
      "중요한 결정을 내릴 때 다른 사람의 확신을 먼저 확인하려는 경향이 있어요.",
      "자신의 감정을 오랫동안 숨기고 표현하지 않는 경향이 있어요.",
    ];
    const input = partAInput(bodies);
    const { value } = coerceDeepEssencePartA(input, floor, "ko-KR");
    assert.deepEqual(
      value.watchouts.map((w) => w.body),
      bodies,
      "watchout bodies must pass through unchanged even when overlap is detected",
    );
  });

  it("defaults locale to ko-KR when omitted (back-compat for the pre-existing 2-arg call shape)", () => {
    const input = partAInput(["a", "b", "c"]);
    const { value } = coerceDeepEssencePartA(input, floor);
    assert.equal(value.watchouts.length, 3);
  });
});
