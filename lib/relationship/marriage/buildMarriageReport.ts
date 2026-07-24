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
  formatParentingStyleLine,
  buildParentingCombinedFromStyles,
  buildParentingHarmonyTipFromStyles,
  type HouseholdPartnershipReport,
} from "./homeReportTemplate";
import { buildMarriageSajuCompareTable } from "./marriageSajuCompareTable";
import { resolveCfoAxisNote, refineHouseholdCfo } from "./marriageCfoConsumption";
import {
  buildMarriageOperatingCfoCanonical,
  buildMarriageOperatingCfoClientProjection,
  injectMarriageOperatingCfoClientProjection,
  operatingCfoClientValueFromFinalized,
  type MarriageOperatingCfoClientValue,
} from "./marriageOperatingCfoCanonical";
import {
  buildMarriageComparisonTableCanonical,
  buildMarriageComparisonTableClientProjection,
  comparisonTableValueFromResolver,
  injectMarriageComparisonTableClientProjection,
  type MarriageComparisonTableValue,
} from "./marriageComparisonTableCanonical";
import { resolveEnergyStyleAxisNote } from "./homeLifeLanguage";
import { resolveRejectionAxisNote } from "./bedroomProfile";
import {
  resolveParentingRoleNote,
  refineParentingStyle,
} from "./marriageTenGodAnalysis";
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
import {
  buildMarriageContextOutput,
  type MarriageContextOutput,
} from "./marriageContextOutput";

