import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
import { buildFamilyPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFamilyPsychMatch";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonCoreRelationMeta,
  type PersonCoreRelationMetaPayload,
} from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildFamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentPairRoles, FamilyParentRole } from "./types";
import { buildFamilyParentSnapshotPanel } from "./buildFamilySnapshotPanel";
import {
  buildFamilyParentChildReport,
  type FamilyParentChildReport,
} from "./familyReportTemplate";
import { buildFamilyPrescriptions } from "./buildFamilyPrescriptions";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { Locale } from "@/lib/i18n/locale";
import type { FamilyPrescriptionPack } from "./familyPrescriptionTypes";
import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FamilySajuSignals, FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { buildFamilySajuCompareTable } from "./familySajuCompareTable";

export type FamilyParentReportBody = {
  headline: string;
  summary_line: string;
  one_line_family: string;
  snapshot_panel: TriScoreSnapshotPanel;
  family: FamilyParentChildReport;
  meta: {
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    bond_pct: number;
    synergy_pct: number;
    risk_pct: number;
    parent_role: FamilyParentRole;
    parent_type: FamilyParentRole;
    child_nickname: string;
    parent_nickname: string;
    nickname_a: string;
    nickname_b: string;
    person_core?: PersonCoreRelationMetaPayload;
    psych_match?: PsychMatchResult | null;
    psych_lens?: DomainPsychLens | null;
    /** pair.family 교차 신호 기반 실행 처방전 */
    prescription_family?: FamilyPrescriptionPack;
  };
};

export function buildFamilyParentReport(params: {
  nicknameA: string;
  nicknameB: string;
  roles: FamilyParentPairRoles;
  parentType?: FamilyParentRole;
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
  pairFamily?: PairFamilySignals | null;
  familySignalsA?: FamilySajuSignals;
  familySignalsB?: FamilySajuSignals;
  /** 006 로드맵 Step3 — 비교표 ⑥(대화온도)용. 없으면 해당 행만 neutral 폴백. */
  friendshipSignalsA?: FriendshipSajuSignals;
  friendshipSignalsB?: FriendshipSajuSignals;
  locale?: Locale;
  /** Part3 성장 터널 분석 연도. 생략 시 현재 연도. */
  analysisYear?: number;
}): FamilyParentReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildFamilyRuleContext({ ...params, locale });
  const family: FamilyParentChildReport = {
    ...buildFamilyParentChildReport(ctx),
    section_compare_table: buildFamilySajuCompareTable({
      parentNickname: ctx.parentNickname,
      childNickname: ctx.childNickname,
      countsParent: ctx.tenGod.countsParent,
      countsChild: ctx.tenGod.countsChild,
      chartParent: ctx.chartParent,
      chartChild: ctx.chartChild,
      friendshipSignalsParent: ctx.friendshipSignalsParent,
      friendshipSignalsChild: ctx.friendshipSignalsChild,
      familySignalsParent: ctx.familySignalsParent,
      familySignalsChild: ctx.familySignalsChild,
      pairFamily: params.pairFamily,
      parentRole: ctx.parentRole,
      locale,
    }),
  };

  const snapshot_panel = buildFamilyParentSnapshotPanel(
    ctx,
    {
      gaugeLabel: pick(locale, "Child DNA Playbook · Family Snapshot", "Child DNA Playbook · 패밀리 스냅샷"),
      representativeLine: family.section_snapshot.one_line_family,
    },
    {
      psychA: params.psychMasterA ?? null,
      psychB: params.psychMasterB ?? null,
    },
  );

  const personCoreMeta = buildPersonCoreRelationMeta(params);
  const psychBundle = buildFamilyPsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );

  const prescription_family = params.pairFamily
    ? buildFamilyPrescriptions({
        pair: params.pairFamily,
        parentNickname: ctx.parentNickname,
        childNickname: ctx.childNickname,
        locale,
      })
    : undefined;

  return {
    headline: family.section_snapshot.one_line_family,
    summary_line: `🔥 ${ctx.masterScores.bond}% · 🧩 ${ctx.masterScores.synergy}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_family: family.section_snapshot.one_line_family,
    snapshot_panel,
    family,
    meta: {
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      bond_pct: ctx.masterScores.bond,
      synergy_pct: ctx.masterScores.synergy,
      risk_pct: ctx.masterScores.risk,
      parent_role: ctx.parentRole,
      parent_type: ctx.parentType,
      child_nickname: ctx.childNickname,
      parent_nickname: ctx.parentNickname,
      nickname_a: ctx.nicknameA,
      nickname_b: ctx.nicknameB,
      ...(personCoreMeta ? { person_core: personCoreMeta } : {}),
      ...(psychBundle
        ? {
            psych_match: psychBundle.psych_match,
            psych_lens: psychBundle.psych_lens,
          }
        : {}),
      ...(prescription_family ? { prescription_family } : {}),
    },
  };
}
