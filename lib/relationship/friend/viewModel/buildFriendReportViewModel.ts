/**
 * Friend Premium → 렌더링 전용 ViewModel 어댑터. work 도메인과 동일한 패턴.
 *
 * 순수 함수. 이미 로드된 `FriendReportBody`를 받아 `FriendReportSection[]`로
 * 재구성만 한다. 소스 필드가 없으면(레거시 payload 등) 해당 섹션을 생략한다
 * — 빈 문자열/placeholder로 채워 넣지 않는다(가짜 데이터 방지).
 *
 * 카드 타이틀은 en-US/ko-KR 메시지 카탈로그(messagesEnUS/messagesKoKR)를
 * 직접 재사용한다 — work에서 겪은 "Part 렌더러가 ko-KR에만 하드코딩" 문제를
 * 처음부터 피하기 위해 en-US도 동일하게 지원한다(ko-KR 전용 게이트 금지).
 */
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  resolveReportPsychDisplay,
  swapPsychAxisForViewer,
} from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { buildFriendPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFriendPsychMatch";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import type {
  OpeningBlock,
  FriendReportSection,
  FriendReportViewModel,
} from "./friendReportSectionTypes";

export type BuildFriendReportViewModelParams = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  locale?: Locale;
};

function catalog(locale: Locale) {
  return (locale === "en-US" ? messagesEnUS : messagesKoKR).relationshipDrilldown.friendship;
}

function buildOpening(
  report: FriendReportBody,
  names: [string, string],
): OpeningBlock {
  return {
    headline: report.headline || report.one_line_friendship,
    subtitle: report.one_line_friendship ?? "",
    grade: report.meta?.grade ?? "",
    gradeReason: report.meta?.grade_reason ?? "",
    names,
  };
}

function buildSnapshotSection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const f = report.friend;
  if (!f?.section_snapshot) return null;
  const notes = f.section_snapshot.vibe_axis_notes;
  return {
    id: "snapshot",
    type: "snapshot",
    partNumber: 1,
    title: t.dnaCardTitle,
    scores: {
      connectionPct: f.section_snapshot.connection_pct,
      banterPct: f.section_snapshot.banter_pct,
      riskPct: f.section_snapshot.risk_pct,
    },
    panel: report.snapshot_panel,
    vibeAxisNotes: notes
      ? {
          connectionNote: notes.connection_note,
          banterNote: notes.banter_note,
          riskNote: notes.risk_note,
        }
      : undefined,
  };
}

function buildCompareTableSection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const rows = report.friend?.section_compare_table;
  if (!rows?.length) return null;
  return {
    id: "compare_table",
    type: "compare_table",
    partNumber: 1,
    title: t.compareTableCardTitle,
    rows,
  };
}

function buildPsychRadarSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(report.meta, buildFriendPsychMatchBundle);
  if (!psychDisplay) return null;
  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 1,
    title: t.psychRadarCardTitle,
    axisResults: swapPsychAxisForViewer(psychDisplay.psych_match.axis_results, viewerIsReportA),
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: psychDisplay.psych_lens.highlights,
  };
}

function buildSocialDnaSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const f = report.friend;
  if (!f?.section_social_dna_a || !f?.section_social_dna_b) return null;
  const dna = pickViewerFirstPair(
    f.section_social_dna_a,
    f.section_social_dna_b,
    viewerIsReportA,
  );
  return {
    id: "social_dna",
    type: "social_dna",
    partNumber: 2,
    title: t.dnaCardTitle,
    dna,
  };
}

function buildSoulmateSection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const verdict = report.friend?.section_soulmate?.soulmate_verdict;
  if (!verdict) return null;
  return {
    id: "soulmate",
    type: "soulmate",
    partNumber: 3,
    title: t.soulmateCardTitle,
    verdict,
  };
}

function buildPlayMoneySection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const pm = report.friend?.section_play_money;
  if (!pm) return null;
  return {
    id: "play_money",
    type: "play_money",
    partNumber: 3,
    title: t.playMoneyCardTitle,
    treasurerNickname: pm.treasurer_nickname,
    treasurerReason: pm.treasurer_reason,
    optimalHangout: pm.optimal_hangout,
    psychConfirmNote: pm.psych_confirm_note,
  };
}

function buildHiddenFlowSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const hf = report.friend?.section_hidden_flow;
  if (!hf) return null;
  if (!hf.travel_style && !hf.counseling_style_a && !hf.counseling_style_b) return null;
  const counseling = pickViewerFirstPair(
    hf.counseling_style_a,
    hf.counseling_style_b,
    viewerIsReportA,
  );
  return {
    id: "hidden_flow",
    type: "hidden_flow",
    partNumber: 3,
    title: t.hiddenFlowCardTitle,
    travelStyle: hf.travel_style,
    counseling,
  };
}

function buildBreakupGuideSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const bg = report.friend?.section_breakup_guide;
  if (!bg) return null;
  const { me, partner } = pickViewerFirstPair(
    bg.trigger_warning_a,
    bg.trigger_warning_b,
    viewerIsReportA,
  );
  const jealousyGuard = pickViewerFirstPair(
    bg.jealousy_guard_a ?? null,
    bg.jealousy_guard_b ?? null,
    viewerIsReportA,
  );
  return {
    id: "breakup_guide",
    type: "breakup_guide",
    partNumber: 4,
    title: t.breakupGuideCardTitle,
    warnings: { me, partner },
    jealousyGuard,
  };
}

function buildDeEscalationSection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const de = report.friend?.section_de_escalation;
  if (!de) return null;
  return {
    id: "de_escalation",
    type: "de_escalation",
    partNumber: 5,
    title: t.deEscalationCardTitle,
    hashtag: de.hashtag,
    color: de.color,
    archetypeLabel: de.archetype_label,
    cheatScript: de.cheat_script,
    reconciliationScript: de.reconciliation_script,
  };
}

function buildPrescriptionSection(
  report: FriendReportBody,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const pack = report.meta?.prescription_friendship;
  if (!pack?.items?.length) return null;
  return {
    id: "prescription",
    type: "prescription",
    partNumber: 5,
    title: t.deEscalationCardTitle,
    introLine: pack.intro_line,
    items: pack.items,
  };
}

export function buildFriendReportViewModel(
  report: FriendReportBody,
  params: BuildFriendReportViewModelParams,
): FriendReportViewModel {
  const { viewerIsReportA, myName, partnerName, locale } = params;
  const names: [string, string] = [myName, partnerName];
  const t = catalog(locale ?? "ko-KR");

  const builders: Array<() => FriendReportSection | null> = [
    () => buildSnapshotSection(report, t),
    () => buildCompareTableSection(report, t),
    () => buildPsychRadarSection(report, viewerIsReportA, t),
    () => buildSocialDnaSection(report, viewerIsReportA, t),
    () => buildSoulmateSection(report, t),
    () => buildPlayMoneySection(report, t),
    () => buildHiddenFlowSection(report, viewerIsReportA, t),
    () => buildBreakupGuideSection(report, viewerIsReportA, t),
    () => buildDeEscalationSection(report, t),
    () => buildPrescriptionSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is FriendReportSection => section != null);

  return {
    kind: "friendship",
    opening: buildOpening(report, names),
    sections,
    raw: { report },
  };
}
