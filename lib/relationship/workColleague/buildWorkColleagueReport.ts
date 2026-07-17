import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
import { buildWorkPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildWorkPsychMatch";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonCoreRelationMeta,
  type PersonCoreRelationMetaPayload,
} from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
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
import { buildWorkPrescriptions } from "./buildWorkPrescriptions";
import type { WorkPrescriptionPack } from "./workPrescriptionTypes";
import type { PairWorkSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

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
    person_core?: PersonCoreRelationMetaPayload;
    psych_match?: PsychMatchResult | null;
    psych_lens?: DomainPsychLens | null;
    /** pair.work 교차 신호 기반 실행 처방전 */
    prescription_work?: WorkPrescriptionPack;
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
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
  pairWork?: PairWorkSignals | null;
  locale?: Locale;
}): WorkColleagueReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildWorkColleagueContext({ ...params, locale });
  const office = buildOfficePartnershipReport(ctx);
  const headlineBlock = resolveHeadline(ctx);

  const snapshot_panel = buildWorkSnapshotPanel(
    ctx,
    {
      gaugeLabel: headlineBlock.gaugeLabel,
      representativeLine: headlineBlock.summary_line,
    },
    {
      psychA: params.psychMasterA ?? null,
      psychB: params.psychMasterB ?? null,
    },
  );

  const personCoreMeta = buildPersonCoreRelationMeta(params);
  const psychBundle = buildWorkPsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
  );

  const prescription_work = params.pairWork
    ? buildWorkPrescriptions({
        pair: params.pairWork,
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
        locale,
      })
    : undefined;

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
      ...(personCoreMeta ? { person_core: personCoreMeta } : {}),
      ...(psychBundle
        ? {
            psych_match: psychBundle.psych_match,
            psych_lens: psychBundle.psych_lens,
          }
        : {}),
      ...(prescription_work ? { prescription_work } : {}),
    },
  };
}
