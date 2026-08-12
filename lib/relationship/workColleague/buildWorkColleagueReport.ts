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
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import {
  resolveReportingStyleFit,
  resolveBreakBoundaryFit,
  resolveContributionStyle,
  resolveFeedbackCushionScript,
  refineLeadershipRoleSplit,
} from "./officePsychFit";
import {
  buildWorkLeadershipCanonical,
  buildWorkLeadershipClientProjection,
  injectWorkLeadershipClientProjection,
  leadershipClientValueFromFinalized,
  type WorkLeadershipClientValue,
} from "./workLeadershipCanonical";
import {
  buildWorkComparisonTableCanonical,
  buildWorkComparisonTableClientProjection,
  comparisonTableValueFromResolver,
  injectWorkComparisonTableClientProjection,
  type WorkComparisonTableValue,
} from "./workComparisonTableCanonical";
import {
  buildWorkContextOutput,
  type WorkContextOutput,
} from "./workContextOutput";
import type { SnapshotTopicNarrative } from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import { buildCanonicalWorkStoryPlan } from "./buildCanonicalWorkStoryPlan";
import type { CanonicalWorkStoryPlan } from "./workStoryPlanTypes";

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
    /**
     * current_enriched 전용 — snapshot_panel.narrative.topics의 상황별 재라벨
     * 사본(Part3 "함께 일할 때 반복되는 흐름" 전용). 새 계산 없음, 제목만 교체.
     * production `buildWorkColleagueReport`는 이 필드를 채우지 않는다.
     */
    situational_relationship_topics?: SnapshotTopicNarrative[];
    /**
     * Round 2 — businessSajuDeep LLM explain overlay (optional).
     * Does not own classifications; CE projections remain SSOT.
     */
    business_saju_deep?: import("@/lib/prompts/relationshipPremium/businessSajuDeep").BusinessSajuDeepReport;
    locale?: string;
    language?: string;
  };
  /**
   * Context Output — 이미 계산된 ctx/office 재포장.
   * 옵셔널·순수 추가. 클라이언트 응답에서는 strip으로 제거.
   */
  context_output?: WorkContextOutput;
  /**
   * Typed Context Engine projections for MUST judgments.
   * Survives strip (context_output only removed). Legacy reports omit.
   */
  canonical_projections?: {
    comparison_table?: WorkComparisonTableValue;
    leadership_split?: WorkLeadershipClientValue;
  };
  story_plan?: CanonicalWorkStoryPlan;
};

/**
 * `oneLine`은 호출부에서 이미 만든 `office`(buildOfficePartnershipReport 결과)의
 * `section_snapshot.one_line_definition`을 받는다. 예전에는 이 함수 안에서
 * `buildOfficePartnershipReport(ctx)`를 한 번 더 호출해서 DNA·워닝·이상적 역할 등
 * 리포트 전체를 통째로 다시 계산하고 문자열 하나만 뽑아 버렸다(겹친 분석 — 리포트
 * 생성당 office 계산이 2회 실행됨). 그 중복을 제거했다.
 */
