import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
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
import { buildMarriageSajuCompareTable } from "./marriageSajuCompareTable";
import {
  buildCohabitationKillerQuestions,
} from "./buildCohabitationKillerQuestions";
import type { CohabitationKillerQuestionPack } from "./cohabitationKillerTypes";
import { buildCohabitationPrescriptions } from "./buildCohabitationPrescriptions";
import type { CohabitationPrescriptionPack } from "./cohabitationPrescriptionTypes";
import type { PairCohabitationSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { CohabitationSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

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
    psych_lens?: DomainPsychLens | null;
    /** 동거·부부 렌즈 — 홈 생활에서 특히 눈에 띄는 축 2~3개 (레거시 캐시 호환) */
    home_psych_lens?: MarriageHomePsychLens | null;
    /** 1안 — 사주×설문 교차 검증 킬러 질문 팩 */
    killer_questions?: CohabitationKillerQuestionPack;
    /** 3보 — pair 교차 신호 기반 실행 처방전 (기존 household 서사와 독립) */
    prescription_cohabitation?: CohabitationPrescriptionPack;
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
  /** PersonCore pair 교차 연산 — prescription_cohabitation 생성용 */
  pairCohabitation?: PairCohabitationSignals | null;
  /** PersonCore 인당 신호 — CFO(재관 세력) 판정 등에 사용 */
  cohabitationSignalsA?: CohabitationSajuSignals;
  cohabitationSignalsB?: CohabitationSajuSignals;
  locale?: Locale;
}): MarriageReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildMarriageRuleContext({ ...params, locale });
  const household: HouseholdPartnershipReport = {
    ...buildHouseholdPartnershipReport(ctx),
    section_compare_table: buildMarriageSajuCompareTable({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      tenGodsA: ctx.tenGod.countsA,
      tenGodsB: ctx.tenGod.countsB,
      needsStrongBoundaryA: ctx.tenGod.boundaryA.needsStrongBoundary,
      needsStrongBoundaryB: ctx.tenGod.boundaryB.needsStrongBoundary,
      parentingStyleA: ctx.tenGod.parentingA.style,
      parentingStyleB: ctx.tenGod.parentingB.style,
      economicDominanceBandA: params.cohabitationSignalsA?.wealth_officer_power.economic_dominance_band,
      economicDominanceBandB: params.cohabitationSignalsB?.wealth_officer_power.economic_dominance_band,
      locale,
    }),
  };

  const snapshot_panel = buildMarriageSnapshotPanel(
    ctx,
    {
      gaugeLabel: pick(locale, "Household Partnership Snapshot", "하우스홀드 파트너십 스냅샷"),
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
    locale,
  );

  const killer_questions = buildCohabitationKillerQuestions({
    ctx,
    household,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  const prescription_cohabitation = params.pairCohabitation
    ? buildCohabitationPrescriptions({
        pair: params.pairCohabitation,
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
        locale,
      })
    : undefined;

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
            psych_lens: psychBundle.psych_lens,
            home_psych_lens: psychBundle.home_psych_lens,
          }
        : {}),
      killer_questions,
      ...(prescription_cohabitation
        ? { prescription_cohabitation }
        : {}),
    },
  };
}
