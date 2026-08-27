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
import { buildFriendScoreCardAudit } from "@/lib/relationship/enrichment/friendScoreCardAudit";
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";
import type {
  OpeningBlock,
  FriendReportSection,
  FriendReportViewModel,
  FriendChapterViewModel,
} from "./friendReportSectionTypes";
import type { FriendCompareRow } from "@/lib/relationship/friend/friendSajuCompareTable";
import { buildDeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
import { buildFriendWhyYouMeUs } from "@/lib/relationship/friend/buildFriendWhyYouMeUs";
import {
  deriveIndividualFriendCharacter,
  deriveDirectionalFriendValue,
  derivePairFriendshipIdentity,
} from "@/lib/relationship/friend/friendCharacterEngine";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { buildChartContext } from "@/lib/saju/chartContext";
import { countTenGodsForMarriage } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { resolveTravelPlayEnergyPaceCopy } from "@/lib/relationship/friend/chapters/friendChapter04TeamPlay";
import {
  buildFriendChapter04Blocks,
  buildFriendChapter05Blocks,
  buildFriendChapter06Blocks,
  buildFriendChapter07Blocks,
  buildFriendChapter08Blocks,
} from "@/lib/relationship/friend/chapters/friendChapterVNextBlocksAdapter";

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
  locale: Locale = "ko-KR",
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
    scoreCardAudit: (() => {
      const rawAudit = f.section_snapshot.score_card_audit;
      const isLegacyAudit = Boolean(
        !rawAudit ||
          rawAudit.connection?.why?.includes("사주") ||
          rawAudit.connection?.why?.includes("결이 비슷하다") ||
          rawAudit.banter?.why?.includes("중간 기본값(50%)") ||
          rawAudit.risk?.why?.includes("주된 이유")
      );

      if (!isLegacyAudit) return rawAudit ?? null;

      const conn = f.section_snapshot.connection_pct ?? 50;
      const bant = f.section_snapshot.banter_pct ?? 50;
      const rsk = f.section_snapshot.risk_pct ?? 10;

      const sig: FriendScoringSignals = {
        hasDayBranchCombine: conn === 100 || conn === 80 || conn === 60,
        hasBijiepMutualResonance: conn === 100 || conn === 70,
        hasDayBranchChungHyung: conn === 60 || conn === 30,
        hasFoodSealHarmony: bant === 100 || bant === 75 || bant === 55,
        hasJohuComplement: bant === 100,
        hasFoodClashFriction: bant === 55 || bant === 30,
        hasDayBranchFullTension: rsk === 85 || rsk === 70 || rsk === 60 || rsk === 45,
        hasWonjinOrGuimun: rsk === 85 || rsk === 70 || rsk === 50 || rsk === 35,
        hasWealthOfficerClash: rsk === 85 || rsk === 60 || rsk === 50 || rsk === 25,
        hasDayStemMutualSupport: false,
      };

      return buildFriendScoreCardAudit({
        sig,
        scores: { connection: conn, banter: bant, risk: rsk },
        nameA: report.friend?.section_social_dna_a?.nickname ?? "A",
        nameB: report.friend?.section_social_dna_b?.nickname ?? "B",
        psychMasterA: report.meta?.psych_master_a,
        psychMasterB: report.meta?.psych_master_b,
        locale,
      });
    })(),
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
  locale: Locale = "ko-KR",
): FriendReportSection | null {
  const f = report.friend;
  if (!f?.section_social_dna_a || !f?.section_social_dna_b) return null;

  let dnaA = f.section_social_dna_a;
  let dnaB = f.section_social_dna_b;

  const isLegacyA =
    !dnaA.four_slot_profile ||
    !dnaA.situation_snapshots ||
    !dnaA.pair_synthesis ||
    dnaA.social_title.includes("파티 히어로") ||
    dnaA.social_title.includes("아지트 수호자") ||
    dnaA.social_title.includes("버팀목 친구") ||
    dnaA.social_title.includes("현실 해결사") ||
    dnaA.social_title.includes("침묵 아지트파");

  if (isLegacyA) {
    const canonicalA = report.meta?.canonical_bundle?.personalA;
    const canonicalB = report.meta?.canonical_bundle?.personalB;

    // No-fake-data invariant: this used to fall back to a hardcoded dummy
    // chart (fixed stems/branches, not derived from either person's real
    // birth data) whenever both the canonical projection and context_output
    // chart sources were absent. Removed — if no real chart is recoverable,
    // chartA/chartB stay null, the `if (chartA && chartB)` guard below skips
    // the DNA regeneration, and dnaA/dnaB simply keep whatever real (if
    // old-shaped) content report.friend.section_social_dna_a/b already had.
    const chartA =
      canonicalA?.chart ??
      (report.context_output?.chart_a ? buildChartContext(sajuJsonToPillars(report.context_output.chart_a)) : null);
    const chartB =
      canonicalB?.chart ??
      (report.context_output?.chart_b ? buildChartContext(sajuJsonToPillars(report.context_output.chart_b)) : null);
    const tenGodsA =
      canonicalA?.tenGods ??
      (report.context_output?.saju_json_a ? countTenGodsForMarriage(report.context_output.saju_json_a) : {});
    const tenGodsB =
      canonicalB?.tenGods ??
      (report.context_output?.saju_json_b ? countTenGodsForMarriage(report.context_output.saju_json_b) : {});

    if (chartA && chartB) {
      const indA = deriveIndividualFriendCharacter({
        chart: chartA,
        tenGods: tenGodsA,
        psych: report.meta?.psych_master_a,
        locale,
      });
      const indB = deriveIndividualFriendCharacter({
        chart: chartB,
        tenGods: tenGodsB,
        psych: report.meta?.psych_master_b,
        locale,
      });
      const valAtoB = deriveDirectionalFriendValue({
        giverName: report.meta?.nickname_a || "A",
        receiverName: report.meta?.nickname_b || "B",
        giverCharacter: indA,
        receiverChart: chartB,
        receiverTenGods: tenGodsB,
        receiverPsych: report.meta?.psych_master_b,
        locale,
      });
      const valBtoA = deriveDirectionalFriendValue({
        giverName: report.meta?.nickname_b || "B",
        receiverName: report.meta?.nickname_a || "A",
        giverCharacter: indB,
        receiverChart: chartA,
        receiverTenGods: tenGodsA,
        receiverPsych: report.meta?.psych_master_a,
        locale,
      });
      const pairIdentity = derivePairFriendshipIdentity({
        nameA: report.meta?.nickname_a || "A",
        nameB: report.meta?.nickname_b || "B",
        valAtoB,
        valBtoA,
        locale,
      });

      dnaA = {
        ...dnaA,
        social_title: indA.characterTitle,
        friend_position: indA.individualExplanation,
        situation_snapshots: indA.situationSnapshots,
        four_slot_profile: indA.fourSlotProfile,
        guardian_character: {
          key: indA.expressionVariant,
          label: valAtoB.roleTitle,
          description: valAtoB.roleDescription,
        },
        pair_synthesis: {
          label: pairIdentity.pairTitle,
          lineAtoB: pairIdentity.lineAtoB,
          lineBtoA: pairIdentity.lineBtoA,
          description: pairIdentity.pairSynthesisDescription,
        },
      };

      dnaB = {
        ...dnaB,
        social_title: indB.characterTitle,
        friend_position: indB.individualExplanation,
        situation_snapshots: indB.situationSnapshots,
        four_slot_profile: indB.fourSlotProfile,
        guardian_character: {
          key: indB.expressionVariant,
          label: valBtoA.roleTitle,
          description: valBtoA.roleDescription,
        },
      };
    }
  }

  const dna = pickViewerFirstPair(dnaA, dnaB, viewerIsReportA);
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

function resolveRoleDisplayName(
  role: string | undefined | null,
  nameA: string,
  nameB: string,
  isKo = true,
): string {
  if (!role) return isKo ? "상황에 따라 유연함" : "Flexible by situation";
  const upper = String(role).trim().toUpperCase();
  if (upper === "A" || upper.startsWith("A_") || upper.startsWith("A-")) return isKo ? `${nameA}님` : nameA;
  if (upper === "B" || upper.startsWith("B_") || upper.startsWith("B-")) return isKo ? `${nameB}님` : nameB;
  if (upper.includes("BALANCED") || upper.includes("SYMMETRICAL") || upper.includes("EQUAL")) {
    return isKo ? "둘 다 비슷함 (상호 대등)" : "Balanced (Mutual)";
  }
  if (upper.includes("BOTH") || upper.includes("SHARED")) {
    return isKo ? `${nameA}님 & ${nameB}님 (함께 주도)` : `${nameA} & ${nameB} (Joint Lead)`;
  }
  if (upper.includes("NEITHER") || upper.includes("INSUFFICIENT") || upper.includes("LOW_CONFIDENCE")) {
    return isKo ? "자연스러운 흐름에 맡김" : "Spontaneous Flow";
  }
  return role;
}

function resolveThirdPersonHumanCopy(
  cat: string,
  allowed?: string,
  forbidden?: string,
  isKo = true,
) {
  const upper = (cat ?? "").toUpperCase();
  let title = isKo ? "여러 사람 속에서도 안정적인 조합" : "Stable even in group settings";
  let situationNote = isKo
    ? "다자간 모임에서도 서로의 영역을 존중하며 편안하게 어울릴 수 있습니다."
    : "Comfortable interacting in group settings with mutual respect.";
  let recommendationNote = isKo
    ? "모임 후 둘만의 짧은 인사나 톡으로 친밀감을 다지면 더욱 단단해집니다."
    : "A quick 1-on-1 check-in after group events reinforces your bond.";

  if (
    upper.includes("EXCLUSIVE") ||
    upper.includes("1_ON_1") ||
    upper.includes("DYADIC") ||
    upper.includes("PAIR_FOCUSED")
  ) {
    title = isKo ? "단둘이 있을 때 더 깊어지는 조합" : "Deepest in 1-on-1 settings";
    situationNote = isKo
      ? "여럿이 모인 북적거리는 모임보다는 단둘이 차분하게 대화할 때 서로의 매력과 케미가 배가됩니다."
      : "Your unique chemistry shines brightest in quiet 1-on-1 conversations.";
    recommendationNote = isKo
      ? "다자간 모임 시 소외감을 느끼지 않도록 배려하고, 소소한 둘만의 약속을 별도로 챙기세요."
      : "Be mindful during group events and maintain separate 1-on-1 hangouts.";
  } else if (
    upper.includes("EXCLUSION") ||
    upper.includes("SENSITIVE") ||
    upper.includes("TRIAD") ||
    upper.includes("RISK")
  ) {
    title = isKo
      ? "특정 상황에서 소외감에 민감할 수 있는 조합"
      : "Sensitive to exclusion in certain group dynamics";
    situationNote = isKo
      ? "제3자가 동석할 때 대화의 주도권이나 친밀도 차이로 인해 서운함이 생길 수 있습니다."
      : "Dynamic shifts when a third person is present can create subtle feelings of isolation.";
    recommendationNote = isKo
      ? "모임 대화 속에서 자연스럽게 상대방을 언급하고 대화에 참여시켜 주는 센스가 도움이 됩니다."
      : "Actively include each other in group conversations to preserve trust.";
  }

  return {
    humanTitle: title,
    situationNote: allowed && allowed.length > 5 ? allowed : situationNote,
    recommendationNote: forbidden && forbidden.length > 5 ? forbidden : recommendationNote,
  };
}

function resolveDistanceHumanCopy(
  cat: string,
  label: string,
  isKo = true,
) {
  const upper = (cat ?? "").toUpperCase();
  let verdictTitle = isKo
    ? "자주 보지 않아도 신뢰가 유지되는 저빈도 고신뢰 우정"
    : "Low frequency, high trust durable friendship";
  let rhythmAdvice = isKo
    ? "한동안 연락이 끊겨도 서운해하지 않고 언제든 편하게 다시 연락할 수 있습니다."
    : "Even after long intervals, you can reconnect without awkwardness or resentment.";
  let meetingFrequencyNeed = isKo
    ? "월 1회 이하의 듬성듬성한 만남으로도 호감이 지속되는 강한 내구성"
    : "Durable bond that thrives even with monthly or occasional meetups";

  if (upper.includes("HIGH_FREQ") || upper.includes("DAILY") || upper.includes("CLOSE_CONTACT")) {
    verdictTitle = isKo
      ? "일상의 소소한 템포를 자주 공유할 때 에너지가 생기는 밀착형 우정"
      : "Close-contact friendship energized by frequent sharing";
    rhythmAdvice = isKo
      ? "주기적인 안부 톡과 가벼운 일상 공유가 관계의 온도를 높여줍니다."
      : "Regular check-ins and casual daily shares keep your bond warm.";
    meetingFrequencyNeed = isKo
      ? "자주 보고 대화할수록 서로의 유대감이 더욱 견고해지는 스타일"
      : "Frequent contact and hangouts build a stronger sense of intimacy.";
  }

  return {
    verdictTitle: label && label.length > 4 ? label : verdictTitle,
    rhythmAdvice,
    meetingFrequencyNeed,
  };
}

function buildFriendChapterViewModels(
  report: FriendReportBody,
  params: BuildFriendReportViewModelParams,
): FriendChapterViewModel[] | undefined {
  const storyPlan = report.meta?.canonical_story_plan;
  if (!storyPlan || !storyPlan.chapters?.length) return undefined;

  const coverage = report.meta?.canonical_bundle?.coverage;
  const responseIntelligence = report.meta?.canonical_bundle?.responseIntelligence;
  const deep = report.meta?.friend_saju_deep;
  const loc = params.locale ?? "ko-KR";
  const isKo = loc !== "en-US";
  const { viewerIsReportA, myName, partnerName } = params;
  const names: [string, string] = [myName, partnerName];
  const nameA = viewerIsReportA ? myName : partnerName;
  const nameB = viewerIsReportA ? partnerName : myName;

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
    let vNextBlocks: FriendChapterViewModel["vNextBlocks"] = undefined;

    switch (ch.chapterKey) {
      case "ch01_why_us":
        narrativeText =
          deep?.section_1_spark?.spark_narrative ??
          (whyUsData?.summaryLine ??
            (isKo
              ? "서로가 가진 고유한 에너지와 대화 스타일이 자연스럽게 맞아떨어지는 우정입니다."
              : "This is a friendship where your natural energy and conversational styles simply click."));
        v1Assets.whyYouMeUs = whyUsData;
        break;

      case "ch02_who_we_are":
        narrativeText =
          deep?.section_2_nature?.a_nature ??
          (isKo
            ? `${names[0]}님과 ${names[1]}님은 서로의 부족한 점을 채우고 든든하게 받쳐주는 수호군 형태의 관계입니다.`
            : `${names[0]} and ${names[1]} have a guardian-style friendship — you fill in each other's gaps and back each other up.`);
        if (socialDnaA && socialDnaB) {
          v1Assets.socialDnaMe = viewerIsReportA ? socialDnaA : socialDnaB;
          v1Assets.socialDnaPartner = viewerIsReportA ? socialDnaB : socialDnaA;
        }
        break;

      case "ch03_social_dna_tempo": {
        narrativeText =
          deep?.section_3_tempo?.tempo_narrative ??
          (isKo
            ? "연락의 빈도보다는 대화가 이어질 때 느껴지는 편안한 티키타카와 소통 템포가 핵심입니다."
            : "What matters most isn't how often you're in touch — it's the easy back-and-forth rhythm you fall into whenever you do talk.");
        const initiativeHeadline = isKo
          ? `${names[0]}님과 ${names[1]}님의 주도성 및 소통 역할`
          : `${names[0]} and ${names[1]}'s roles in initiative and communication`;
        if (coverage?.initiativeRole) {
          coverageCards.initiativeRole = {
            contactInitiator: resolveRoleDisplayName(coverage.initiativeRole.contactInitiator, nameA, nameB, isKo),
            planningLead: resolveRoleDisplayName(coverage.initiativeRole.planningLead, nameA, nameB, isKo),
            reconnectionLead: resolveRoleDisplayName(coverage.initiativeRole.reconnectionLead, nameA, nameB, isKo),
            headline: initiativeHeadline,
          };
        } else {
          coverageCards.initiativeRole = {
            contactInitiator: resolveRoleDisplayName("BALANCED", nameA, nameB, isKo),
            // No real coverage data for this pair — reuse the function's own
            // "insufficient evidence" fallback instead of fabricating which
            // person leads planning.
            planningLead: resolveRoleDisplayName(undefined, nameA, nameB, isKo),
            reconnectionLead: resolveRoleDisplayName("BOTH", nameA, nameB, isKo),
            headline: initiativeHeadline,
          };
        }
        break;
      }

      case "ch04_play_travel": {
        narrativeText =
          deep?.section_4_friend_frames?.travel_teamwork ??
          (isKo
            ? "함께 약속을 잡거나 여행을 갈 때 서로의 역할 분담과 주도성이 조화를 이룹니다."
            : "When making plans or traveling together, your roles and initiative naturally balance each other out.");
        if (hiddenFlow?.travel_style) {
          v1Assets.travelStyle = hiddenFlow.travel_style;
        }
        const travelHeadline = isKo ? "놀 때 우리는 어떤 팀인가?" : "What kind of team are we when we're having fun?";
        if (coverage?.travelPlayRole) {
          const energyPaceCopy = resolveTravelPlayEnergyPaceCopy(coverage.travelPlayRole.energyPace, loc);
          coverageCards.travelPlayRole = {
            ideaCreator: resolveRoleDisplayName(coverage.travelPlayRole.ideaCreator, nameA, nameB, isKo),
            practicalExecutor: resolveRoleDisplayName(coverage.travelPlayRole.practicalExecutor, nameA, nameB, isKo),
            // Never pass the raw enum (e.g. "balanced_exploration") through —
            // always translate to human copy first.
            energyPace: `${energyPaceCopy.headline} — ${energyPaceCopy.description}`,
            headline: travelHeadline,
          };
        } else {
          coverageCards.travelPlayRole = {
            // No real coverage data for this pair — reuse the function's own
            // "insufficient evidence" fallback instead of fabricating which
            // person leads ideas/execution.
            ideaCreator: resolveRoleDisplayName(undefined, nameA, nameB, isKo),
            practicalExecutor: resolveRoleDisplayName(undefined, nameA, nameB, isKo),
            energyPace: isKo ? "보폭이 잘 맞고 일정에 유연한 팀워크" : "Flexible energy pace",
            headline: travelHeadline,
          };
        }
        if (coverage?.initiativeRole && coverage?.travelPlayRole) {
          vNextBlocks = buildFriendChapter04Blocks({
            initiative: coverage.initiativeRole,
            travelPlay: coverage.travelPlayRole,
            nameA, nameB, locale: loc,
          });
        }
        break;
      }

      case "ch05_communication_third_person":
        narrativeText =
          deep?.section_4_friend_frames?.counseling_mismatch ??
          (isKo
            ? "고민을 나눌 때 한 사람은 진심 어린 공감을, 다른 사람은 명확한 방향 제시를 해줍니다."
            : "When sharing what's on your mind, one of you tends to offer heartfelt empathy while the other gives clear direction.");
        if (hiddenFlow?.counseling_style_a) {
          v1Assets.counseling = pickViewerFirstPair(
            hiddenFlow.counseling_style_a,
            hiddenFlow.counseling_style_b,
            viewerIsReportA,
          );
        }
        {
          const thirdPerson = coverage?.thirdPersonExclusion;
          const humanCopy = resolveThirdPersonHumanCopy(
            thirdPerson?.category ?? "STABLE_GROUP",
            thirdPerson?.allowedClaim,
            thirdPerson?.forbiddenClaim,
            isKo,
          );
          coverageCards.thirdPersonExclusion = {
            category: thirdPerson?.category ?? "STABLE_GROUP",
            allowedClaim: thirdPerson?.allowedClaim ?? humanCopy.situationNote,
            forbiddenClaim: thirdPerson?.forbiddenClaim ?? humanCopy.recommendationNote,
            headline: isKo ? "제3자 다자간 모임 시 소외/비교 다이내믹" : "Group-setting dynamics: exclusion & comparison",
            humanTitle: humanCopy.humanTitle,
            situationNote: humanCopy.situationNote,
            recommendationNote: humanCopy.recommendationNote,
          };
        }
        if (responseIntelligence) {
          vNextBlocks = buildFriendChapter05Blocks({
            intel: responseIntelligence, nameA, nameB, locale: loc,
          });
        }
        break;

      case "ch06_conflict_repair":
        narrativeText =
          deep?.section_5_action?.together ??
          (isKo
            ? "서운함이 생기거나 오해가 쌓일 때 빠르게 마음을 풀고 회복하는 체계적인 해독제가 존재합니다."
            : "When hurt feelings or misunderstandings build up, you have a reliable way of clearing the air and bouncing back quickly.");
        if (deEscalation) {
          v1Assets.deEscalation = deEscalation;
        }
        if (responseIntelligence) {
          vNextBlocks = buildFriendChapter06Blocks({ intel: responseIntelligence, nameA, nameB, locale: loc });
        }
        break;

      case "ch07_expectation_boundaries":
        narrativeText = isKo
          ? "서로의 다른 기질을 인정하고, 이 관계에서 기대하지 말아야 할 경계를 정리하면 더욱 오래 편안합니다."
          : "Recognizing your different temperaments and being clear about what not to expect from each other keeps this friendship comfortable for the long run.";
        if (breakupGuide) {
          v1Assets.warnings = pickViewerFirstPair(
            breakupGuide.trigger_warning_a,
            breakupGuide.trigger_warning_b,
            viewerIsReportA,
          );
        }
        if (responseIntelligence) {
          vNextBlocks = buildFriendChapter07Blocks({ intel: responseIntelligence, nameA, nameB, locale: loc });
        }
        break;

      case "ch08_distance_durability":
        narrativeText =
          deep?.section_4_friend_frames?.distance_resilience ??
          (isKo
            ? "자주 보지 않아도 오랫동안 변함없는 신뢰를 유지할 수 있는 강한 내구성을 가진 관계입니다."
            : "This friendship has real staying power — the trust holds steady even through long stretches without seeing each other.");
        if (soulmate?.verdict) {
          v1Assets.soulmateVerdict = soulmate.verdict;
        }
        {
          const dist = coverage?.distanceProfile;
          const humanCopy = resolveDistanceHumanCopy(
            dist?.category ?? "LOW_FREQ_HIGH_TRUST",
            dist?.label ?? (isKo ? "저빈도 고신뢰 우정" : "Low-frequency, high-trust friendship"),
            isKo,
          );
          coverageCards.distanceProfile = {
            category: dist?.category ?? "LOW_FREQ_HIGH_TRUST",
            label: dist?.label ?? humanCopy.verdictTitle,
            headline: isKo ? "거리감 & 장기 우정 내구성 프로필" : "Distance & long-term friendship durability profile",
            verdictTitle: humanCopy.verdictTitle,
            rhythmAdvice: humanCopy.rhythmAdvice,
            meetingFrequencyNeed: humanCopy.meetingFrequencyNeed,
          };
        }
        if (responseIntelligence) {
          vNextBlocks = buildFriendChapter08Blocks({ intel: responseIntelligence, nameA, nameB, locale: loc });
        }
        break;

      case "ch09_action_playbook":
        narrativeText = isKo
          ? "두 분의 우정을 더 가치 있고 오래도록 지켜나가기 위한 실전 맞춤 수칙입니다."
          : "Practical, tailored guidelines to help keep this friendship valuable and lasting.";
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
      vNextBlocks,
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
    () => buildSnapshotSection(report, t, locale ?? "ko-KR"),
    () => buildWhyYouMeUsSection(report, viewerIsReportA, names, locale ?? "ko-KR"),
    () => buildCompareTableSection(report, locale ?? "ko-KR", t),
    () => buildPsychRadarSection(report, viewerIsReportA, t, names, locale ?? "ko-KR"),
    () => buildSocialDnaSection(report, viewerIsReportA, t, locale ?? "ko-KR"),
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