function resolveHeadline(
  ctx: WorkColleagueContext,
  oneLine: string,
): {
  headline: string;
  summary_line: string;
  gaugeLabel: string;
  representativeLine: string;
} {
  const { activation, benefit, risk } = ctx.masterScores;

  return {
    headline: oneLine,
    summary_line:
      ctx.locale === "en-US"
        ? `Work fit ${activation}% · Collab synergy ${benefit}% · Office risk ${risk}%`
        : `업무적 핏 ${activation}% · 협업 시너지 ${benefit}% · 오피스 리스크 ${risk}%`,
    gaugeLabel: ctx.locale === "en-US" ? "Office Partnership Snapshot" : "오피스 파트너십 스냅샷",
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
  /** PersonCore bake-in 명리 신호(월주 격국·신살 등) — work 캐릭터 타입 SSOT */
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  locale?: Locale;
}): WorkColleagueReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildWorkColleagueContext({ ...params, locale });
  const officeBase = buildOfficePartnershipReport(ctx);

  // Part2②③·Part3①·Part4② — 사주(ctx)만으로는 못 만들고 11축(psychMaster)이
  // 있어야 하는 필드들. buildOfficePartnershipReport(ctx)는 psychMaster를
  // 모르므로, 여기서 계산해 office에 병합한다.
  const reportingStyleFit = resolveReportingStyleFit(
    ctx.tenGodsA,
    ctx.tenGodsB,
    ctx.workSignalsA,
    ctx.workSignalsB,
    params.psychMasterA,
    params.psychMasterB,
    ctx.nicknameA,
    ctx.nicknameB,
    locale,
  );
  const breakBoundaryFit = resolveBreakBoundaryFit(
    ctx.workPairAnalysis.base.dayBranchCrossHits,
    params.psychMasterA,
    params.psychMasterB,
    ctx.nicknameA,
    ctx.nicknameB,
    locale,
  );
  const contributionStyle = resolveContributionStyle(
    ctx.workSignalsA,
    ctx.workSignalsB,
    params.psychMasterA,
    params.psychMasterB,
    ctx.nicknameA,
    ctx.nicknameB,
    locale,
  );
  const feedbackCushion = resolveFeedbackCushionScript(
    ctx.nicknameA,
    ctx.nicknameB,
    ctx.strengthA,
    ctx.strengthB,
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );
  // Phase 6-2a — refine once, wrap as canonical, persist .value (SSOT).
  const leadershipBase = officeBase.section_roles.leadership_split ?? null;
  const leadershipRefined = refineLeadershipRoleSplit({
    base: leadershipBase,
    workSignalsA: ctx.workSignalsA,
    workSignalsB: ctx.workSignalsB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    reporting: reportingStyleFit,
    contribution: contributionStyle,
    breakBoundary: breakBoundaryFit,
    nicknameA: ctx.nicknameA,
    nicknameB: ctx.nicknameB,
    locale,
  });
  const leadershipCanonical = buildWorkLeadershipCanonical(leadershipRefined, {
    base: leadershipBase,
  });
  const leadershipSplit = leadershipCanonical?.value ?? null;

  const office = {
    ...officeBase,
    section_mix_fit: {
      ...officeBase.section_mix_fit,
      reporting_style_fit: reportingStyleFit,
    },
    section_respect: {
      ...officeBase.section_respect,
      break_boundary_fit: breakBoundaryFit,
    },
    section_dna: {
      person_a: {
        ...officeBase.section_dna.person_a,
        contribution_style: contributionStyle?.person_a.style ?? null,
        contribution_style_label: contributionStyle?.person_a.label ?? null,
      },
      person_b: {
        ...officeBase.section_dna.person_b,
        contribution_style: contributionStyle?.person_b.style ?? null,
        contribution_style_label: contributionStyle?.person_b.label ?? null,
      },
    },
    section_roles: {
      ...officeBase.section_roles,
      leadership_split: leadershipSplit,
    },
    section_upset: {
      ...officeBase.section_upset,
      feedback_cushion: feedbackCushion,
    },
  };

  const headlineBlock = resolveHeadline(
    ctx,
    office.section_snapshot.one_line_definition,
  );

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
    locale,
  );

  const prescription_work = params.pairWork
    ? buildWorkPrescriptions({
        pair: params.pairWork,
        nicknameA: params.nicknameA,
        nicknameB: params.nicknameB,
        locale,
      })
    : undefined;

  const comparisonTyped = comparisonTableValueFromResolver(ctx);
  const comparisonProjection = buildWorkComparisonTableClientProjection(
    buildWorkComparisonTableCanonical(comparisonTyped)?.value,
  );
  const leadershipProjection = buildWorkLeadershipClientProjection(
    leadershipClientValueFromFinalized(leadershipSplit),
  );

  let reportBody: WorkColleagueReportBody = {
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
    context_output: buildWorkContextOutput(ctx, office, {
      personCoreMeta: params.personCoreMeta,
    }),
    story_plan: buildCanonicalWorkStoryPlan({
      nameA: ctx.nicknameA,
      nameB: ctx.nicknameB,
      oneLineDefinition: office.section_snapshot.one_line_definition,
      officeReport: office,
      prescriptions: prescription_work,
      locale: params.locale ?? "ko-KR",
    }),
  };

  reportBody = injectWorkComparisonTableClientProjection(
    reportBody,
    comparisonProjection,
  );
  reportBody = injectWorkLeadershipClientProjection(
    reportBody,
    leadershipProjection,
  );

  return reportBody;
}
