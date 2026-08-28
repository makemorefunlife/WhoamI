/**
 * Romantic premium — saju-deep LLM narrative pipeline.
 *
 * FROZEN (2026-07-24): docs/dev/decisions/027_romantic-saju-deep-narrative-freeze.md
 * after Style Bible Master Check on same + independent reports.
 * Do not reopen without repeated QA evidence; keep self-refine OFF.
 */
import type OpenAI from "openai";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildRomanticRulesBundle } from "@/lib/relationship/romanticRules";
import type { RomanticRuleScreenPlan } from "@/lib/relationship/romanticRules";
import {
  buildRomanticPairSignalsDigest,
  buildRomanticPersonSignalsDigest,
  buildRomanticDynamicsDigest,
  buildRomanticSewoonTimelineDigest,
} from "@/lib/relationship/romanticSajuPromptDigest";
import {
  buildRomanticContextInput,
  collectRomanticAxisNotes,
  collectRomanticDynamicsTypedSnapshot,
  type RomanticContextInput,
  type RomanticDynamicsTypedSnapshot,
} from "@/lib/relationship/romantic/romanticContextInput";
import {
  balanceOfPowerValueFromDominantCategories,
  buildRomanticBalanceOfPowerCanonical,
  buildRomanticBalanceClientProjection,
  injectRomanticBalanceClientProjection,
} from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import {
  recoverySpeedValueFromDominantCategories,
  buildRomanticRecoverySpeedCanonical,
  buildRomanticRecoveryClientProjection,
  injectRomanticRecoveryClientProjection,
} from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import {
  reassuranceValueFromDominantCategories,
  buildRomanticReassuranceCanonical,
  buildRomanticReassuranceClientProjection,
  injectRomanticReassuranceClientProjection,
} from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import {
  rolePlayValueFromDominantCategories,
  buildRomanticRolePlayCanonical,
  buildRomanticRolePlayClientProjection,
  injectRomanticRolePlayClientProjection,
} from "@/lib/relationship/romantic/romanticRolePlayCanonical";
import {
  residualValueFromDominantCategories,
  buildRomanticResidualCanonical,
  buildRomanticResidualClientProjection,
  injectRomanticResidualClientProjection,
} from "@/lib/relationship/romantic/romanticResidualCanonical";
import {
  expressionSpeedValueFromDominantCategories,
  buildRomanticExpressionSpeedCanonical,
  buildRomanticExpressionSpeedClientProjection,
  injectRomanticExpressionSpeedClientProjection,
} from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import {
  comparisonTableValueFromDominantCategories,
  buildRomanticComparisonTableCanonical,
  buildRomanticComparisonTableClientProjection,
  injectRomanticComparisonTableClientProjection,
} from "@/lib/relationship/romantic/romanticComparisonTableCanonical";
import {
  sajuFrameDirectionValueFromDominantCategories,
  buildRomanticSajuFrameDirectionCanonical,
  buildRomanticSajuFrameDirectionClientProjection,
  injectRomanticSajuFrameDirectionClientProjection,
} from "@/lib/relationship/romantic/romanticSajuFrameDirectionCanonical";
import {
  crossChartTensionValueFromFinalized,
  buildRomanticCrossChartTensionCanonical,
  buildRomanticCrossChartTensionClientProjection,
  injectRomanticCrossChartTensionClientProjection,
} from "@/lib/relationship/romantic/romanticCrossChartTensionCanonical";
import {
  stemCombineValueFromDynamicsSnapshot,
  buildRomanticStemCombineCanonical,
  buildRomanticStemCombineClientProjection,
  injectRomanticStemCombineClientProjection,
} from "@/lib/relationship/romantic/romanticStemCombineCanonical";
import {
  sixCombineValueFromDynamicsSnapshot,
  buildRomanticSixCombineCanonical,
  buildRomanticSixCombineClientProjection,
  injectRomanticSixCombineClientProjection,
} from "@/lib/relationship/romantic/romanticSixCombineCanonical";
import {
  crossTrioValueFromDynamicsSnapshot,
  buildRomanticCrossTrioCanonical,
  buildRomanticCrossTrioClientProjection,
  injectRomanticCrossTrioClientProjection,
} from "@/lib/relationship/romantic/romanticCrossTrioCanonical";
import {
  wonjinGuimunValueFromDynamicsSnapshot,
  buildRomanticWonjinGuimunCanonical,
  buildRomanticWonjinGuimunClientProjection,
  injectRomanticWonjinGuimunClientProjection,
} from "@/lib/relationship/romantic/romanticWonjinGuimunCanonical";
import {
  gongmangValueFromDynamicsSnapshot,
  buildRomanticGongmangCanonical,
  buildRomanticGongmangClientProjection,
  injectRomanticGongmangClientProjection,
} from "@/lib/relationship/romantic/romanticGongmangCanonical";
import {
  buildRomanticPairCeBondingValue,
  buildRomanticPairCeBondingCanonical,
  injectRomanticPairCeBondingClientProjection,
} from "@/lib/relationship/romantic/romanticPairCeBondingCanonical";
import { bindDialogueTableToExpressionSpeed } from "@/lib/relationship/romantic/romanticDialogueTableBinding";
import { refineCompareConflictPair } from "@/lib/relationship/romantic/compareConflictComposite";
import { refineCompareAffectionPair } from "@/lib/relationship/romantic/compareAffectionComposite";
import { refineCompareStressPair } from "@/lib/relationship/romantic/compareStressComposite";
import { refineCompareDecisionPair } from "@/lib/relationship/romantic/compareDecisionComposite";
import { refineCompareExpressionPair } from "@/lib/relationship/romantic/compareExpressionComposite";
import { refineCompareCommunicationPair } from "@/lib/relationship/romantic/compareCommunicationComposite";
import { refineExpressionSpeedCorroboration } from "@/lib/relationship/romantic/expressionSpeedCorroboration";
import { resolveExpressionSpeedDirection } from "@/lib/relationship/romanticRules/relationshipDynamics";
import { buildChartContext } from "@/lib/saju/chartContext";
import { buildRomanticFortuneFlow } from "@/lib/relationship/romanticRules/fortuneFlow";
import {
  buildRomanticScreenPlan,
  type RomanticScreenSlot,
} from "@/lib/relationship/romanticHeadline/screenMap";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import {
  fetchLlmJsonWithParseRetry,
} from "@/lib/relationship/parseLlmJson";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  buildPsychMatchResult,
  buildChemistryApproxScores,
  buildStrengthWeaknessLists,
} from "@/lib/relationship/psychMatch";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { RomanticOpeningSelection } from "@/lib/relationship/romanticHeadline/types";
import { getRomanticSajuDeepSystemPrompt } from "./system";
import type { RomanticSajuDeepLocale } from "./system";
import { buildRomanticSajuDeepUserPrompt } from "./user";
import {
  isRomanticSajuDeepReport,
  type RomanticSajuDeepReport,
} from "./outputSchema";
import { postValidateRomanticNarrative } from "./postValidateNarrative";

