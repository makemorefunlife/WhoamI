import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
import { buildFriendPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFriendPsychMatch";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonCoreRelationMeta,
  type PersonCoreRelationMetaPayload,
} from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildFriendRuleContext } from "./buildFriendRuleContext";
import { buildFriendSnapshotPanel } from "./buildFriendSnapshotPanel";
import { buildFriendSocialReport } from "./friendReportTemplate";
import { buildFriendSajuCompareTable } from "./friendSajuCompareTable";
import { buildFriendPrescriptions } from "./buildFriendPrescriptions";
import type { FriendPrescriptionPack } from "./friendPrescriptionTypes";
import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";
import {
  resolveFriendSignatureClause,
  resolveFriendVibeAxisNotes,
  resolveGuardianCharacterForPerson,
  resolveCommunicationRhythmNote,
  resolveTravelStyleSplit,
  refineTravelStyleSplit,
  resolveCounselingStyleForPerson,
  resolveTreasurerConfirmNote,
  resolveJealousyGuardNote,
  resolveReconciliationScript,
  refineFriendTreasurer,
} from "./friendPsychFit";
import { buildFriendTreasurerCanonical } from "./friendTreasurerCanonical";
import {
  buildFriendContextOutput,
  type FriendContextOutput,
} from "./friendContextOutput";

export type FriendReportBody = {
  headline: string;
  summary_line: string;
  one_line_friendship: string;
  snapshot_panel: TriScoreSnapshotPanel;
  friend: ReturnType<typeof buildFriendSocialReport>;
  meta: {
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    connection_pct: number;
    banter_pct: number;
    risk_pct: number;
    nickname_a: string;
    nickname_b: string;
    person_core?: PersonCoreRelationMetaPayload;
    psych_match?: PsychMatchResult | null;
    psych_lens?: DomainPsychLens | null;
    /** pair.friendship 교차 신호 기반 실행 처방전 */
    prescription_friendship?: FriendPrescriptionPack;
  };
  /**
   * Context Output — 이미 계산된 ctx/friend 재포장.
   * 옵셔널·순수 추가. 클라이언트 응답에서는 strip/omit으로 제거.
   */
  context_output?: FriendContextOutput;
};

