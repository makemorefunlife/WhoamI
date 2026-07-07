import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildMarriageRuleContext } from "./buildMarriageRuleContext";
import { buildMarriageSnapshotPanel } from "./buildMarriageSnapshotPanel";
import {
  buildHouseholdPartnershipReport,
  type HouseholdPartnershipReport,
} from "./homeReportTemplate";

export type MarriageReportBody = {
  headline: string;
  summary_line: string;
  one_line_household: string;
  snapshot_panel: TriScoreSnapshotPanel;
  household: HouseholdPartnershipReport;
  meta: {
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    romantic_fit_pct: number;
    life_synergy_pct: number;
    home_risk_pct: number;
  };
};

export function buildMarriageReport(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
}): MarriageReportBody {
  const ctx = buildMarriageRuleContext(params);
  const household = buildHouseholdPartnershipReport(ctx);

  const snapshot_panel = buildMarriageSnapshotPanel(ctx, {
    gaugeLabel: "하우스홀드 파트너십 스냅샷",
    representativeLine: household.section_snapshot.one_line_household,
  });

  return {
    headline: household.section_snapshot.one_line_household,
    summary_line: `🔥 ${ctx.masterScores.activation}% · 🧩 ${ctx.masterScores.benefit}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_household: household.section_snapshot.one_line_household,
    snapshot_panel,
    household,
    meta: {
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      romantic_fit_pct: ctx.masterScores.activation,
      life_synergy_pct: ctx.masterScores.benefit,
      home_risk_pct: ctx.masterScores.risk,
    },
  };
}