export const ROMANTIC_SAJU_DEEP_FORMAT = "romantic_saju_deep_v2" as const;

export type RomanticSajuDeepPayload = {
  format: typeof ROMANTIC_SAJU_DEEP_FORMAT;
  report: RomanticSajuDeepReport["report"];
};

export type RomanticSajuDeepRunParams = {
  nicknameA: string;
  nicknameB: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  birthA: { date: string; time: string; place: string };
  birthB: { date: string; time: string; place: string };
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  sajuProvenanceA?: SajuChartProvenance;
  sajuProvenanceB?: SajuChartProvenance;
  surveyProfileA?: CurrentSelfProfile | null;
  surveyProfileB?: CurrentSelfProfile | null;
  locale?: RomanticSajuDeepLocale;
  sajuMasterA?: SajuMasterJson | null;
  sajuMasterB?: SajuMasterJson | null;
};

type RomanticPreparedContext = {
  locale: RomanticSajuDeepLocale;
  systemPrompt: string;
  userPrompt: string;
  opening: RomanticOpeningSelection;
  insightPool: ReturnType<typeof buildRomanticRulesBundle>["insightPool"];
  ruleScreenPlan: RomanticRuleScreenPlan[];
  ctx: ReturnType<typeof buildRomanticRulesBundle>["ctx"];
  screenPlan: RomanticScreenSlot[];
  snapshotPanel: unknown;
  fortuneFlow: ReturnType<typeof buildRomanticFortuneFlow>;
  /** deterministic input — LLM prose와 분리. digest/prompt 미변경. */
  romanticContextInput: RomanticContextInput;
  /**
   * dominant_categories로 평탄화되기 전 원본 스냅샷 — cross_chart_* 캐노니컬처럼
   * hits[] 배열을 담아야 하는 신호는 dominant_categories를 거칠 수 없어 여기서
   * 직접 finalize한다 (프롬프트/postValidate 미변경, Context Engine 플러밍만 추가).
   */
  dynamicsTyped: RomanticDynamicsTypedSnapshot | null;
};

export function romanticSajuDeepSelfRefineEnabled(): boolean {
  // Round 2 decision: keep disabled. A second full LLM rewrite would roughly
  // double latency/cost. Use deterministic postValidateRomanticNarrative instead.
  return false;
}

