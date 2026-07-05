import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import {
  buildWorkColleagueContext,
  type WorkColleagueContext,
} from "./buildWorkColleagueContext";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildWorkSnapshotPanel } from "./buildWorkSnapshotPanel";
import {
  buildOfficePartnershipReport,
  type OfficePartnershipReport,
} from "./officeReportTemplate";

export type WorkColleagueReportBody = {
  headline: string;
  summary_line: string;
  one_line_definition: string;
  snapshot_panel: TriScoreSnapshotPanel;
  office: OfficePartnershipReport;
  meta: {
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    fit_pct: number;
    synergy_pct: number;
    risk_pct: number;
  };
};

function resolveHeadline(ctx: WorkColleagueContext): {
  headline: string;
  summary_line: string;
  gaugeLabel: string;
  representativeLine: string;
} {
  const { activation, benefit, risk } = ctx.masterScores;
  const oneLine = buildOfficePartnershipReport(ctx).section_snapshot
    .one_line_definition;

  return {
    headline: oneLine,
    summary_line: `업무적 핏 ${activation}% · 협업 시너지 ${benefit}% · 오피스 리스크 ${risk}%`,
    gaugeLabel: "오피스 파트너십 스냅샷",
    representativeLine: ctx.gradeReason,
  };
}

export function buildWorkColleagueReport(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
}): WorkColleagueReportBody {
  const ctx = buildWorkColleagueContext(params);
  const office = buildOfficePartnershipReport(ctx);
  const headlineBlock = resolveHeadline(ctx);

  const snapshot_panel = buildWorkSnapshotPanel(ctx, {
    gaugeLabel: headlineBlock.gaugeLabel,
    representativeLine: headlineBlock.summary_line,
  });

  return {
    headline: headlineBlock.headline,
    summary_line: headlineBlock.summary_line,
    one_line_definition: office.section_snapshot.one_line_definition,
    snapshot_panel,
    office,
    meta: {
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      fit_pct: ctx.masterScores.activation,
      synergy_pct: ctx.masterScores.benefit,
      risk_pct: ctx.masterScores.risk,
    },
  };
}
