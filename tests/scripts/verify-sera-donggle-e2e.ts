import React from "react";
import ReactDOMServer from "react-dom/server";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import { CanonicalReportView } from "../../components/relationship/romantic/v4/CanonicalReportView";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
  } as unknown as PsychMasterJson;
}

// Real Sera (High self_control, high recognition, high empathy) x Donggle (High structure, high self_control)
const seraPsych = makePsych({ self_control: 70, recognition: 75, empathy: 65, conflict_style: 45 });
const dongglePsych = makePsych({ structure: 75, self_control: 65, empathy: 45, conflict_style: 50 });

import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";

const canonicalReport = buildCanonicalRomanticV4Report("ko-KR", 2026, {
  pairSajuInput: {
    nameA: "Sera",
    nameB: "동글",
  },
  surveyInput: {
    psychA: seraPsych,
    psychB: dongglePsych,
  },
});

const payload = buildRomanticV4PrototypePayload({
  canonicalReport,
  locale: "ko-KR",
  personA: "Sera",
  personB: "동글",
});

// Force simulate legacy DB cache or payload missing selectedAxisInsights
const payloadWithoutPreSlicedInsights = {
  ...payload,
  selectedAxisInsights: [],
};

console.log("Testing with EMPTY selectedAxisInsights (Simulating DB cache/API response)...");

const htmlOutput = ReactDOMServer.renderToString(
  React.createElement(CanonicalReportView, {
    report: canonicalReport as any,
    payload: payloadWithoutPreSlicedInsights as any,
    personA: "Sera",
    personB: "동글",
  } as any)
);

console.log("==================================================");
console.log(" 1. 11-AXIS DARK AXIS INSIGHTS & DUPLICATION AUDIT");
console.log("==================================================");

const hasRadar = htmlOutput.includes("PsychMatchRadarChart") || htmlOutput.includes("svg");
const hasDarkCards = htmlOutput.includes("11축 심리 차이 핵심 인사이트") || htmlOutput.includes("Psych Dynamics");
const hasPairComparison = htmlOutput.includes("나란히 놓고 보기");
const hasDuplicateIntermediateBlock = htmlOutput.includes("축별 연애 관계 심층 해석 (Axis Relationship Insights)");

console.log("11-Axis Radar Rendered?                     :", hasRadar ? "YES (PASS)" : "NO");
console.log("Dark Axis Insight Cards Rendered?           :", hasDarkCards ? "YES (RESTORED)" : "NO");
console.log("Pair Comparison Table Rendered?             :", hasPairComparison ? "YES (PASS)" : "NO");
console.log("Duplicate Intermediate Block Present?       :", hasDuplicateIntermediateBlock ? "YES (DUPLICATED)" : "NO (REMOVED)");

console.log("\n==================================================");
console.log(" 2. CHAPTER NUMBERING & DOM ORDER AUDIT");
console.log("==================================================");

const chapterIds = [
  "c3_dynamics", "c2_attraction", "c4_conflict", "c5_misunderstanding",
  "c6_hidden_hearts", "c7_repair", "c8_3_expectations", "c8_strength_vulnerability", "c10_future_timing", "c12_choice"
];

let allNumbered = true;
chapterIds.forEach((id, index) => {
  const expectedNum = String(index + 1).padStart(2, "0");
  const pos = htmlOutput.indexOf(`id="${id}"`);
  console.log(`Chapter ${expectedNum} [${id}]:`, pos > -1 ? `PRESENT (Pos: ${pos})` : "MISSING");
  if (pos === -1) allNumbered = false;
});

const cleanHtml = htmlOutput.replace(/<!--.*?-->/g, "");
const posFuture = cleanHtml.indexOf('id="c10_future_timing"');
const futureSnippet = cleanHtml.substring(posFuture, posFuture + 1500);
console.log("FutureTiming Snippet Text:\n", futureSnippet);
const hasFutureTimingNumbered = futureSnippet.includes("Chapter 09");
console.log("c10_future_timing (올해 우리 관계의 흐름) Has 'Chapter 09'?:", hasFutureTimingNumbered ? "YES (CONSISTENT)" : "NO");

console.log("\n==================================================");
console.log(" 3. FINAL VERDICT");
console.log("==================================================");
console.log("11-AXIS DARK INSIGHT        :", hasDarkCards ? "RESTORED" : "NOT RESTORED");
console.log("PAIR COMPARISON DUPLICATION :", !hasDuplicateIntermediateBlock ? "REMOVED" : "STILL PRESENT");
console.log("CHAPTER NUMBERING           :", (allNumbered && hasFutureTimingNumbered) ? "CONSISTENT" : "INCONSISTENT");