export function buildFriendReport(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
  pairFriendship?: PairFriendshipSignals | null;
  /** PersonCore bake-in 명리 신호(년월 궁합·조후·비겁고립) — Social DNA SSOT */
  friendSignalsA?: FriendshipSajuSignals;
  friendSignalsB?: FriendshipSajuSignals;
  locale?: Locale;
}): FriendReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildFriendRuleContext({ ...params, locale });
  const friendBase = buildFriendSocialReport(ctx);

  // Part1 — 11축(psychMaster) 확인/보정. computeFriendMasterScores 숫자 자체는
  // grade/eventScores에도 쓰여 영향 범위가 넓으므로 안 건드리고, 문구만 덧붙인다.
  const signatureClause = resolveFriendSignatureClause(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );
  const vibeAxisNotes = resolveFriendVibeAxisNotes(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );
  const oneLineFriendship = signatureClause
    ? `${friendBase.section_snapshot.one_line_friendship} ${signatureClause}`
    : friendBase.section_snapshot.one_line_friendship;

  // Part2① Social DNA 귀인캐릭터, Part2② 대화템포 — 11축 결합.
  const guardianA = resolveGuardianCharacterForPerson(ctx.tenGodsA, params.psychMasterA, locale);
  const guardianB = resolveGuardianCharacterForPerson(ctx.tenGodsB, params.psychMasterB, locale);
  const commRhythmNote = resolveCommunicationRhythmNote(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );

  // Part3① 여행동선, Part3③ F/T형 — 완전 신규. Part3② 더치페이 — 기존 재성 판정에 11축 확인만 추가.
  const travelBase = resolveTravelStyleSplit(
    params.psychMasterA,
    params.psychMasterB,
    params.nicknameA,
    params.nicknameB,
    locale,
  );
  const travelStyle = refineTravelStyleSplit({
    base: travelBase,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    batteryModeA: ctx.friendPairAnalysis.dnaA.batteryMode,
    batteryModeB: ctx.friendPairAnalysis.dnaB.batteryMode,
    tikitakaModeA: ctx.friendPairAnalysis.dnaA.tikitakaMode,
    tikitakaModeB: ctx.friendPairAnalysis.dnaB.tikitakaMode,
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    locale,
  });
  const counselingA = resolveCounselingStyleForPerson(ctx.tenGodsA, params.psychMasterA, locale);
  const counselingB = resolveCounselingStyleForPerson(ctx.tenGodsB, params.psychMasterB, locale);
  const baseMoney = friendBase.section_play_money;
  const treasurerBase = {
    nickname: baseMoney.treasurer_nickname,
    reason: baseMoney.treasurer_reason,
  };
  // Phase 6-2b — pick (in base sections) → refine once → wrap → persist .value
  const refinedTreasurer = refineFriendTreasurer({
    baseNickname: treasurerBase.nickname,
    baseReason: treasurerBase.reason,
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: ctx.tenGodsA,
    countsB: ctx.tenGodsB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });
  const treasurerCanonical = buildFriendTreasurerCanonical(refinedTreasurer, {
    base: treasurerBase,
  });
  const treasurerFinal = treasurerCanonical?.value ?? refinedTreasurer;
  const treasurerIsA = treasurerFinal.nickname === params.nicknameA;
  const treasurerNote = resolveTreasurerConfirmNote(
    treasurerIsA ? params.psychMasterA : params.psychMasterB,
    locale,
  );

  // Part4① 질투 방지 — 완전 신규. Part5① 화해 스위치 — 기존 카드에 11축 스크립트만 추가.
  const jealousyGuardA = resolveJealousyGuardNote(
    ctx.tenGodsA,
    params.psychMasterA,
    params.nicknameA,
    locale,
  );
  const jealousyGuardB = resolveJealousyGuardNote(
    ctx.tenGodsB,
    params.psychMasterB,
    params.nicknameB,
    locale,
  );
  const deEscUpsetIsA = friendBase.section_de_escalation.upset_nickname === params.nicknameA;
  const reconciliationScript = resolveReconciliationScript(
    deEscUpsetIsA ? params.psychMasterA : params.psychMasterB,
    deEscUpsetIsA ? params.nicknameA : params.nicknameB,
    locale,
  );

  const snapshot_panel = buildFriendSnapshotPanel(
    ctx,
    {
      gaugeLabel: pick(locale, "Social DNA · Friendship Snapshot", "Social DNA · 우정 스냅샷"),
      representativeLine: oneLineFriendship,
    },
    {
      psychA: params.psychMasterA ?? null,
      psychB: params.psychMasterB ?? null,
    },
  );

  const personCoreMeta = buildPersonCoreRelationMeta(params);
  const psychBundle = buildFriendPsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );

  const friend = {
    ...friendBase,
    section_snapshot: {
      ...friendBase.section_snapshot,
      one_line_friendship: oneLineFriendship,
      vibe_axis_notes: vibeAxisNotes,
    },
    section_social_dna_a: {
      ...friendBase.section_social_dna_a,
      guardian_character: guardianA,
    },
    section_social_dna_b: {
      ...friendBase.section_social_dna_b,
      guardian_character: guardianB,
    },
    section_play_money: {
      ...baseMoney,
      treasurer_nickname: treasurerFinal.nickname,
      treasurer_reason: treasurerFinal.reason,
      psych_confirm_note: treasurerNote,
      ...(treasurerFinal.align
        ? { treasurer_align: treasurerFinal.align }
        : {}),
      ...(treasurerFinal.confidence
        ? { treasurer_confidence: treasurerFinal.confidence }
        : {}),
    },
    section_hidden_flow: {
      travel_style: travelStyle,
      counseling_style_a: counselingA,
      counseling_style_b: counselingB,
    },
    section_breakup_guide: {
      ...friendBase.section_breakup_guide,
      jealousy_guard_a: jealousyGuardA,
      jealousy_guard_b: jealousyGuardB,
    },
    section_de_escalation: {
      ...friendBase.section_de_escalation,
      reconciliation_script: reconciliationScript,
    },
    section_compare_table: buildFriendSajuCompareTable({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      tenGodsA: ctx.tenGodsA,
      tenGodsB: ctx.tenGodsB,
      dnaA: ctx.friendPairAnalysis.dnaA,
      dnaB: ctx.friendPairAnalysis.dnaB,
      chartA: ctx.friendPairAnalysis.chartA,
      chartB: ctx.friendPairAnalysis.chartB,
      locale,
    }).map((row) =>
      row.id === "communication_rhythm" ? { ...row, psych_note: commRhythmNote } : row,
    ),
  };

  const prescription_friendship = params.pairFriendship
    ? buildFriendPrescriptions({
        pair: params.pairFriendship,
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
        locale,
      })
    : undefined;

  return {
    headline: oneLineFriendship,
    summary_line: `🔥 ${ctx.masterScores.connection}% · 🧩 ${ctx.masterScores.banter}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_friendship: oneLineFriendship,
    snapshot_panel,
    friend,
    meta: {
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      connection_pct: ctx.masterScores.connection,
      banter_pct: ctx.masterScores.banter,
      risk_pct: ctx.masterScores.risk,
      nickname_a: ctx.nicknameA,
      nickname_b: ctx.nicknameB,
      ...(personCoreMeta ? { person_core: personCoreMeta } : {}),
      ...(psychBundle
        ? {
            psych_match: psychBundle.psych_match,
            psych_lens: psychBundle.psych_lens,
          }
        : {}),
      ...(prescription_friendship ? { prescription_friendship } : {}),
    },
    context_output: buildFriendContextOutput(ctx, friend, {
      personCoreMeta: params.personCoreMeta,
    }),
  };
}
