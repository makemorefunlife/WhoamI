/**
 * Final Cleanup pass, item 2 — the Ch04 comparison-row "caution" caveat used
 * to be one fixed sentence reused verbatim across every axis it fired on,
 * and directly contradicted a preceding "similar" sentence without saying
 * whose data or what it was comparing. Now it names the specific person(s)
 * whose current survey diverges from their own chart baseline, so it varies
 * per row and reads as a distinct chart-vs-current comparison rather than a
 * walkback of the A-vs-B similarity statement.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { localizeComparisonRowProse } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";

function baseRow(overrides = {}) {
  return {
    rowKey: "conflict",
    leanA: "direct",
    leanB: "direct",
    baseA: "direct",
    baseB: "direct",
    flippedA: false,
    flippedB: false,
    align: "confirms",
    confidence: "high",
    source: "saju_plus_survey",
    personASource: "survey",
    personBSource: "survey",
    sajuInputsA: {},
    sajuInputsB: {},
    ...overrides,
  };
}

test("caution + flippedA produces a person-specific caveat naming the actual chart-vs-current divergence, not the old fixed sentence", () => {
  const row = baseRow({ align: "caution", flippedA: true, baseA: "avoidant" });
  const result = localizeComparisonRowProse({ row, locale: "ko-KR", nameA: "지민", nameB: "정우" });
  assert.ok(!result.manifestation.includes("설문 응답이 기질과는 다르게 나타나, 상황에 따라 다르게 보일 수 있어요"), "old fixed sentence must be gone");
  assert.ok(result.manifestation.includes("지민"));
  assert.ok(result.manifestation.includes("별개의 이야기"), "must clarify this is a separate comparison from the A-vs-B statement");
});

test("caution caveat is row-specific — two different rows with different flipped people produce different caveat text", () => {
  const rowConflict = baseRow({ rowKey: "conflict", align: "caution", flippedA: true, baseA: "avoidant" });
  const rowStress = baseRow({ rowKey: "stress", align: "caution", flippedB: true, baseB: "explosive", leanA: "steady", leanB: "steady" });
  const r1 = localizeComparisonRowProse({ row: rowConflict, locale: "ko-KR", nameA: "지민", nameB: "정우" });
  const r2 = localizeComparisonRowProse({ row: rowStress, locale: "ko-KR", nameA: "지민", nameB: "정우" });
  assert.notEqual(r1.manifestation, r2.manifestation);
});

test("caution with neither flippedA nor flippedB adds no caveat text at all (nothing to report)", () => {
  const row = baseRow({ align: "caution", flippedA: false, flippedB: false });
  const result = localizeComparisonRowProse({ row, locale: "ko-KR", nameA: "지민", nameB: "정우" });
  assert.ok(!result.manifestation.includes("참고로"));
});

test("confirms alignment still uses its own distinct, unrelated sentence", () => {
  const row = baseRow({ align: "confirms" });
  const result = localizeComparisonRowProse({ row, locale: "ko-KR", nameA: "지민", nameB: "정우" });
  assert.ok(result.manifestation.includes("각자의 원래 기질과도 잘 맞아요"));
});

test("English locale gets an equivalent person-specific caveat, not a generic fixed sentence", () => {
  const row = baseRow({ align: "caution", flippedA: true, baseA: "avoidant" });
  const result = localizeComparisonRowProse({ row, locale: "en-US", nameA: "Jimin", nameB: "Jungwoo" });
  assert.ok(result.manifestation.includes("Jimin"));
  assert.ok(result.manifestation.includes("separate from how they compare"));
});
