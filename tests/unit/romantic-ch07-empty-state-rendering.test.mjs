/**
 * Final Cleanup pass, item 4 — Ch07 "What Not to Expect" must never render
 * a labeled-but-empty shell (the old "Sera: -" / "동글: -" problem), and
 * must never fall back to generic, ungrounded advice when data is missing.
 * Full-pipeline render tests via ReactDOMServer, same pattern as
 * tests/scripts/verify-sera-donggle-e2e.ts.
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

const BIRTH_A = { birthDate: "1993-04-12", birthTime: "07:30" };
const BIRTH_B = { birthDate: "1991-11-02", birthTime: "23:10" };

// buildRomanticV4PrototypePayload's real signature is (variant, locale,
// options) — NOT the {canonicalReport, locale, personA, personB} object
// shape tests/scripts/verify-sera-donggle-e2e.ts uses (that script is
// itself stale against the current signature). "complete" + a real-mode
// pairSajuInput is what actually threads real chart/survey data through.
function renderReportHtml(surveyInput) {
  const pairSajuInput = { mode: "real", birthA: BIRTH_A, birthB: BIRTH_B, nameA: "지민", nameB: "정우" };
  const canonicalReport = buildCanonicalRomanticV4Report("ko-KR", 2026, { pairSajuInput, surveyInput });
  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", { pairSajuInput, surveyInput });
  return ReactDOMServer.renderToString(
    React.createElement(CanonicalReportView, {
      report: canonicalReport,
      payload,
      personA: "지민",
      personB: "정우",
    }),
  );
}

test("both directions empty (no survey data at all) — the What Not to Expect chapter renders nothing, no dash placeholders", () => {
  const html = renderReportHtml(undefined);
  assert.ok(!html.includes('id="c8_3_expectations"'), "the chapter's own DOM node must not render when both directions are empty");
  assert.ok(!html.includes("내려놓아야 할 기대"), "no labeled-but-empty section heading either");
});

test("both directions empty never falls back to the old generic hardcoded advice", () => {
  const html = renderReportHtml(undefined);
  assert.ok(!html.includes("즉각적인 반응 속도 동기화"), "old hardcoded fallback A must be gone");
  assert.ok(!html.includes("완벽한 감정적 대칭성"), "old hardcoded fallback B must be gone");
});

test("only one direction grounded (psychA present, psychB absent) — only that direction's column renders", () => {
  const html = renderReportHtml({ psychA: makePsych({ empathy: 75, recognition: 75 }) });
  assert.ok(html.includes('id="c8_3_expectations"'), "chapter should render since at least one direction has content");
  // notToExpectBFromA is grounded by psychA (real) -> 정우's column ("정우가 ... 지민에게 내려놓아야 할 기대") renders.
  // notToExpectAFromB needs psychB (absent) -> empty -> 지민's column ("지민가/이 ... 정우에게 ...") must NOT render.
  assert.ok(html.includes("정우가") && html.includes("지민에게") && html.includes("내려놓아야 할 기대"), "the grounded direction's heading must render");
  const hasEmptyDirectionHeading = /지민(이|가)[\s\S]{0,40}정우에게[\s\S]{0,20}내려놓아야 할 기대/.test(html);
  assert.ok(!hasEmptyDirectionHeading, "the ungrounded direction's heading must NOT render");
});

test("both directions grounded (real psych data on both sides with divergent axes) — both columns render", () => {
  const html = renderReportHtml({
    psychA: makePsych({ empathy: 75, recognition: 75, self_control: 20 }),
    psychB: makePsych({ structure: 75, self_control: 75 }),
  });
  assert.ok(html.includes('id="c8_3_expectations"'));
  assert.ok(html.includes("내려놓아야 할 기대"));
});
