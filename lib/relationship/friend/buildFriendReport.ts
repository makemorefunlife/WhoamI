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
import { resolveFriendSignatureClause, resolveFriendVibeAxisNotes } from "./friendPsychFit";

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
    }),
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
  };
}
