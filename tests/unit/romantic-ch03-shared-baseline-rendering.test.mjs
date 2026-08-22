/**
 * Final Cleanup pass, item 1 — Ch03's conflict-transition "1. 평소의 모습"
 * card used to render the exact same sharedBaseline text under BOTH person
 * cards whenever the engine determined the pair genuinely converges.
 * Full-pipeline render tests via ReactDOMServer, same pattern as
 * tests/scripts/verify-sera-donggle-e2e.ts / romantic-ch07-empty-state-rendering.test.mjs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import ReactDOMServer from "react-dom/server";

import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";
import { CanonicalReportView } from "../../components/relationship/romantic/v4/CanonicalReportView.tsx";

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { survey_source: "v2_10q", secondary_axes: { ...base, ...overrides } };
}

function renderReportHtml(nameA, nameB, birthA, birthB, psychA, psychB) {
  const pairSajuInput = { mode: "real", birthA, birthB, nameA, nameB };
  const surveyInput = { psychA, psychB };
  const canonicalReport = buildCanonicalRomanticV4Report("ko-KR", 2026, { pairSajuInput, surveyInput });
  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", { pairSajuInput, surveyInput });
  return ReactDOMServer.renderToString(
    React.createElement(CanonicalReportView, { report: canonicalReport, payload, personA: nameA, personB: nameB }),
  );
}

const BIRTH_JIMIN = { birthDate: "1993-04-12", birthTime: "07:30" };
const BIRTH_JUNGWOO = { birthDate: "1991-11-02", birthTime: "23:10" };

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("truly similar pair — shared baseline text appears exactly once, not once per person card", () => {
  // Both neutral (50 everywhere) -> both land in Pattern 4 with no secondary gap -> sharedBaseline.
  const html = renderReportHtml("지민", "정우", BIRTH_JIMIN, BIRTH_JUNGWOO, makePsych({}), makePsych({}));
  const SHARED_LINE = "둘 다 관계의 평화와 조화를 중요하게 여기는 편입니다.";
  assert.equal(countOccurrences(html, SHARED_LINE), 1, "the shared baseline sentence must render exactly once, not duplicated under two person cards");
  assert.ok(html.includes("공통 평소 상태"), "the combined-baseline label must render");
  assert.ok(!html.includes("1. 평소의 모습"), "the old per-person '평소의 모습' cards must not render when a shared baseline applies");
});

test("differentiated pair (real secondary-axis gap) — stays as two separate person cards, no shared-baseline label", () => {
  const html = renderReportHtml(
    "지민", "정우", BIRTH_JIMIN, BIRTH_JUNGWOO,
    makePsych({ self_control: 55, empathy: 45, recognition: 45 }),
    makePsych({ self_control: 15, empathy: 45, recognition: 45 }),
  );
  assert.ok(!html.includes("공통 평소 상태"), "no shared-baseline label when the pair is genuinely differentiated");
  assert.ok(html.includes("1. 평소의 모습"), "the two-card per-person layout must still be used");
});

test("A/B swap integrity — swapping which name is 'A' still produces exactly one shared-baseline line, never two", () => {
  const html = renderReportHtml("정우", "지민", BIRTH_JUNGWOO, BIRTH_JIMIN, makePsych({}), makePsych({}));
  const SHARED_LINE = "둘 다 관계의 평화와 조화를 중요하게 여기는 편입니다.";
  assert.equal(countOccurrences(html, SHARED_LINE), 1);
});
