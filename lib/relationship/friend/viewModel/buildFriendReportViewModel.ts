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
import { nameExplicitHighlights } from "@/lib/relationship/psychDomainLens/shared";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS } from "@/lib/i18n/messages/en-US";
import { messagesKoKR } from "@/lib/i18n/messages/ko-KR";
import {
  formatFriendCompareCanonicalLabel,
  readFriendComparisonTableCanonicalProjection,
} from "@/lib/relationship/friend/friendComparisonTableCanonical";
import {
  formatFriendTreasurerCanonicalLabel,
  readFriendTreasurerCanonicalProjection,
} from "@/lib/relationship/friend/friendTreasurerCanonical";
import {
  formatFriendTravelPlannerCanonicalLabel,
  readFriendTravelPlannerCanonicalProjection,
} from "@/lib/relationship/friend/friendTravelPlannerCanonical";
import type {
  OpeningBlock,
  FriendReportSection,
  FriendReportViewModel,
} from "./friendReportSectionTypes";
import type { FriendCompareRow } from "@/lib/relationship/friend/friendSajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
import { buildFriendWhyYouMeUs } from "@/lib/relationship/friend/buildFriendWhyYouMeUs";

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
    shineWhenBest: f.section_snapshot.shine_when_best ?? null,
    shineWhenLow: f.section_snapshot.shine_when_low ?? null,
    scoreCardAudit: f.section_snapshot.score_card_audit ?? null,
  };
}

