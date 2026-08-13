import React from "react";
import ReactDOMServer from "react-dom/server";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel";
import { MarriageReportViewModelView } from "../../components/relationship/marriage/sections/SectionRenderer";
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
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

const report = buildMarriageReport({
  nicknameA: "Sera",
  nicknameB: "동글",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: makePsych({ self_control: 75, practicality: 65, structure: 80 }),
  psychMasterB: makePsych({ practicality: 70, self_control: 45, recognition: 40 }),
  locale: "ko-KR",
});

const vm = buildMarriageReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Sera",
  partnerName: "동글",
  locale: "ko-KR",
});

const domHtml = ReactDOMServer.renderToString(
  React.createElement(MarriageReportViewModelView, {
    vm,
    viewerIsReportA: true,
  })
);

const bannedPatterns = [
  "상보적 결합",
  "시너지 극대화",
  "주거 안정판",
  "외교적 주거 장막",
  "관계적 결과",
  "감정적 피로 부채",
  "자산화 속도 극대화",
  "정서적 안식처",
  "완전한 주거 공간",
  "이중 방어막",
  "구조적 공간 정리",
  "자산으로 승화",
];

console.log("==================================================");
console.log(" AI VOICE PHRASE SEARCH AUDIT (Sera x 동글)");
console.log("==================================================");

let aiVoiceFound = false;
bannedPatterns.forEach((pat) => {
  if (domHtml.includes(pat)) {
    console.log(`  ❌ FOUND AI-SOUNDING PHRASE: "${pat}"`);
    aiVoiceFound = true;
  }
});

if (!aiVoiceFound) {
  console.log("  ✅ ZERO AI-SOUNDING PHRASES DETECTED IN RENDERED DOM!");
}
