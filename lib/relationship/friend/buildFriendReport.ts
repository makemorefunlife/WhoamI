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
import { buildFriendPrescriptions } from "./buildFriendPrescriptions";
import type { FriendPrescriptionPack } from "./friendPrescriptionTypes";
import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";

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
}): FriendReportBody {
  const ctx = buildFriendRuleContext(params);
  const friend = buildFriendSocialReport(ctx);

  const snapshot_panel = buildFriendSnapshotPanel(
    ctx,
    {
      gaugeLabel: "Social DNA · 우정 스냅샷",
      representativeLine: friend.section_snapshot.one_line_friendship,
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
  );

  const prescription_friendship = params.pairFriendship
    ? buildFriendPrescriptions({
        pair: params.pairFriendship,
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
      })
    : undefined;

  return {
    headline: friend.section_snapshot.one_line_friendship,
    summary_line: `🔥 ${ctx.masterScores.connection}% · 🧩 ${ctx.masterScores.banter}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_friendship: friend.section_snapshot.one_line_friendship,
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