function buildCompareTableSection(
  report: FriendReportBody,
  locale: Locale,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const rows = report.friend?.section_compare_table;
  if (!rows?.length) return null;
  const typed = readFriendComparisonTableCanonicalProjection(report);
  const authorityRows: FriendCompareRow[] = rows.map((row) => {
    const typedRow = typed?.[row.id];
    if (!typedRow) return row;
    // Typed projection wins over any stale/conflicting shortLabel prose.
    return {
      ...row,
      personA: {
        ...row.personA,
        band: typedRow.band_a,
        shortLabel: formatFriendCompareCanonicalLabel(
          row.id,
          typedRow.band_a,
          locale,
        ),
      },
      personB: {
        ...row.personB,
        band: typedRow.band_b,
        shortLabel: formatFriendCompareCanonicalLabel(
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
    title: t.compareTableCardTitle,
    rows: authorityRows,
  };
}

function buildPsychRadarSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
  names: [string, string],
  locale: Locale,
): FriendReportSection | null {
  const psychDisplay = resolveReportPsychDisplay(report.meta, buildFriendPsychMatchBundle);
  if (!psychDisplay) return null;
  const axisResults = swapPsychAxisForViewer(psychDisplay.psych_match.axis_results, viewerIsReportA);
  return {
    id: "psych_radar",
    type: "psych_radar",
    partNumber: 1,
    title: t.psychRadarCardTitle,
    axisResults,
    chartNote: psychDisplay.psych_lens.chart_note,
    highlights: nameExplicitHighlights(psychDisplay.psych_lens.highlights, axisResults, names[0], names[1], locale),
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
  locale: Locale,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const pm = report.friend?.section_play_money;
  if (!pm) return null;
  const treasurerProj = readFriendTreasurerCanonicalProjection(report);
  const treasurerCanonicalLabel = treasurerProj
    ? formatFriendTreasurerCanonicalLabel(treasurerProj, {
        nameA: report.meta.nickname_a,
        nameB: report.meta.nickname_b,
        locale,
      })
    : null;
  return {
    id: "play_money",
    type: "play_money",
    partNumber: 3,
    title: t.playMoneyCardTitle,
    treasurerNickname: pm.treasurer_nickname,
    treasurerReason: pm.treasurer_reason,
    optimalHangout: pm.optimal_hangout,
    psychConfirmNote: pm.psych_confirm_note,
    treasurerCanonicalLabel,
  };
}

function buildHiddenFlowSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  locale: Locale,
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
  const travelProj = readFriendTravelPlannerCanonicalProjection(report);
  const travelCanonicalLabel = travelProj
    ? formatFriendTravelPlannerCanonicalLabel(travelProj, {
        nameA: report.meta.nickname_a,
        nameB: report.meta.nickname_b,
        locale,
      })
    : null;
  return {
    id: "hidden_flow",
    type: "hidden_flow",
    partNumber: 3,
    title: t.hiddenFlowCardTitle,
    travelStyle: hf.travel_style,
    counseling,
    travelCanonicalLabel,
    counselingGapNote: hf.counseling_gap_note ?? null,
  };
}

function buildDeepReadSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  t: ReturnType<typeof catalog>,
): FriendReportSection | null {
  const overlay = report.meta?.friend_saju_deep;
  const nature = overlay?.section_2_nature;
  const gap = overlay?.section_4_friend_frames?.friendship_gap_signal;
  const action = overlay?.section_5_action;

  const vm = buildDeepReadViewModel({
    natureA: nature?.a_nature,
    natureB: nature?.b_nature,
    gapSignal: gap,
    adviceA: action?.advice_for_a,
    adviceB: action?.advice_for_b,
    together: action?.together,
    togetherStarter: action?.together_starter,
    swap: !viewerIsReportA,
  });
  if (!vm) return null;

  return {
    id: "deep_read",
    type: "deep_read",
    partNumber: 3,
    title: t.deepReadCardTitle,
    vm,
  };
}

function buildWhyYouMeUsSection(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  names: [string, string],
  locale: Locale,
): FriendReportSection | null {
  const data = buildFriendWhyYouMeUs(report, viewerIsReportA, names, locale);
  if (!data) return null;
  return {
    id: "why_you_me_us",
    type: "why_you_me_us",
    partNumber: 1,
    title: locale === "en-US" ? "Why We're Drawn to Each Other" : "서로에게 끌리는 이유",
    data,
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
    recoveryPaceNote: de.recovery_pace_note ?? null,
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

function buildFriendChapterViewModels(
  report: FriendReportBody,
  params: BuildFriendReportViewModelParams,
): FriendChapterViewModel[] | undefined {
  const storyPlan = report.meta?.canonical_story_plan;
  if (!storyPlan || !storyPlan.chapters?.length) return undefined;

  const coverage = report.meta?.canonical_bundle?.coverage;
  const deep = report.meta?.friend_saju_deep;
  const loc = params.locale ?? "ko-KR";
  const { viewerIsReportA, myName, partnerName } = params;
  const names: [string, string] = [myName, partnerName];

  const whyUsData = buildFriendWhyYouMeUs(report, viewerIsReportA, names, loc);
  const f = report.friend;
  const socialDnaA = f?.section_social_dna_a;
  const socialDnaB = f?.section_social_dna_b;
  const hiddenFlow = f?.section_hidden_flow;
  const breakupGuide = f?.section_breakup_guide;
  const deEscalation = f?.section_de_escalation;
  const soulmate = f?.section_soulmate;
  const prescriptions = report.meta?.prescription_friendship?.items ?? null;

  return storyPlan.chapters.map((ch) => {
    let narrativeText: string | null = null;
    const v1Assets: FriendChapterViewModel["v1Assets"] = {};
    const coverageCards: FriendChapterViewModel["coverageCards"] = {};

    switch (ch.chapterKey) {
      case "ch01_why_us":
        narrativeText =
          deep?.section_1_spark?.spark_narrative ??
          (whyUsData?.summaryLine ??
            "서로가 가진 고유한 에너지와 대화 스타일이 자연스럽게 맞아떨어지는 우정입니다.");
        v1Assets.whyYouMeUs = whyUsData;
        break;

      case "ch02_who_we_are":
        narrativeText =
          deep?.section_2_nature?.a_nature ??
          `${names[0]}님과 ${names[1]}님은 서로의 부족한 점을 채우고 든든하게 받쳐주는 수호군 형태의 관계입니다.`;
        if (socialDnaA && socialDnaB) {
          v1Assets.socialDnaMe = viewerIsReportA ? socialDnaA : socialDnaB;
          v1Assets.socialDnaPartner = viewerIsReportA ? socialDnaB : socialDnaA;
        }
        break;

      case "ch03_social_dna_tempo":
        narrativeText =
          deep?.section_3_tempo?.tempo_narrative ??
          "연락의 빈도보다는 대화가 이어질 때 느껴지는 편안한 티키타카와 소통 템포가 핵심입니다.";
        if (coverage?.initiativeRole) {
          coverageCards.initiativeRole = {
            contactInitiator: coverage.initiativeRole.contactInitiator === "A" ? names[0] : names[1],
            planningLead: coverage.initiativeRole.planningLead === "A" ? names[0] : names[1],
            reconnectionLead: coverage.initiativeRole.reconnectionLead === "A" ? names[0] : names[1],
            headline: `${names[0]}님과 ${names[1]}님의 주도성 및 소통 역할`,
          };
        }
        break;

      case "ch04_play_travel":
        narrativeText =
          deep?.section_4_friend_frames?.travel_teamwork ??
          "함께 약속을 잡거나 여행을 갈 때 서로의 역할 분담과 주도성이 조화를 이룹니다.";
        if (hiddenFlow?.travel_style) {
          v1Assets.travelStyle = hiddenFlow.travel_style;
        }
        if (coverage?.travelPlayRole) {
          coverageCards.travelPlayRole = {
            ideaCreator: coverage.travelPlayRole.ideaCreator === "A" ? names[0] : names[1],
            practicalExecutor: coverage.travelPlayRole.practicalExecutor === "A" ? names[0] : names[1],
            energyPace: coverage.travelPlayRole.energyPace,
            headline: "놀 때 우리는 어떤 팀인가?",
          };
        }
        break;

      case "ch05_communication_third_person":
        narrativeText =
          deep?.section_4_friend_frames?.counseling_mismatch ??
          "고민을 나눌 때 한 사람은 진심 어린 공감을, 다른 사람은 명확한 방향 제시를 해줍니다.";
        if (hiddenFlow?.counseling_style_a) {
          v1Assets.counseling = pickViewerFirstPair(
            hiddenFlow.counseling_style_a,
            hiddenFlow.counseling_style_b,
            viewerIsReportA,
          );
        }
        if (coverage?.thirdPersonExclusion) {
          coverageCards.thirdPersonExclusion = {
            category: coverage.thirdPersonExclusion.category,
            allowedClaim: coverage.thirdPersonExclusion.allowedClaim,
            forbiddenClaim: coverage.thirdPersonExclusion.forbiddenClaim,
            headline: "제3자 다자간 모임 시 소외/비교 다이내믹",
          };
        }
        break;

      case "ch06_conflict_repair":
        narrativeText =
          deep?.section_5_action?.together ??
          "서운함이 생기거나 오해가 쌓일 때 빠르게 마음을 풀고 회복하는 체계적인 해독제가 존재합니다.";
        if (deEscalation) {
          v1Assets.deEscalation = deEscalation;
        }
        break;

      case "ch07_expectation_boundaries":
        narrativeText =
          "서로의 다른 기질을 인정하고, 이 관계에서 기대하지 말아야 할 경계를 정리하면 더욱 오래 편안합니다.";
        if (breakupGuide) {
          v1Assets.warnings = pickViewerFirstPair(
            breakupGuide.trigger_warning_a,
            breakupGuide.trigger_warning_b,
            viewerIsReportA,
          );
        }
        break;

      case "ch08_distance_durability":
        narrativeText =
          deep?.section_4_friend_frames?.distance_resilience ??
          "자주 보지 않아도 오랫동안 변함없는 신뢰를 유지할 수 있는 강한 내구성을 가진 관계입니다.";
        if (soulmate?.verdict) {
          v1Assets.soulmateVerdict = soulmate.verdict;
        }
        if (coverage?.distanceProfile) {
          coverageCards.distanceProfile = {
            category: coverage.distanceProfile.category,
            label: coverage.distanceProfile.label,
            headline: "거리감 & 장기 우정 내구성 프로필",
          };
        }
        break;

      case "ch09_action_playbook":
        narrativeText =
          "두 분의 우정을 더 가치 있고 오래도록 지켜나가기 위한 실전 맞춤 수칙입니다.";
        if (prescriptions) {
          v1Assets.prescriptions = prescriptions;
        }
        break;
    }

    return {
      chapterKey: ch.chapterKey,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      userQuestion: ch.userQuestion,
      narrativeGoal: ch.narrativeGoal,
      narrativeText,
      discrepancyNote: storyPlan.llmHandoffPayload?.discrepancyNotes?.join(" / ") ?? null,
      v1Assets,
      coverageCards,
    };
  });
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
    () => buildWhyYouMeUsSection(report, viewerIsReportA, names, locale ?? "ko-KR"),
    () => buildCompareTableSection(report, locale ?? "ko-KR", t),
    () => buildPsychRadarSection(report, viewerIsReportA, t, names, locale ?? "ko-KR"),
    () => buildSocialDnaSection(report, viewerIsReportA, t),
    () => buildSoulmateSection(report, t),
    () => buildPlayMoneySection(report, locale ?? "ko-KR", t),
    () => buildHiddenFlowSection(report, viewerIsReportA, locale ?? "ko-KR", t),
    () => buildDeepReadSection(report, viewerIsReportA, t),
    () => buildBreakupGuideSection(report, viewerIsReportA, t),
    () => buildDeEscalationSection(report, t),
    () => buildPrescriptionSection(report, t),
  ];

  const sections = builders
    .map((build) => build())
    .filter((section): section is FriendReportSection => section != null);

  const chapters = buildFriendChapterViewModels(report, params);

  return {
    kind: "friendship",
    opening: buildOpening(report, names),
    sections,
    chapters,
    storyPlan: report.meta?.canonical_story_plan,
    raw: { report },
  };
}
