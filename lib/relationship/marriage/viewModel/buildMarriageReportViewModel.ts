/**
 * Marriage/Cohabitation Premium → 렌더링 전용 ViewModel 어댑터. work·friend
 * 도메인과 동일한 패턴 — 순수 함수, 이미 로드된 `MarriageReportBody`를
 * `MarriageReportSection[]`로 재구성만 한다. 소스 필드가 없으면 해당 섹션을
 * 생략한다(가짜 데이터로 채우지 않음).
 *
 * Part1(낭만/운명 서사)은 아직 콘텐츠가 없어 섹션을 만들지 않는다(2단계
 * 범위 — 사용자 승인된 단계적 작업). Part2~5만 기존 household 섹션을
 * 재배치한다.
 *
 * 카드 타이틀은 en-US/ko-KR 메시지 카탈로그를 직접 재사용한다 — work에서
 * 겪은 "Part 렌더러가 ko-KR에만 하드코딩" 문제를 처음부터 피한다.
 */
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildMarriagePsychMatchBundle } from "@/lib/relationship/marriage/buildMarriagePsychMatch";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import type {
  OpeningBlock,
  MarriageReportSection,
  MarriageReportViewModel,
} from "./marriageReportSectionTypes";

export type BuildMarriageReportViewModelParams = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  locale?: Locale;
};

function catalog(locale: Locale) {
  return (locale === "en-US" ? messagesEnUS : messagesKoKR).relationshipDrilldown.cohabitation;
}

function buildOpening(
  report: MarriageReportBody,
  names: [string, string],
): OpeningBlock {
  return {
    headline: report.headline || report.one_line_household,
    subtitle: report.one_line_household ?? "",
    grade: report.meta?.grade ?? "",
    gradeReason: report.meta?.grade_reason ?? "",
    names,
  };
}

function buildOriginStorySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const s = report.household?.section_origin_story;
  if (!s) return null;
  return {
    id: "origin_story",
    type: "origin_story",
    partNumber: 1,
    title: t.originStoryCardTitle,
    whyUs: s.why_us,
    positiveChangeA: s.positive_change_a,
    positiveChangeB: s.positive_change_b,
  };
}

function buildHouseholdSnapshotSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const s = report.household?.section_snapshot;
  if (!s) return null;
  return {
    id: "household_snapshot",
    type: "household_snapshot",
    partNumber: 2,
    title: t.dnaCardTitle,
    scores: {
      romanticFitPct: s.romantic_fit_pct,
      lifeSynergyPct: s.life_synergy_pct,
      homeRiskPct: s.home_risk_pct,
    },
    panel: report.snapshot_panel,
  };
}

function buildCompareTableSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const rows = report.household?.section_compare_table;
  if (!rows?.length) return null;
  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 2,
    title: t.compareTableCardTitle,
    rows,
  };
}

function buildPsychRadarSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(report.meta, buildMarriagePsychMatchBundle);
  if (!psychDisplay) return null;
  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 2,
    title: t.psychRadarCardTitle,
    axisResults: swapPsychAxisForViewer(psychDisplay.psych_match.axis_results, viewerIsReportA),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildMoneyChoresSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const m = report.household?.section_money_chores;
  if (!m) return null;
  return {
    id: "money_chores",
    type: "money_chores",
    partNumber: 2,
    title: t.moneyChoresCardTitle,
    cfoNickname: m.cfo_nickname,
    cfoReason: m.cfo_reason,
    choresGuideline: m.chores_guideline,
    spendingStyleNote: m.spending_style_note,
    cfoAxisNote: m.cfo_axis_note,
  };
}

function buildBedroomSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const b = report.household?.section_bedroom;
  if (!b) return null;
  return {
    id: "bedroom",
    type: "bedroom",
    partNumber: 3,
    title: t.bedroomCardTitle,
    matrix: b.matrix,
    attachmentStyle: b.attachment_style,
    sleepFit: b.sleep_fit,
    rejectionScriptA: b.rejection_script_a,
    rejectionScriptB: b.rejection_script_b,
    rejectionAxisNote: b.rejection_axis_note,
  };
}

function buildHomeDnaSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const d = report.household?.section_dna;
  if (!d?.person_a || !d?.person_b) return null;
  const dna = pickViewerFirstPair(d.person_a, d.person_b, viewerIsReportA);
  return {
    id: "home_dna",
    type: "home_dna",
    partNumber: 4,
    title: t.dnaCardTitle,
    dna,
  };
}

function buildParentingSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const p = report.household?.section_parenting;
  if (!p) return null;
  return {
    id: "parenting",
    type: "parenting",
    partNumber: 4,
    title: t.parentingCardTitle,
    combinedAttitude: p.combined_attitude,
    personAStyle: p.person_a_style,
    personBStyle: p.person_b_style,
    harmonyTip: p.harmony_tip,
  };
}

function buildFamilyBoundarySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const f = report.household?.section_family_boundary;
  if (!f) return null;
  return {
    id: "family_boundary",
    type: "family_boundary",
    partNumber: 4,
    title: t.familyBoundaryCardTitle,
    inlawStressSummary: f.inlaw_stress_summary,
    personABoundaryNote: f.person_a_boundary_note,
    personBBoundaryNote: f.person_b_boundary_note,
  };
}

function buildWeatherForecastSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const forecast = report.household?.section_weather_forecast;
  if (!forecast?.years?.length) return null;
  return {
    id: "weather_forecast",
    type: "weather_forecast",
    partNumber: 4,
    title: t.weatherCardTitle,
    forecast,
  };
}

function buildPrivacySection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const p = report.household?.section_privacy;
  if (!p) return null;
  return {
    id: "privacy",
    type: "privacy",
    partNumber: 5,
    title: t.privacyCardTitle,
    personAPrivateLine: p.person_a_private_line,
    personBPrivateLine: p.person_b_private_line,
  };
}

function buildUpsetSection(
  report: MarriageReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const u = report.household?.section_upset;
  if (!u?.person_a || !u?.person_b) return null;
  const guide = pickViewerFirstPair(u.person_a, u.person_b, viewerIsReportA);
  return {
    id: "upset",
    type: "upset",
    partNumber: 5,
    title: t.upsetSectionCardTitle,
    guide,
  };
}

function buildWarningSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const w = report.household?.section_warning;
  if (!w) return null;
  return {
    id: "warning",
    type: "warning",
    partNumber: 5,
    title: t.warningCardTitle,
    conflictCommunication: w.conflict_communication,
    conflictTrigger: w.conflict_trigger,
    deEscalation: w.de_escalation,
  };
}

function buildPrescriptionSection(
  report: MarriageReportBody,
  t: ReturnType<typeof catalog>,
): MarriageReportSection | null {
  const pack = report.meta?.prescription_cohabitation;
  if (!pack?.items?.length) return null;
  return {
    id: "prescription",
    type: "prescription",
    partNumber: 5,
    title: t.prescriptionCardTitle,
    introLine: pack.intro_line,
    items: pack.items,
  };
}

export function buildMarriageReportViewModel(
  report: MarriageReportBody,
  params: BuildMarriageReportViewModelParams,
): MarriageReportViewModel {
  const { viewerIsReportA, myName, partnerName, locale } = params;
  const names: [string, string] = [myName, partnerName];
  const t = catalog(locale ?? "ko-KR");

  const builders: Array<() => MarriageReportSection | null> = [
    () => buildOriginStorySection(report, t),
    () => buildHouseholdSnapshotSection(report, t),
    () => buildCompareTableSection(report, t),
    () => buildPsychRadarSection(report, viewerIsReportA, t),
    () => buildMoneyChoresSection(report, t),
    () => buildBedroomSection(report, t),
    () => buildHomeDnaSection(report, viewerIsReportA, t),
    () => buildParentingSection(report, t),
    () => buildFamilyBoundarySection(report, t),
    () => buildWeatherForecastSection(report, t),
    () => buildPrivacySection(report, t),
    () => buildUpsetSection(report, viewerIsReportA, t),
    () => buildWarningSection(report, t),
    () => buildPrescriptionSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is MarriageReportSection => section != null);

  return {
    kind: "cohabitation",
    opening: buildOpening(report, names),
    sections,
    raw: { report },
  };
}
