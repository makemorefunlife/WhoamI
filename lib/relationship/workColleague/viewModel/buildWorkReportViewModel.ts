/**
 * Work Colleague Premium → 렌더링 전용 ViewModel 어댑터.
 *
 * 순수 함수. DB/캐시/LLM output schema를 읽거나 쓰지 않는다 — 이미 로드된
 * `WorkColleagueReportBody`(라이브 캐시든 relationship_analysis_logs 스냅샷이든)를
 * 받아 `WorkReportSection[]`로 재구성만 한다. 소스 필드가 없으면(레거시 payload 등)
 * 해당 섹션 또는 섹션 내부 optional 필드를 생략한다 — 빈 문자열/placeholder로
 * 채워 넣지 않는다(가짜 데이터 방지).
 *
 * SECTION_TITLES는 en-US/ko-KR 둘 다 지원 — 주 사용자층이 영어권이라 en-US도
 * Part 렌더러를 그대로 써야 한다(ko-KR 전용으로 게이트하지 않는다).
 */
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildWorkPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildWorkPsychMatch";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatWorkCompareCanonicalLabel,
  readWorkComparisonTableCanonicalProjection,
} from "@/lib/relationship/workColleague/workComparisonTableCanonical";
import {
  formatWorkLeadershipCanonicalLabel,
  readWorkLeadershipCanonicalProjection,
} from "@/lib/relationship/workColleague/workLeadershipCanonical";
import type {
  OpeningBlock,
  WorkReportSection,
  WorkReportViewModel,
} from "./workReportSectionTypes";
import type { WorkCompareRow } from "@/lib/relationship/workColleague/sajuCompareTable";

export type BuildWorkReportViewModelParams = {
  viewerIsReportA: boolean;
  /** 이미 해석된 표시명 — fallback 문구는 호출부(React 레이어, useMessages 보유)의 책임 */
  myName: string;
  partnerName: string;
  locale?: Locale;
};

type SectionTitleSet = {
  snapshot: string;
  compareTable: string;
  psychRadar: string;
  comparison: string;
  roleMatrix: string;
  relationshipLoop: string;
  warning: string;
  prescription: string;
  conflictTrigger: string;
};

const SECTION_TITLES: Record<Locale, SectionTitleSet> = {
  "ko-KR": {
    snapshot: "파트너십 한눈에 보기",
    compareTable: "한눈에 비교 — 6가지 협업 축",
    psychRadar: "11축 궁합 레이더",
    comparison: "두 사람의 업무 스타일",
    roleMatrix: "역할 및 기여 방식",
    relationshipLoop: "함께 일할 때 반복되는 흐름",
    warning: "협업 안전장치",
    prescription: "실전 운영 가이드",
    conflictTrigger: "갈등 트리거",
  },
  "en-US": {
    snapshot: "Partnership at a Glance",
    compareTable: "Side-by-Side — 6 Collaboration Axes",
    psychRadar: "11-Axis Compatibility Radar",
    comparison: "Work Styles Compared",
    roleMatrix: "Roles & How You Each Contribute",
    relationshipLoop: "The Loop You Fall Into at Work",
    warning: "Collaboration Safeguards",
    prescription: "Playbook for Working Together",
    conflictTrigger: "Conflict Trigger",
  },
};

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
  titles: SectionTitleSet,
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
    title: titles.snapshot,
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
  titles: SectionTitleSet,
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
    title: titles.psychRadar,
    axisResults: swapPsychAxisForViewer(
      psychDisplay.psych_match.axis_results,
      viewerIsReportA,
    ),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildCompareTableSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
  locale: Locale,
  titles: SectionTitleSet,
): WorkReportSection | null {
  const rows = report.office?.section_compare_table;
  if (!rows?.length) return null;

  const typed = readWorkComparisonTableCanonicalProjection(report);
  const authorityRows: WorkCompareRow[] = rows.map((row) => {
    const typedRow = typed?.[row.id];
    if (!typedRow) return row;
    return {
      ...row,
      personA: {
        ...row.personA,
        band: typedRow.band_a,
        shortLabel: formatWorkCompareCanonicalLabel(
          row.id,
          typedRow.band_a,
          locale,
        ),
      },
      personB: {
        ...row.personB,
        band: typedRow.band_b,
        shortLabel: formatWorkCompareCanonicalLabel(
          row.id,
          typedRow.band_b,
          locale,
        ),
      },
    };
  });

  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 1,
    title: titles.compareTable,
    rows: authorityRows.map((row) => {
      const { me, partner } = pickViewerFirstPair(
        row.personA,
        row.personB,
        viewerIsReportA,
      );
      return {
        id: row.id,
        label: row.label,
        me: { shortLabel: me.shortLabel },
        partner: { shortLabel: partner.shortLabel },
        meaning: row.meaning,
      };
    }),
  };
}

function buildComparisonSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
  titles: SectionTitleSet,
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

  const reportingFit = office.section_mix_fit.reporting_style_fit;
  const reportingStyleFit = reportingFit
    ? {
        ...pickViewerFirstPair(reportingFit.person_a, reportingFit.person_b, viewerIsReportA),
        summary: reportingFit.summary,
      }
    : undefined;

  const breakFit = office.section_respect?.break_boundary_fit;
  const breakBoundaryFit = breakFit
    ? {
        ...pickViewerFirstPair(breakFit.person_a, breakFit.person_b, viewerIsReportA),
        summary: breakFit.summary,
      }
    : undefined;

  return {
    id: "comparison",
    type: "comparison",
    partNumber: 2,
    title: titles.comparison,
    dna,
    workStyle,
    communicationFit: office.section_mix_fit.communication_fit,
    boundary,
    reportingStyleFit,
    breakBoundaryFit,
  };
}

function buildRoleMatrixSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
  locale: Locale,
  titles: SectionTitleSet,
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

  const leadershipProj = readWorkLeadershipCanonicalProjection(report);
  const leadershipCanonicalLabel = leadershipProj
    ? formatWorkLeadershipCanonicalLabel(leadershipProj, {
        nameA: office.section_roles.person_a.nickname,
        nameB: office.section_roles.person_b.nickname,
        locale,
      })
    : null;

  return {
    id: "role_matrix",
    type: "role_matrix",
    partNumber: 3,
    title: titles.roleMatrix,
    roles,
    synergyOneLiner: office.section_roles.synergy_one_liner,
    idealFit,
    togetherCombo: office.section_ideal_roles?.together_combo,
    leadershipSplit: office.section_roles.leadership_split ?? undefined,
    leadershipCanonicalLabel,
  };
}

function buildRelationshipLoopSection(
  report: WorkColleagueReportBody,
  titles: SectionTitleSet,
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
      title: titles.conflictTrigger,
      body: conflictTrigger,
    });
  }

  if (positiveLoop.length === 0 && frictionLoop.length === 0) return null;

  return {
    id: "relationship_loop",
    type: "relationship_loop",
    partNumber: 3,
    title: titles.relationshipLoop,
    positiveLoop,
    frictionLoop,
  };
}

function buildWarningSection(
  report: WorkColleagueReportBody,
  viewerIsReportA: boolean,
  titles: SectionTitleSet,
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
    title: titles.warning,
    conflictTrigger: sectionWarning.conflict_trigger,
    deEscalation: sectionWarning.de_escalation,
    upset,
    feedbackCushion: report.office?.section_upset?.feedback_cushion ?? undefined,
  };
}

function buildPrescriptionSection(
  report: WorkColleagueReportBody,
  titles: SectionTitleSet,
): WorkReportSection | null {
  const pack = report.meta?.prescription_work;
  if (!pack?.items?.length) return null;

  return {
    id: "prescription",
    type: "prescription",
    partNumber: 5,
    title: titles.prescription,
    introLine: pack.intro_line,
    items: pack.items,
    weeklyCheckIn: pack.items.find((item) => item.topic === "office_baseline"),
  };
}

export function buildWorkReportViewModel(
  report: WorkColleagueReportBody,
  params: BuildWorkReportViewModelParams,
): WorkReportViewModel {
  const { viewerIsReportA, myName, partnerName, locale } = params;
  const names: [string, string] = [myName, partnerName];
  const titles = SECTION_TITLES[locale ?? "ko-KR"];

  const builders: Array<() => WorkReportSection | null> = [
    () => buildSnapshotSection(report, titles),
    () =>
      buildCompareTableSection(
        report,
        viewerIsReportA,
        locale ?? "ko-KR",
        titles,
      ),
    () => buildPsychRadarSection(report, viewerIsReportA, titles),
    () => buildComparisonSection(report, viewerIsReportA, titles),
    () =>
      buildRoleMatrixSection(
        report,
        viewerIsReportA,
        locale ?? "ko-KR",
        titles,
      ),
    () => buildRelationshipLoopSection(report, titles),
    () => buildWarningSection(report, viewerIsReportA, titles),
    () => buildPrescriptionSection(report, titles),
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
