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
}): FamilyParentReportBody {
  const ctx = buildFamilyRuleContext(params);
  const family = buildFamilyParentChildReport(ctx);

  const snapshot_panel = buildFamilyParentSnapshotPanel(
    ctx,
    {
      gaugeLabel: "Child DNA Playbook · 패밀리 스냅샷",
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
  );

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
    },
  };
}
