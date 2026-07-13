import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import {
  buildMarriagePsychMatchBundle,
  type MarriageHomePsychLens,
} from "./buildMarriagePsychMatch";
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
    /** PersonCore 11축 + 홈라이프 DNA 스냅샷 (동거·결혼 SSOT 연결) */
    person_core?: {
      report_id_a: string;
      report_id_b: string;
      input_fingerprint_a: string;
      input_fingerprint_b: string;
      psych_a: PsychMasterJson;
      psych_b: PsychMasterJson;
    };
    /** 연인 보고서와 동일한 11축 2인 매칭 (PersonCore 설문 기반) */
    psych_match?: PsychMatchResult | null;
    /** 동거·부부 렌즈 — 홈 생활에서 특히 눈에 띄는 축 2~3개 */
    home_psych_lens?: MarriageHomePsychLens | null;
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
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
}): MarriageReportBody {
  const ctx = buildMarriageRuleContext(params);
  const household = buildHouseholdPartnershipReport(ctx);

  const snapshot_panel = buildMarriageSnapshotPanel(
    ctx,
    {
      gaugeLabel: "하우스홀드 파트너십 스냅샷",
      representativeLine: household.section_snapshot.one_line_household,
    },
    {
      psychA: params.psychMasterA ?? null,
      psychB: params.psychMasterB ?? null,
    },
  );

  const personCoreMeta =
    params.psychMasterA &&
    params.psychMasterB &&
    params.personCoreMeta
      ? {
          report_id_a: params.personCoreMeta.reportIdA,
          report_id_b: params.personCoreMeta.reportIdB,
          input_fingerprint_a: params.personCoreMeta.inputFingerprintA,
          input_fingerprint_b: params.personCoreMeta.inputFingerprintB,
          psych_a: params.psychMasterA,
          psych_b: params.psychMasterB,
        }
      : undefined;

  const psychBundle = buildMarriagePsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
  );

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
      ...(personCoreMeta ? { person_core: personCoreMeta } : {}),
      ...(psychBundle
        ? {
            psych_match: psychBundle.psych_match,
            home_psych_lens: psychBundle.home_psych_lens,
          }
        : {}),
    },
  };
}
