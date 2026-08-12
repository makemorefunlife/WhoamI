import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { resolvePersonalityLabel } from "@/lib/relationship/romanticEverydayText";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import {
  computeWorkCompatibilityGrade,
  type WorkMasterScores,
} from "@/lib/relationship/workPairEventScores";
import { buildPairSajuBlueprint } from "@/lib/saju/sajuBlueprint";
import { buildDomainPairLensFromCharts } from "@/lib/personCore/pairContextEngine";
import type { DomainPairLensOutput } from "@/lib/personCore/pairContextEngine";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import {
  analyzeWorkPairSaju,
  type WorkPairSajuAnalysis,
} from "@/lib/saju/workPairAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import {
  analyzeTenGodComplement,
  type TenGodComplementResult,
} from "./tenGodComplement";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { ChartContext } from "@/lib/saju/chartContext";
import type {
  CanonicalPairSajuFacts,
  CanonicalPersonalSajuFacts,
} from "@/lib/saju/pairChartAnalysis";
import {
  extractCanonicalPairFacts,
  extractCanonicalPersonalFacts,
} from "@/lib/saju/pairChartAnalysis";

export type WorkColleagueContext = {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  workPairAnalysis: WorkPairSajuAnalysis;
  eventScores: RelationshipEventScores;
  grade: "A" | "B" | "C" | "D";
  gradeReason: string;
  strengthA: { label: string; note: string };
  strengthB: { label: string; note: string };
  metaphorA: string;
  metaphorB: string;
  tenGodsA: Record<string, number>;
  tenGodsB: Record<string, number>;
  tenGodComplement: TenGodComplementResult;
  masterScores: WorkMasterScores;
  uncertainItems: string[];
  locale: Locale;
  /**
   * PersonCore bake-in 명리 신호(월주 격국·신살 등) — SSOT.
   * 없으면(레거시 캐시 등) 캐릭터 타입/이상적 역할 로직은 raw-count 폴백으로
   * 안전하게 동작한다(officeLanguage.ts의 resolveWorkCategory 참고).
   */
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  /** Shared Pair CE → Work lens (packets only; no fact recalc). */
  pairLens: DomainPairLensOutput;
  canonicalPersonalA: CanonicalPersonalSajuFacts;
  canonicalPersonalB: CanonicalPersonalSajuFacts;
  canonicalPairFacts: CanonicalPairSajuFacts;
  chartA: ChartContext;
  chartB: ChartContext;
};

/** 동료 전용 컨텍스트 — 연인 rule context·일지 친밀 점수 미사용 */
export function buildWorkColleagueContext(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  locale?: Locale;
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
}): WorkColleagueContext {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const blueprint = buildPairSajuBlueprint(params);
  const { core, uncertainItems } = blueprint;

  const workPairAnalysis = analyzeWorkPairSaju(
    core.pillarsA,
    core.pillarsB,
    core,
  );

  const tenGodComplement = analyzeTenGodComplement({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    countsA: core.tenGodsA,
    countsB: core.tenGodsB,
    locale,
  });

  const { grade, reason, eventScores, masterScores } =
    computeWorkCompatibilityGrade(workPairAnalysis, tenGodComplement, locale);

  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    pairAnalysis: workPairAnalysis.base,
    workPairAnalysis,
    eventScores,
    grade,
    gradeReason: reason,
    strengthA: estimateStrengthBalance(core.pillarsA),
    strengthB: estimateStrengthBalance(core.pillarsB),
    metaphorA: resolvePersonalityLabel(params.sajuJsonA),
    metaphorB: resolvePersonalityLabel(params.sajuJsonB),
    tenGodsA: core.tenGodsA,
    tenGodsB: core.tenGodsB,
    tenGodComplement,
    masterScores,
    uncertainItems,
    locale,
    workSignalsA: params.workSignalsA,
    workSignalsB: params.workSignalsB,
    pairLens: buildDomainPairLensFromCharts(
      "work",
      core.chartA,
      core.chartB,
      {
        birthTimeUnknownA: params.birthTimeUnknownA,
        birthTimeUnknownB: params.birthTimeUnknownB,
      },
    ),
    canonicalPersonalA: extractCanonicalPersonalFacts(core.chartA),
    canonicalPersonalB: extractCanonicalPersonalFacts(core.chartB),
    canonicalPairFacts: extractCanonicalPairFacts(core.chartA, core.chartB),
    chartA: core.chartA,
    chartB: core.chartB,
  };
}
