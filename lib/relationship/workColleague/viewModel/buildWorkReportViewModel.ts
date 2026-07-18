/**
 * Work Colleague Premium → 렌더링 전용 ViewModel 어댑터.
 *
 * 순수 함수. DB/캐시/LLM output schema를 읽거나 쓰지 않는다 — 이미 로드된
 * `WorkColleagueReportBody`(라이브 캐시든 relationship_analysis_logs 스냅샷이든)를
 * 받아 `WorkReportSection[]`로 재구성만 한다. 소스 필드가 없으면(레거시 payload 등)
 * 해당 섹션 또는 섹션 내부 optional 필드를 생략한다 — 빈 문자열/placeholder로
 * 채워 넣지 않는다(가짜 데이터 방지).
 *
 * locale 분기·i18n 문자열 치환은 이 어댑터의 책임이 아니다. 이번 phase는 ko-KR
 * 전용이라 SECTION_TITLES를 한국어로 고정했고, 다국어 렌더러가 붙는 단계(Phase 3
 * 이후)에서 이 상수는 relationshipDrilldown.work 쪽 i18n 메시지로 이관한다.
 */
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildWorkPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildWorkPsychMatch";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type {
  OpeningBlock,
  WorkReportSection,
  WorkReportViewModel,
} from "./workReportSectionTypes";

export type BuildWorkReportViewModelParams = {
  viewerIsReportA: boolean;
  /** 이미 해석된 표시명 — fallback 문구는 호출부(React 레이어, useMessages 보유)의 책임 */
  myName: string;
  partnerName: string;
};

const SECTION_TITLES = {
  snapshot: "파트너십 한눈에 보기",
  psychRadar: "11축 궁합 레이더",
  comparison: "두 사람의 업무 스타일",
  roleMatrix: "역할 및 기여 방식",
  relationshipLoop: "함께 일할 때 반복되는 흐름",
  warning: "협업 안전장치",
  prescription: "실전 운영 가이드",
  conflictTrigger: "갈등 트리거",
} as const;

function buildOpening(
  report: WorkColleagueReportBody,
  names: [string, string],
): OpeningBlock {
  const snapshot = report.office?.section_snapshot;
  return {
    headline: report.headline || snapshot?.one_line_definition || report.one_line_definition,
    subtitle: snapshot?.one_line_definition ?? report.one_line_definition ?? "",
    grade: report.meta?.grade ?? "",
    gradeReason: report.meta?.grade_reason ?? "",
    names,
  };
}

function buildSnapshotSection(
  report: WorkColleagueReportBody,
): WorkReportSection | null {
  const snap = report.office?.section_snapshot ?? {
    fit_pct: report.meta?.fit_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
  };
  const topics = report.snapshot_panel?.narrative?.topics ?? [];
  const gauges = report.snapshot_panel?.relationshipGauges ?? [];
  if (topics.length === 0 && gauges.length === 0) return null;

  return {
    id: "snapshot",
    type: "snapshot",
    partNumber: 1,
    title: SECTION_TITLES.snapshot,
    scores: {
      fitPct: snap.fit_pct,
      synergyPct: snap.synergy_pct,
      riskPct: snap.risk_pct,
    },
    panel: report.snapshot_panel,
  };
}

function buildPsychRadarSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
): WorkReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(
    report.meta,
    buildWorkPsychMatchBundle,
  );
  if (!psychDisplay) return null;

  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 1,
    title: SECTION_TITLES.psychRadar,
    axisResults: swapPsychAxisForViewer(
      psychDisplay.psych_match.axis_results,
      viewerIsReportA,
    ),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildComparisonSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
): WorkReportSection | null {
  const office = report.office;
  if (!office?.section_dna || !office?.section_mix_fit) return null;

  const dna = pickViewerFirstPair(
    office.section_dna.person_a,
    office.section_dna.person_b,
    viewerIsReportA,
  );
  const workStyle = pickViewerFirstPair(
    office.section_mix_fit.person_a_work_style,
    office.section_mix_fit.person_b_work_style,
    viewerIsReportA,
  );
  const boundary = office.section_respect
    ? pickViewerFirstPair(
        office.section_respect.person_a_boundary,
        office.section_respect.person_b_boundary,
        viewerIsReportA,
      )
    : undefined;

  return {
    id: "comparison",
    type: "comparison",
    partNumber: 2,
    title: SECTION_TITLES.comparison,
    dna,
    workStyle,
    communicationFit: office.section_mix_fit.communication_fit,
    boundary,
  };
}

function buildRoleMatrixSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
): WorkReportSection | null {
  const office = report.office;
  if (!office?.section_roles) return null;

  const roles = pickViewerFirstPair(
    office.section_roles.person_a,
    office.section_roles.person_b,
    viewerIsReportA,
  );
  const idealFit = office.section_ideal_roles
    ? pickViewerFirstPair(
        office.section_ideal_roles.person_a,
        office.section_ideal_roles.person_b,
        viewerIsReportA,
      )
    : undefined;

  return {
    id: "role_matrix",
    type: "role_matrix",
    partNumber: 3,
    title: SECTION_TITLES.roleMatrix,
    roles,
    synergyOneLiner: office.section_roles.synergy_one_liner,
    idealFit,
    togetherCombo: office.section_ideal_roles?.together_combo,
  };
}

function buildRelationshipLoopSection(
  report: WorkColleagueReportBody,
): WorkReportSection | null {
  const topics = report.snapshot_panel?.narrative?.topics ?? [];
  const conflictTrigger = report.office?.section_warning?.conflict_trigger;
  if (topics.length === 0 && !conflictTrigger) return null;

  const positiveLoop = topics
    .filter((t) => !t.isWarning)
    .map((t) => ({ title: t.title, body: t.interpretation }));

  const frictionLoop: Array<{ title: string; body: string }> = topics
    .filter((t) => t.isWarning)
    .map((t) => ({ title: t.title, body: t.interpretation }));
  if (conflictTrigger) {
    frictionLoop.push({
      title: SECTION_TITLES.conflictTrigger,
      body: conflictTrigger,
    });
  }

  if (positiveLoop.length === 0 && frictionLoop.length === 0) return null;

  return {
    id: "relationship_loop",
    type: "relationship_loop",
    partNumber: 3,
    title: SECTION_TITLES.relationshipLoop,
    positiveLoop,
    frictionLoop,
  };
}

function buildWarningSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
): WorkReportSection | null {
  const sectionWarning = report.office?.section_warning;
  if (!sectionWarning) return null;

  const upset = report.office?.section_upset
    ? pickViewerFirstPair(
        report.office.section_upset.person_a,
        report.office.section_upset.person_b,
        viewerIsReportA,
      )
    : undefined;

  return {
    id: "warning",
    type: "warning",
    partNumber: 4,
    title: SECTION_TITLES.warning,
    conflictTrigger: sectionWarning.conflict_trigger,
    deEscalation: sectionWarning.de_escalation,
    upset,
  };
}

function buildPrescriptionSection(
  report: WorkColleagueReportBody,
): WorkReportSection | null {
  const pack = report.meta?.prescription_work;
  if (!pack?.items?.length) return null;

  return {
    id: "prescription",
    type: "prescription",
    partNumber: 5,
    title: SECTION_TITLES.prescription,
    introLine: pack.intro_line,
    items: pack.items,
    weeklyCheckIn: pack.items.find((item) => item.topic === "office_baseline"),
  };
}

export function buildWorkReportViewModel(
  report: WorkColleagueReportBody,
  params: BuildWorkReportViewModelParams,
): WorkReportViewModel {
  const { viewerIsReportA, myName, partnerName } = params;
  const names: [string, string] = [myName, partnerName];

  const builders: Array<() => WorkReportSection | null> = [
    () => buildSnapshotSection(report),
    () => buildPsychRadarSection(report, viewerIsReportA),
    () => buildComparisonSection(report, viewerIsReportA),
    () => buildRoleMatrixSection(report, viewerIsReportA),
    () => buildRelationshipLoopSection(report),
    () => buildWarningSection(report, viewerIsReportA),
    () => buildPrescriptionSection(report),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is WorkReportSection => section != null);

  return {
    kind: "work",
    opening: buildOpening(report, names),
    sections,
    raw: { report },
  };
}
