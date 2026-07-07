import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
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
}): FamilyParentReportBody {
  const ctx = buildFamilyRuleContext(params);
  const family = buildFamilyParentChildReport(ctx);

  const snapshot_panel = buildFamilyParentSnapshotPanel(ctx, {
    gaugeLabel: "Child DNA Playbook · 패밀리 스냅샷",
    representativeLine: family.section_snapshot.one_line_family,
  });

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
    },
  };
}
