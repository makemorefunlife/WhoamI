import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { resolvePersonalityLabel } from "@/lib/relationship/romanticEverydayText";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import {
  computeWorkCompatibilityGrade,
  type WorkMasterScores,
} from "@/lib/relationship/workPairEventScores";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import {
  analyzeWorkPairSaju,
  type WorkPairSajuAnalysis,
} from "@/lib/saju/workPairAnalysis";
import {
  analyzeTenGodComplement,
  countTenGodsForWork,
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
}): WorkColleagueContext {
  const pillarsA = sajuJsonToPillars(
    params.sajuJsonA.saju as Required<NonNullable<typeof params.sajuJsonA.saju>>,
  );
  const pillarsB = sajuJsonToPillars(
    params.sajuJsonB.saju as Required<NonNullable<typeof params.sajuJsonB.saju>>,
  );

  const workPairAnalysis = analyzeWorkPairSaju(pillarsA, pillarsB);

  const tenGodComplement = analyzeTenGodComplement({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
  });

  const { grade, reason, eventScores, masterScores } =
    computeWorkCompatibilityGrade(workPairAnalysis, tenGodComplement);

  const validationA = validateSajuPillars(pillarsA, {
    birthTimeUnknown: params.birthTimeUnknownA,
  });
  const validationB = validateSajuPillars(pillarsB, {
    birthTimeUnknown: params.birthTimeUnknownB,
  });

  const uncertainItems = [
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceA,
      validationNotes: validationA.notes,
    }),
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceB,
      validationNotes: validationB.notes,
    }),
  ];

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
    strengthA: estimateStrengthBalance(pillarsA),
    strengthB: estimateStrengthBalance(pillarsB),
    metaphorA: resolvePersonalityLabel(params.sajuJsonA),
    metaphorB: resolvePersonalityLabel(params.sajuJsonB),
    tenGodsA: countTenGodsForWork(params.sajuJsonA),
    tenGodsB: countTenGodsForWork(params.sajuJsonB),
    tenGodComplement,
    masterScores,
    uncertainItems,
  };
}
