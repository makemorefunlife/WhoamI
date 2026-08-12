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

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
  tenGods: [{ pillar: "년주", godCode: "정관" }],
};

const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
  tenGods: [{ pillar: "년주", godCode: "식신" }],
};

const canonicalReport = buildCanonicalRomanticV4Report({
  input: {
    nicknameA: "민준", nicknameB: "서연",
    sajuJsonA: sajuA, sajuJsonB: sajuB,
    psychMasterA: makePsych({ empathy: 75, structure: 35 }),
    psychMasterB: makePsych({ structure: 85, empathy: 35 }),
    locale: "ko-KR",
  } as any,
  reportId: "test-user-visible-001",
});

const htmlOutput = ReactDOMServer.renderToString(
  React.createElement(CanonicalReportView, {
    report: canonicalReport as any,
    payload: {
      locale: "ko-KR",
      storyPlan: canonicalReport.storyPlan,
      report: canonicalReport,
    } as any,
    personA: "민준",
    personB: "서연",
  } as any)
);

console.log("=== USER-VISIBLE RENDERING ASSERTION (HTML STRING SEARCH) ===");
console.log("1. Role Matrix Visible?:", htmlOutput.includes("연애 관계 역학 포지션") ? "YES (PASS)" : "NO (FAIL)");
console.log("2. Bidirectional Growth Visible?:", htmlOutput.includes("양방향 성장") ? "YES (PASS)" : "NO (FAIL)");
console.log("3. Wanted vs Given Love Visible?:", htmlOutput.includes("Wanted Love vs Given Love") ? "YES (PASS)" : "NO (FAIL)");
console.log("4. What Not to Expect Visible?:", htmlOutput.includes("What Not to Expect") ? "YES (PASS)" : "NO (FAIL)");
console.log("5. When Needed Most Visible?:", htmlOutput.includes("When Needed Most") ? "YES (PASS)" : "NO (FAIL)");
console.log("6. Emergency SOS Scripts Visible?:", htmlOutput.includes("Emergency SOS") ? "YES (PASS)" : "NO (FAIL)");
console.log("7. Long-Term Bond Visible?:", htmlOutput.includes("Long-Term Bond") ? "YES (PASS)" : "NO (FAIL)");
console.log("8. Physical Intimacy Visible?:", (htmlOutput.includes("피지컬 친밀감") || htmlOutput.includes("Physical Intimacy")) ? "YES (PASS)" : "NO (FAIL)");
console.log("9. Conflict State Transition Visible?:", htmlOutput.includes("State Transition") ? "YES (PASS)" : "NO (FAIL)");

console.log("\n=== REGRESSION: EXISTING STRONG CONTENT ASSERTION ===");
console.log("Attraction Section Visible?:", (htmlOutput.includes("c2_attraction") || htmlOutput.includes("끌렸는가")) ? "YES (PASS)" : "NO (FAIL)");
console.log("Hidden Hearts Visible?:", (htmlOutput.includes("c6_hidden_hearts") || htmlOutput.includes("숨은 마음")) ? "YES (PASS)" : "NO (FAIL)");
console.log("Conflict Loop Visible?:", (htmlOutput.includes("c4_conflict") || htmlOutput.includes("부딪히는")) ? "YES (PASS)" : "NO (FAIL)");
console.log("Repair Guide Visible?:", (htmlOutput.includes("c7_repair") || htmlOutput.includes("가까워지는")) ? "YES (PASS)" : "NO (FAIL)");
