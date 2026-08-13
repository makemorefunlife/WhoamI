import React from "react";
import ReactDOMServer from "react-dom/server";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel";
import { MarriageReportViewModelView } from "../../components/relationship/marriage/sections/SectionRenderer";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(): PsychMasterJson {
  return {
    survey_source: "v2_10q",
    secondary_axes: { self_control: 75, practicality: 65, structure: 80 },
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
  psychMasterA: makePsych(),
  psychMasterB: makePsych(),
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

const matches = domHtml.match(/[^>]*점[^<]*/g);
console.log("MATCHED '점' SNIPPETS:", matches);
