import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { resolvePersonalityLabel } from "@/lib/relationship/romanticEverydayText";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import {
  computeWorkCompatibilityGrade,
  type WorkMasterScores,
} from "@/lib/relationship/workPairEventScores";
import { buildPairSajuBlueprint } from "@/lib/saju/sajuBlueprint";
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
    computeWorkCompatibilityGrade(workPairAnalysis, tenGodComplement);

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
  };
}