export type MarriageReportBody = {
  headline: string;
  summary_line: string;
  one_line_household: string;
  snapshot_panel: TriScoreSnapshotPanel;
  household: HouseholdPartnershipReport;
  /** 내부용 Context Output — 클라이언트 응답에서는 strip/omit */
  context_output?: MarriageContextOutput;
  /**
   * Typed Context Engine projections for MUST judgments.
   * Survives strip (context_output only removed). Legacy reports omit.
   */
  canonical_projections?: {
    comparison_table?: MarriageComparisonTableValue;
    operating_cfo?: MarriageOperatingCfoClientValue;
  };
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
    /** 3보 — pair 교차 신호 기반 실행 처방전 (기존 household 서사와 독립).
     * cfo_power_struggle.leader_side ≠ section_money_chores 운영 CFO. */
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

  // psych_match를 여기서 미리 한 번만 계산해 두면(section_money_chores의 CFO
  // 11축 확인문구용) 아래 killer_questions 등 다른 소비처와 중복 계산하지
  // 않아도 된다 — buildMarriagePsychMatchBundle 호출 위치를 앞으로 옮긴 것.
  const psychBundle = buildMarriagePsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );

  const baseHousehold = buildHouseholdPartnershipReport(ctx);
  const baseMoney = baseHousehold.section_money_chores;
  const cfoBase = {
    nickname: baseMoney.cfo_nickname,
    reason: baseMoney.cfo_reason,
  };
  // Phase 6-2c — pick (in base sections) → refine once → wrap → persist .value
  const refinedCfo = refineHouseholdCfo({
    baseNickname: cfoBase.nickname,
    baseReason: cfoBase.reason,
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: ctx.tenGod.countsA,
    countsB: ctx.tenGod.countsB,
    branchCodesA: ctx.marriagePairAnalysis.chartA.branchCodes,
    branchCodesB: ctx.marriagePairAnalysis.chartB.branchCodes,
    wealthOfficerPowerA:
      params.cohabitationSignalsA?.wealth_officer_power ?? null,
    wealthOfficerPowerB:
      params.cohabitationSignalsB?.wealth_officer_power ?? null,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    dualCfoWar: params.pairCohabitation?.cfo_power_struggle?.dual_cfo_war,
    locale,
  });
  const cfoCanonical = buildMarriageOperatingCfoCanonical(refinedCfo, {
    base: cfoBase,
  });
  const cfoFinal = cfoCanonical?.value ?? refinedCfo;

  const refinedParentingA = refineParentingStyle({
    baseStyle: ctx.tenGod.parentingA.style,
    counts: ctx.tenGod.countsA,
    psych: params.psychMasterA,
    locale,
  });
  const refinedParentingB = refineParentingStyle({
    baseStyle: ctx.tenGod.parentingB.style,
    counts: ctx.tenGod.countsB,
    psych: params.psychMasterB,
    locale,
  });

  const household: HouseholdPartnershipReport = {
    ...baseHousehold,
    section_compare_table: buildMarriageSajuCompareTable({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      tenGodsA: ctx.tenGod.countsA,
      tenGodsB: ctx.tenGod.countsB,
      needsStrongBoundaryA: ctx.tenGod.boundaryA.needsStrongBoundary,
      needsStrongBoundaryB: ctx.tenGod.boundaryB.needsStrongBoundary,
      parentingStyleA: refinedParentingA.style,
      parentingStyleB: refinedParentingB.style,
      economicDominanceBandA: params.cohabitationSignalsA?.wealth_officer_power.economic_dominance_band,
      economicDominanceBandB: params.cohabitationSignalsB?.wealth_officer_power.economic_dominance_band,
      locale,
    }),
    section_money_chores: {
      ...baseMoney,
      cfo_nickname: cfoFinal.nickname,
      cfo_reason: cfoFinal.reason,
      cfo_axis_note: resolveCfoAxisNote(
        psychBundle?.psych_match ?? null,
        cfoFinal.nickname === params.nicknameA,
        locale,
      ),
      ...(cfoFinal.confidence
        ? { cfo_confidence: cfoFinal.confidence }
        : {}),
      ...(cfoFinal.align ? { cfo_align: cfoFinal.align } : {}),
      ...(cfoFinal.dual ? { cfo_dual: true } : {}),
    },
    section_dna: {
      person_a: {
        ...baseHousehold.section_dna.person_a,
        energy_axis_note: resolveEnergyStyleAxisNote(
          ctx.marriagePairAnalysis.chartA,
          params.psychMasterA,
          locale,
        ),
      },
      person_b: {
        ...baseHousehold.section_dna.person_b,
        energy_axis_note: resolveEnergyStyleAxisNote(
          ctx.marriagePairAnalysis.chartB,
          params.psychMasterB,
          locale,
        ),
      },
    },
    section_bedroom: {
      ...baseHousehold.section_bedroom,
      rejection_axis_note: resolveRejectionAxisNote(
        params.psychMasterA,
        params.psychMasterB,
        locale,
      ),
    },
    section_parenting: {
      combined_attitude: buildParentingCombinedFromStyles(
        params.nicknameA,
        params.nicknameB,
        refinedParentingA.style,
        refinedParentingB.style,
        locale,
      ),
      person_a_style: formatParentingStyleLine(
        refinedParentingA.style,
        refinedParentingA.label,
        locale,
      ),
      person_b_style: formatParentingStyleLine(
        refinedParentingB.style,
        refinedParentingB.label,
        locale,
      ),
      harmony_tip: buildParentingHarmonyTipFromStyles(
        params.nicknameA,
        params.nicknameB,
        refinedParentingA.style,
        refinedParentingB.style,
        locale,
      ),
      person_a_role_note: resolveParentingRoleNote(
        refinedParentingA.style,
        params.psychMasterA,
        locale,
      ),
      person_b_role_note: resolveParentingRoleNote(
        refinedParentingB.style,
        params.psychMasterB,
        locale,
      ),
      style_key_a: refinedParentingA.style,
      style_key_b: refinedParentingB.style,
      ...(refinedParentingA.confidence
        ? { parenting_a_confidence: refinedParentingA.confidence }
        : {}),
      ...(refinedParentingB.confidence
        ? { parenting_b_confidence: refinedParentingB.confidence }
        : {}),
      ...(refinedParentingA.align
        ? { parenting_a_align: refinedParentingA.align }
        : {}),
      ...(refinedParentingB.align
        ? { parenting_b_align: refinedParentingB.align }
        : {}),
    },
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
    household.section_money_chores.cfo_nickname,
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

  const compareParams = {
    tenGodsA: ctx.tenGod.countsA,
    tenGodsB: ctx.tenGod.countsB,
    needsStrongBoundaryA: ctx.tenGod.boundaryA.needsStrongBoundary,
    needsStrongBoundaryB: ctx.tenGod.boundaryB.needsStrongBoundary,
    parentingStyleA: refinedParentingA.style,
    parentingStyleB: refinedParentingB.style,
    economicDominanceBandA:
      params.cohabitationSignalsA?.wealth_officer_power.economic_dominance_band,
    economicDominanceBandB:
      params.cohabitationSignalsB?.wealth_officer_power.economic_dominance_band,
  };
  const comparisonTyped = comparisonTableValueFromResolver(compareParams);
  const comparisonProjection = buildMarriageComparisonTableClientProjection(
    buildMarriageComparisonTableCanonical(comparisonTyped)?.value,
  );
  const cfoProjection = buildMarriageOperatingCfoClientProjection(
    operatingCfoClientValueFromFinalized(
      cfoFinal,
      params.nicknameA,
      params.nicknameB,
    ),
  );

  let reportBody: MarriageReportBody = {
    headline: household.section_snapshot.one_line_household,
    summary_line: `🔥 ${ctx.masterScores.activation}% · 🧩 ${ctx.masterScores.benefit}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_household: household.section_snapshot.one_line_household,
    snapshot_panel,
    household,
    context_output: buildMarriageContextOutput(ctx, household, {
      psychMatch: psychBundle?.psych_match ?? null,
      personCoreMeta: params.personCoreMeta ?? null,
    }),
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

  reportBody = injectMarriageComparisonTableClientProjection(
    reportBody,
    comparisonProjection,
  );
  reportBody = injectMarriageOperatingCfoClientProjection(
    reportBody,
    cfoProjection,
  );

  return reportBody;
}