/** 출력 토큰 상한 — RELATIONSHIP_ROMANTIC_MAX_TOKENS 로 조정 가능 */
export function romanticSajuDeepMaxTokens(): number {
  const raw = process.env.RELATIONSHIP_ROMANTIC_MAX_TOKENS?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 16384;
}

function romanticLlmModel(): string {
  return process.env.RELATIONSHIP_ROMANTIC_MODEL ?? "gpt-4o-mini";
}

function buildPsychMatchParallel(
  params: RomanticSajuDeepRunParams,
): ReturnType<typeof buildPsychMatchResult> | null {
  if (!params.surveyProfileA || !params.surveyProfileB) return null;
  return buildPsychMatchResult({
    profileA: params.surveyProfileA,
    profileB: params.surveyProfileB,
  });
}

/** 규칙 엔진 + Digest 조립 — LLM 호출 전 동기 준비 */
export function prepareRomanticSajuDeepRun(
  params: RomanticSajuDeepRunParams,
): RomanticPreparedContext {
  const locale = params.locale ?? "en";
  const systemPrompt = getRomanticSajuDeepSystemPrompt(locale);
  const [uncertainA, uncertainB] = [
    buildSajuUncertainItems({
      provenance: params.sajuProvenanceA,
      birthPlace: params.birthA.place,
      validationNotes: params.sajuProvenanceA?.validationNotes,
    }),
    buildSajuUncertainItems({
      provenance: params.sajuProvenanceB,
      birthPlace: params.birthB.place,
      validationNotes: params.sajuProvenanceB?.validationNotes,
    }),
  ];

  const bundle = buildRomanticRulesBundle({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    surveyProfileA: params.surveyProfileA,
    surveyProfileB: params.surveyProfileB,
    locale,
  });
  const { pairAnalysis, opening, insightPool, ruleScreenPlan, ctx } = bundle;
  const snapshotSlot = ruleScreenPlan.find(
    (s) => s.screen === 2 && s.key === "snapshot",
  );
  const snapshotPanel =
    snapshotSlot?.key === "snapshot" ? snapshotSlot.output.panel : undefined;
  const screenPlan = buildRomanticScreenPlan({
    ranked: opening.ranked_insights,
    pool: insightPool,
  });

  // romantic_signals는 오늘 추가된 필드라 이전에 저장된 saju_master_json에는
  // 없을 수 있다 — sajuMaster 존재 여부뿐 아니라 이 필드 자체도 확인해서
  // 없으면 크래시 대신 dynamics_digest를 생략한다(구버전 스냅샷 안전 처리).
  const romanticSignalsA = params.sajuMasterA?.domain_signals?.romantic_signals;
  const romanticSignalsB = params.sajuMasterB?.domain_signals?.romantic_signals;

  // Phase 5-3 — compare 6행 composite (양쪽 signals + 해당 psych 있을 때만)
  const conflictComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareConflictPair({
          conflictA: romanticSignalsA.conflict_response,
          conflictB: romanticSignalsB.conflict_response,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;
  const affectionComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareAffectionPair({
          affectionA: romanticSignalsA.affection_language,
          affectionB: romanticSignalsB.affection_language,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;
  const stressComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareStressPair({
          stressA: romanticSignalsA.stress_pattern,
          stressB: romanticSignalsB.stress_pattern,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;
  const decisionComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareDecisionPair({
          decisionA: romanticSignalsA.decision_making,
          decisionB: romanticSignalsB.decision_making,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;
  const expressionComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareExpressionPair({
          expressionA: romanticSignalsA.expression_style,
          expressionB: romanticSignalsB.expression_style,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;
  const communicationComposite =
    romanticSignalsA != null && romanticSignalsB != null
      ? refineCompareCommunicationPair({
          communicationA: romanticSignalsA.communication_style,
          communicationB: romanticSignalsB.communication_style,
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
        })
      : null;

  const chartA = buildChartContext(
    sajuJsonToPillars(
      params.sajuJsonA.saju as Required<
        NonNullable<typeof params.sajuJsonA.saju>
      >,
    ),
  );
  const chartB = buildChartContext(
    sajuJsonToPillars(
      params.sajuJsonB.saju as Required<
        NonNullable<typeof params.sajuJsonB.saju>
      >,
    ),
  );

  const dynamicsTyped =
    romanticSignalsA != null && romanticSignalsB != null
      ? collectRomanticDynamicsTypedSnapshot({
          profileA: params.surveyProfileA,
          profileB: params.surveyProfileB,
          romanticA: romanticSignalsA,
          romanticB: romanticSignalsB,
          chartA,
          chartB,
          dayStemInteraction: pairAnalysis.dayStemInteraction,
          dayBranchCrossHits: pairAnalysis.dayBranchCrossHits,
          allCrossHits: pairAnalysis.allCrossHits,
        })
      : null;

  // Part3② special_bond 역할 배정 — dynamics 스냅샷과 동일 소스(있으면).
  const sajuFrameDirection = dynamicsTyped?.sajuFrameDirection ?? null;
  const anchorIsA =
    sajuFrameDirection === "A" ? true : sajuFrameDirection === "B" ? false : null;

  // Part4① Before/After 표현속도 신호 — 11축 전용(갈등직면성+자기통제)이라
  // romantic_signals(사주) 유무와 무관하게 surveyProfileA/B만 있으면 계산된다.
  const expressionSpeedDirection = resolveExpressionSpeedDirection(
    params.surveyProfileA,
    params.surveyProfileB,
  );
  // Phase 5-3 — residual confirm-only (direction 절대 불변; residual 재호출 없음)
  const expressionSpeedCorroboration = refineExpressionSpeedCorroboration({
    direction: expressionSpeedDirection,
    residualA: dynamicsTyped?.residualA ?? null,
    residualB: dynamicsTyped?.residualB ?? null,
  });

  const dynamicsBlock =
    dynamicsTyped != null
      ? buildRomanticDynamicsDigest({
          nicknameA: params.nicknameA,
          nicknameB: params.nicknameB,
          romanticA: romanticSignalsA!,
          romanticB: romanticSignalsB!,
          dayStemInteraction: pairAnalysis.dayStemInteraction,
          yongsinA: params.sajuMasterA?.yongsin_estimate ?? null,
          yongsinB: params.sajuMasterB?.yongsin_estimate ?? null,
          dynamics: dynamicsTyped,
          conflictComposite,
          affectionComposite,
          stressComposite,
          decisionComposite,
          expressionComposite,
          communicationComposite,
          expressionSpeedCorroboration,
        })
      : "## dynamics_digest\n(구버전 사주 스냅샷이라 romantic_signals 없음 — 관계 역학 4종은 이번 리포트에서 생략)";

  // Part5② 신뢰 타임라인 — LLM에 세운(연간 운) 데이터를 실제로 전달하려면
  // userPrompt 조립 이전(LLM 호출과 병렬이 아니라)에 동기 계산해야 한다.
  const fortuneFlow = buildRomanticFortuneFlow({
    birthDateA: params.birthA.date,
    birthDateB: params.birthB.date,
    sajuA: sajuJsonToPillars(
      params.sajuJsonA.saju as Required<NonNullable<typeof params.sajuJsonA.saju>>,
    ),
    sajuB: sajuJsonToPillars(
      params.sajuJsonB.saju as Required<NonNullable<typeof params.sajuJsonB.saju>>,
    ),
    currentYear: new Date().getFullYear(),
  });
  const timelineBlock = buildRomanticSewoonTimelineDigest(fortuneFlow?.sewoon ?? null);

  const [personBlockA, personBlockB] = [
    params.sajuMasterA != null
      ? buildRomanticPersonSignalsDigest({
          nickname: params.nicknameA,
          birthDate: params.birthA.date,
          birthTime: params.birthA.time,
          birthPlace: params.birthA.place,
          master: params.sajuMasterA,
          uncertainItems: uncertainA,
          profile: params.surveyProfileA,
          conflictLean: conflictComposite
            ? { lean: conflictComposite.leanA, base: conflictComposite.baseA }
            : null,
          affectionLean: affectionComposite
            ? { lean: affectionComposite.leanA, base: affectionComposite.baseA }
            : null,
          stressLean: stressComposite
            ? { lean: stressComposite.leanA, base: stressComposite.baseA }
            : null,
          decisionLean: decisionComposite
            ? { lean: decisionComposite.leanA, base: decisionComposite.baseA }
            : null,
          expressionLean: expressionComposite
            ? {
                lean: expressionComposite.leanA,
                base: expressionComposite.baseA,
              }
            : null,
          communicationLean: communicationComposite
            ? {
                lean: communicationComposite.leanA,
                base: communicationComposite.baseA,
              }
            : null,
        })
      : `## ${params.nicknameA}\n(PersonCore master 없음 — 규칙 엔진만 사용)`,
    params.sajuMasterB != null
      ? buildRomanticPersonSignalsDigest({
          nickname: params.nicknameB,
          birthDate: params.birthB.date,
          birthTime: params.birthB.time,
          birthPlace: params.birthB.place,
          master: params.sajuMasterB,
          uncertainItems: uncertainB,
          profile: params.surveyProfileB,
          conflictLean: conflictComposite
            ? { lean: conflictComposite.leanB, base: conflictComposite.baseB }
            : null,
          affectionLean: affectionComposite
            ? { lean: affectionComposite.leanB, base: affectionComposite.baseB }
            : null,
          stressLean: stressComposite
            ? { lean: stressComposite.leanB, base: stressComposite.baseB }
            : null,
          decisionLean: decisionComposite
            ? { lean: decisionComposite.leanB, base: decisionComposite.baseB }
            : null,
          expressionLean: expressionComposite
            ? {
                lean: expressionComposite.leanB,
                base: expressionComposite.baseB,
              }
            : null,
          communicationLean: communicationComposite
            ? {
                lean: communicationComposite.leanB,
                base: communicationComposite.baseB,
              }
            : null,
        })
      : `## ${params.nicknameB}\n(PersonCore master 없음 — 규칙 엔진만 사용)`,
  ];
  const pairBlock = buildRomanticPairSignalsDigest({
    labelA: params.nicknameA,
    labelB: params.nicknameB,
    pairAnalysis,
    eventScores: opening.event_scores ?? ctx.eventScores,
  });

  const userPrompt = buildRomanticSajuDeepUserPrompt({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    userCustomMyName: params.userCustomMyName,
    userCustomTargetName: params.userCustomTargetName,
    personBlockA,
    personBlockB,
    pairBlock,
    dynamicsBlock,
    timelineBlock,
    locale,
    anchorIsA,
    expressionSpeedDirection,
  });

  const eventScores = opening.event_scores ?? ctx.eventScores;
  const axisNotes = collectRomanticAxisNotes({
    profileA: params.surveyProfileA,
    profileB: params.surveyProfileB,
    locale,
  });
  const romanticContextInput = buildRomanticContextInput({
    grade: opening.grade,
    eventScores,
    romanticSignalsA: romanticSignalsA ?? null,
    romanticSignalsB: romanticSignalsB ?? null,
    dynamics: dynamicsTyped,
    expressionSpeedDirection,
    expressionSpeedCorroboration,
    profileA: params.surveyProfileA ?? null,
    profileB: params.surveyProfileB ?? null,
    conflictComposite,
    affectionComposite,
    stressComposite,
    decisionComposite,
    expressionComposite,
    communicationComposite,
    axisNotes,
    meta: {
      sajuMasterSchemaA: params.sajuMasterA?.schema_version ?? null,
      sajuMasterSchemaB: params.sajuMasterB?.schema_version ?? null,
    },
  });

  return {
    locale,
    systemPrompt,
    userPrompt,
    opening,
    insightPool,
    ruleScreenPlan,
    ctx,
    screenPlan,
    snapshotPanel: snapshotPanel ?? null,
    fortuneFlow,
    romanticContextInput,
    dynamicsTyped,
  };
}

function finalizeRomanticSajuDeepReport(
  parsed: RomanticSajuDeepReport,
  prepared: RomanticPreparedContext,
  params: RomanticSajuDeepRunParams,
  extras: {
    psychMatch: ReturnType<typeof buildPsychMatchResult> | null;
  },
): RomanticSajuDeepPayload["report"] {
  const { opening, ctx, screenPlan, ruleScreenPlan, snapshotPanel, locale, fortuneFlow, romanticContextInput, dynamicsTyped } =
    prepared;
  const generatedAt = new Date().toISOString();

  // Round 2 — deterministic narrative guards (no second LLM). Uses canonical
  // facets already available on romanticContextInput before projection inject.
  const reassuranceFinalizedEarly = reassuranceValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const comparisonFinalizedEarly = comparisonTableValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const postValidated = postValidateRomanticNarrative(
    parsed.report as Record<string, unknown>,
    {
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      matchAGivesB: reassuranceFinalizedEarly?.match_a_gives_b ?? null,
      matchBGivesA: reassuranceFinalizedEarly?.match_b_gives_a ?? null,
      comparisonLeans: comparisonFinalizedEarly
        ? {
            conflict: comparisonFinalizedEarly.conflict,
            affection: comparisonFinalizedEarly.affection,
            stress: comparisonFinalizedEarly.stress,
            expression: comparisonFinalizedEarly.expression,
            decision: comparisonFinalizedEarly.decision,
            communication: comparisonFinalizedEarly.communication,
          }
        : undefined,
      locale,
    },
  );
  const narrativeGuards = postValidated.fixes;
  parsed = {
    ...parsed,
    report: postValidated.report as RomanticSajuDeepReport["report"],
  };

  // Phase 6-2d1 — after LLM spread, server balance projection wins.
  const balanceFinalized = balanceOfPowerValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const balanceCanonical =
    buildRomanticBalanceOfPowerCanonical(balanceFinalized);
  const balanceProjection = buildRomanticBalanceClientProjection(
    balanceCanonical?.value,
  );
  const reportWithBalanceProjection = injectRomanticBalanceClientProjection(
    parsed.report as RomanticSajuDeepReport["report"] & {
      canonical_projections?: {
        balance_of_power?: unknown;
        recovery_speed?: unknown;
        [key: string]: unknown;
      };
    },
    balanceProjection,
  );

  // Phase 6-2d2 — recovery_speed only (residual excluded; Option B).
  const recoveryFinalized = recoverySpeedValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const recoveryCanonical =
    buildRomanticRecoverySpeedCanonical(recoveryFinalized);
  const recoveryProjection = buildRomanticRecoveryClientProjection(
    recoveryCanonical?.value,
  );
  const reportWithRecoveryProjection = injectRomanticRecoveryClientProjection(
    reportWithBalanceProjection,
    recoveryProjection,
  );

  // Phase 6-2d3 — reassurance_signal (need/give/match facets).
  const reassuranceFinalized = reassuranceValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const reassuranceCanonical =
    buildRomanticReassuranceCanonical(reassuranceFinalized);
  const reassuranceProjection = buildRomanticReassuranceClientProjection(
    reassuranceCanonical?.value,
  );
  const reportWithReassuranceProjection =
    injectRomanticReassuranceClientProjection(
      reportWithRecoveryProjection,
      reassuranceProjection,
    );

  // Phase 6-2d4 — unconscious_role_play (no saju_frame_direction).
  const rolePlayFinalized = rolePlayValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const rolePlayCanonical = buildRomanticRolePlayCanonical(rolePlayFinalized);
  const rolePlayProjection = buildRomanticRolePlayClientProjection(
    rolePlayCanonical?.value,
  );
  const reportWithRolePlayProjection = injectRomanticRolePlayClientProjection(
    reportWithReassuranceProjection,
    rolePlayProjection,
  );

  // Phase 6-2d5 — residual (independent of recovery_speed).
  const residualFinalized = residualValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const residualCanonical = buildRomanticResidualCanonical(residualFinalized);
  const residualProjection = buildRomanticResidualClientProjection(
    residualCanonical?.value,
  );
  const reportWithResidualProjection = injectRomanticResidualClientProjection(
    reportWithRolePlayProjection,
    residualProjection,
  );

  // Phase 6-2d6 — expression_speed (direction + optional corroboration meta).
  const expressionSpeedFinalized = expressionSpeedValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const expressionSpeedCanonical = buildRomanticExpressionSpeedCanonical(
    expressionSpeedFinalized,
  );
  const expressionSpeedProjection =
    buildRomanticExpressionSpeedClientProjection(
      expressionSpeedCanonical?.value,
    );
  const reportWithExpressionProjection =
    injectRomanticExpressionSpeedClientProjection(
      reportWithResidualProjection,
      expressionSpeedProjection,
    );

  // Phase 6-2d7 — comparison_table ×6 (per-row lean/align/confidence).
  const comparisonFinalized = comparisonTableValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const comparisonCanonical =
    buildRomanticComparisonTableCanonical(comparisonFinalized);
  const comparisonProjection = buildRomanticComparisonTableClientProjection(
    comparisonCanonical?.value,
  );
  const reportWithComparisonProjection =
    injectRomanticComparisonTableClientProjection(
      reportWithExpressionProjection,
      comparisonProjection,
    );

  // Phase 6-2d7 — saju_frame_direction (+ derived anchor_is_a).
  const sajuFrameFinalized = sajuFrameDirectionValueFromDominantCategories(
    romanticContextInput.dominant_categories,
  );
  const sajuFrameCanonical =
    buildRomanticSajuFrameDirectionCanonical(sajuFrameFinalized);
  const sajuFrameProjection =
    buildRomanticSajuFrameDirectionClientProjection(
      sajuFrameCanonical?.value,
    );
  const reportWithSajuFrameProjection =
    injectRomanticSajuFrameDirectionClientProjection(
      reportWithComparisonProjection,
      sajuFrameProjection,
    );

  // cross_chart_tension — 일주 교차 충형해파(pairAnalysis.dayBranchCrossHits),
  // Conflict Translation의 구조적 사주 근거로만 쓰임 (대사 생성 없음). dynamicsTyped
  // 에서 직접 finalize — dominant_categories는 hits[] 배열을 담을 수 없음.
  const crossChartTensionFinalized = crossChartTensionValueFromFinalized(
    dynamicsTyped?.crossChartTension,
  );
  const crossChartTensionCanonical = buildRomanticCrossChartTensionCanonical(
    crossChartTensionFinalized,
  );
  const crossChartTensionProjection =
    buildRomanticCrossChartTensionClientProjection(
      crossChartTensionCanonical?.value,
    );
  const reportWithCrossChartTensionProjection =
    injectRomanticCrossChartTensionClientProjection(
      reportWithSajuFrameProjection,
      crossChartTensionProjection,
    );

  // cross_chart_stem_combine — 천간합(A×B), 4×4 궁위 전체.
  const stemCombineFinalized = stemCombineValueFromDynamicsSnapshot(
    dynamicsTyped ?? undefined,
  );
  const stemCombineCanonical = buildRomanticStemCombineCanonical(
    stemCombineFinalized,
  );
  const stemCombineProjection = buildRomanticStemCombineClientProjection(
    stemCombineCanonical?.value,
  );
  const reportWithStemCombineProjection = injectRomanticStemCombineClientProjection(
    reportWithCrossChartTensionProjection,
    stemCombineProjection,
  );

  // cross_chart_six_combine — 지지 육합(A×B), 이미 계산된 pairAnalysis.allCrossHits 재사용.
  const sixCombineFinalized = sixCombineValueFromDynamicsSnapshot(
    dynamicsTyped ?? undefined,
  );
  const sixCombineCanonical = buildRomanticSixCombineCanonical(
    sixCombineFinalized,
  );
  const sixCombineProjection = buildRomanticSixCombineClientProjection(
    sixCombineCanonical?.value,
  );
  const reportWithSixCombineProjection = injectRomanticSixCombineClientProjection(
    reportWithStemCombineProjection,
    sixCombineProjection,
  );

  // cross_chart_trio — 삼합/방합(A+B 합산 지지), 양쪽 모두 기여한 경우만.
  const crossTrioFinalized = crossTrioValueFromDynamicsSnapshot(
    dynamicsTyped ?? undefined,
  );
  const crossTrioCanonical = buildRomanticCrossTrioCanonical(crossTrioFinalized);
  const crossTrioProjection = buildRomanticCrossTrioClientProjection(
    crossTrioCanonical?.value,
  );
  const reportWithCrossTrioProjection = injectRomanticCrossTrioClientProjection(
    reportWithSixCombineProjection,
    crossTrioProjection,
  );

  // cross_chart_wonjin_guimun — 원진/귀문(A×B), 4×4 궁위 전체.
  const wonjinGuimunFinalized = wonjinGuimunValueFromDynamicsSnapshot(
    dynamicsTyped ?? undefined,
  );
  const wonjinGuimunCanonical = buildRomanticWonjinGuimunCanonical(
    wonjinGuimunFinalized,
  );
  const wonjinGuimunProjection = buildRomanticWonjinGuimunClientProjection(
    wonjinGuimunCanonical?.value,
  );
  const reportWithWonjinGuimunProjection =
    injectRomanticWonjinGuimunClientProjection(
      reportWithCrossTrioProjection,
      wonjinGuimunProjection,
    );

  // cross_chart_gongmang — 공망 교차(A×B, 양방향).
  const gongmangFinalized = gongmangValueFromDynamicsSnapshot(
    dynamicsTyped ?? undefined,
  );
  const gongmangCanonical = buildRomanticGongmangCanonical(gongmangFinalized);
  const gongmangProjection = buildRomanticGongmangClientProjection(
    gongmangCanonical?.value,
  );
  const reportWithGongmangProjection = injectRomanticGongmangClientProjection(
    reportWithWonjinGuimunProjection,
    gongmangProjection,
  );

  // pair_ce_bonding — shared Pair CE non-tension packets for Special Dynamics.
  const pairCeBondingValue = buildRomanticPairCeBondingValue(
    dynamicsTyped?.pairNonTensionPackets ?? null,
  );
  const pairCeBondingCanonical =
    buildRomanticPairCeBondingCanonical(pairCeBondingValue);
  const reportWithPairCeBondingProjection =
    injectRomanticPairCeBondingClientProjection(
      reportWithGongmangProjection,
      pairCeBondingCanonical?.value ?? null,
    );

  // Phase 6-2d7 — dialogue faster/slower slots follow expression_speed.direction.
  const priorConflict =
    (
      reportWithPairCeBondingProjection as {
        section_3_conversation_patterns?: {
          conflict_situation?: {
            dialogue_table?: unknown;
            [key: string]: unknown;
          };
          [key: string]: unknown;
        };
      }
    ).section_3_conversation_patterns?.conflict_situation ?? null;
  const boundDialogue = bindDialogueTableToExpressionSpeed(
    (priorConflict?.dialogue_table ?? null) as
      | Array<Record<string, unknown>>
      | null,
    expressionSpeedFinalized?.direction ?? null,
    { nameA: params.nicknameA, nameB: params.nicknameB },
  );
  const reportWithProjections = priorConflict
    ? {
        ...reportWithPairCeBondingProjection,
        section_3_conversation_patterns: {
          ...(
            reportWithPairCeBondingProjection as {
              section_3_conversation_patterns?: Record<string, unknown>;
            }
          ).section_3_conversation_patterns,
          conflict_situation: {
            ...priorConflict,
            dialogue_table: boundDialogue,
          },
        },
      }
    : reportWithPairCeBondingProjection;

  const summaryLine = `▫ ${eventScores.overall.activation}% · ▫ ${eventScores.overall.benefit}% · ▫ ${eventScores.overall.risk}%`;

  return {
    ...reportWithProjections,
    summary_line: summaryLine,
    section_1_summary: {
      relationship_name: opening.relationship_name,
      one_line_summary: opening.one_line_summary,
      grade: opening.grade,
    },
    romantic_context_input: romanticContextInput,
    meta: {
      ...(parsed.report.meta ?? {}),
      language: locale,
      locale: locale === "en" ? "en-US" : "ko-KR",
      analysis_version: "v2.17",
      generated_at: generatedAt,
      headline_engine: "selector_v2+rule_library_v2+palace_weight+tri_score",
      saju_engine: "calculateSajuBundle_v2",
      saju_master_schema:
        params.sajuMasterA?.schema_version ??
        params.sajuMasterB?.schema_version ??
        null,
      prompt_input_mode: "domain_signals_digest_v1",
      narrative_guards: narrativeGuards,
      narrative_guards_mode: "deterministic_post_validate_v1",
      saju_provenance: {
        a: params.sajuProvenanceA ?? null,
        b: params.sajuProvenanceB ?? null,
      },
      uncertain_items: ctx.uncertainItems,
      event_scores: opening.event_scores ?? ctx.eventScores,
      romantic_fortune_flow: fortuneFlow,
      psych_match: extras.psychMatch,
      chemistry_approx: extras.psychMatch?.axis_results?.length
        ? buildChemistryApproxScores(extras.psychMatch.axis_results)
        : null,
      strength_weakness: extras.psychMatch?.axis_results?.length
        ? buildStrengthWeaknessLists(extras.psychMatch.axis_results, locale)
        : null,
      opening: {
        selected_insight_id: opening.selected_insight_id,
        grade_reason: opening.grade_reason,
      },
      ranked_insights: opening.ranked_insights.map((i) => ({
        id: i.id,
        source: i.source,
        ruleType: i.ruleType,
        score: i.score,
        headline: i.headline,
        body: i.body,
        screenHint: i.screenHint,
      })),
      screen_plan: screenPlan,
      rule_screen_plan: ruleScreenPlan,
      snapshot_panel: snapshotPanel ?? null,
    },
  };
}

async function callLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (abortSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const completion = await openai.chat.completions.create(
    {
      model: romanticLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.55,
      max_tokens: romanticSajuDeepMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

async function callLlmJsonAndParse<T>(
  openai: OpenAI,
  system: string,
  user: string,
  label: string,
  abortSignal?: AbortSignal,
): Promise<T> {
  return fetchLlmJsonWithParseRetry<T>(
    () => callLlmJson(openai, system, user, abortSignal),
    { label },
  );
}

export async function runRomanticSajuDeepAnalysis(
  openai: OpenAI,
  params: RomanticSajuDeepRunParams,
  options?: { abortSignal?: AbortSignal },
): Promise<RomanticSajuDeepPayload> {
  const prepared = prepareRomanticSajuDeepRun(params);
  const abortSignal = options?.abortSignal;

  const [parsed, psychMatch] = await Promise.all([
    callLlmJsonAndParse<RomanticSajuDeepReport>(
      openai,
      prepared.systemPrompt,
      prepared.userPrompt,
      "romantic-primary",
      abortSignal,
    ),
    Promise.resolve().then(() => buildPsychMatchParallel(params)),
  ]);

  if (!isRomanticSajuDeepReport(parsed)) {
    throw new Error("LLM 응답이 연인 심화 Output Schema와 맞지 않습니다.");
  }

  const report = finalizeRomanticSajuDeepReport(parsed, prepared, params, {
    psychMatch,
  });

  return {
    format: ROMANTIC_SAJU_DEEP_FORMAT,
    report,
  };
}

export {
  ROMANTIC_SAJU_DEEP_SYSTEM_PROMPT,
  getRomanticSajuDeepSystemPrompt,
  type RomanticSajuDeepLocale,
} from "./system";
export { buildRomanticSajuDeepUserPrompt } from "./user";
export { ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA } from "./outputSchema";
export {
  ROMANTIC_SAJU_DEEP_SELF_REFINE_PROMPT,
  buildRomanticSajuDeepSelfRefinePrompt,
} from "./selfRefine";
export {
  buildSpecialBondFewShotExample,
  buildSpecialBondSystemPromptBlock,
} from "./specialBondWritingRules";
