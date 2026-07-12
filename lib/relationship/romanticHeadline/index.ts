export type {
  RomanticInsightCandidate,
  RomanticOpeningSelection,
  RomanticInsightSource,
  RomanticScreenHint,
} from "./types";
export {
  buildRomanticInsightPool,
  computePairAnalysisOnce,
} from "./buildInsightPool";
export { selectRomanticOpening, computeCompatibilityGrade } from "./selectOpening";
export {
  buildRomanticScreenPlan,
  buildRomanticScreenPlanFromStored,
  getScreen1Opening,
  type RomanticScreenSlot,
  type RomanticScreenKey,
  type StoredRankedInsight,
} from "./screenMap";

import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildRomanticRulesBundle } from "@/lib/relationship/romanticRules";
import { buildRomanticInsightPool, computePairAnalysisOnce } from "./buildInsightPool";
import { selectRomanticOpening } from "./selectOpening";
import { buildRomanticScreenPlan } from "./screenMap";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import type { RomanticOpeningSelection, RomanticScreenSlot } from "./types";
import type { RomanticRuleScreenPlan } from "@/lib/relationship/romanticRules";

export type RomanticHeadlineContext = {
  pairAnalysis: PairSajuAnalysis;
  opening: RomanticOpeningSelection;
  /** 레거시 6-screen plan (ranked insight 기반) */
  screenPlan: RomanticScreenSlot[];
  /** Screen 1~7 rule library plan */
  ruleScreenPlan: RomanticRuleScreenPlan[];
  insightPool: ReturnType<typeof buildRomanticInsightPool>;
};

/** pair 분석 1회 + insight pool + opening + screen plan (selector + rule library) */
export function buildRomanticHeadlineContext(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  locale?: import("@/lib/relationship/romanticHeadline/locale").RomanticHeadlineLocale;
}): RomanticHeadlineContext {
  const bundle = buildRomanticRulesBundle(params);
  const { pairAnalysis, opening, insightPool, ruleScreenPlan } = bundle;
  const screenPlan = buildRomanticScreenPlan({
    ranked: opening.ranked_insights,
    pool: insightPool,
  });
  return { pairAnalysis, opening, screenPlan, ruleScreenPlan, insightPool };
}
