import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import {
  resolvePersonalityLabel,
  joinPersonalityHeadline,
} from "@/lib/relationship/romanticEverydayText";
import {
  resolveDayStemRomanticProfileFromSaju,
  romanticHeadlineFromProfiles,
} from "@/lib/relationship/dayStemRomanticProfile";
import {
  buildRomanticInsightPool,
  computePairAnalysisOnce,
} from "@/lib/relationship/romanticHeadline/buildInsightPool";
import {
  computeCompatibilityGrade,
  selectRomanticOpening,
} from "@/lib/relationship/romanticHeadline/selectOpening";
import type { RomanticOpeningSelection } from "@/lib/relationship/romanticHeadline/types";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import { analyzeTenGodActivation } from "@/lib/saju/tenGodActivation";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { fromLegacyShortLocale } from "@/lib/i18n/llmLocale";
import { resolveActionRule, ACTION_RULES } from "./actionRules";
import {
  resolveAttractionRule,
  ATTRACTION_INFLUENCE_RULES,
} from "./attractionInfluenceRules";
import { resolveCompareRule, COMPARE_RULES } from "./compareRules";
import { resolveHeadlineRule, HEADLINE_RULES } from "./headlineRules";
import {
  resolveHiddenPatternRule,
  HIDDEN_PATTERN_RULES,
} from "./hiddenPatternRules";
import { resolveSnapshotRule, SNAPSHOT_RULES } from "./snapshotRules";
import {
  resolveStoryExpansionRule,
  STORY_EXPANSION_RULES,
} from "./storyExpansionRules";
import type {
  RelationshipBasicAxes,
  RomanticRuleContext,
  RomanticRuleScreenPlan,
  SurveyPatternRecord,
  TenGodCounts,
} from "./types";

export type {
  RomanticRuleContext,
  RomanticRuleScreenPlan,
  HeadlineRuleOutput,
  SnapshotRuleOutput,
  AttractionRuleOutput,
  HiddenPatternRuleOutput,
  CompareRuleOutput,
  StoryExpansionRuleOutput,
  ActionRuleOutput,
  RomanticRule,
  RomanticRuleScreen,
  RomanticRuleScreenKey,
} from "./types";

export {
  HEADLINE_RULES,
  resolveHeadlineRule,
} from "./headlineRules";
export {
  SNAPSHOT_RULES,
  resolveSnapshotRule,
} from "./snapshotRules";
export {
  ATTRACTION_INFLUENCE_RULES,
  resolveAttractionRule,
} from "./attractionInfluenceRules";
export {
  HIDDEN_PATTERN_RULES,
  resolveHiddenPatternRule,
} from "./hiddenPatternRules";
export { COMPARE_RULES, resolveCompareRule } from "./compareRules";
export {
  STORY_EXPANSION_RULES,
  resolveStoryExpansionRule,
} from "./storyExpansionRules";
export { ACTION_RULES, resolveActionRule } from "./actionRules";

export const ALL_ROMANTIC_RULES = [
  ...HEADLINE_RULES,
  ...SNAPSHOT_RULES,
  ...ATTRACTION_INFLUENCE_RULES,
  ...HIDDEN_PATTERN_RULES,
  ...COMPARE_RULES,
  ...STORY_EXPANSION_RULES,
  ...ACTION_RULES,
] as const;

const SCREEN_LAYOUT: Array<{
  screen: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  key: RomanticRuleScreenPlan["key"];
  title: string;
}> = [
  { screen: 1, key: "headline", title: "관계 한 줄" },
  { screen: 2, key: "snapshot", title: "관계 스냅샷" },
  { screen: 3, key: "attraction", title: "끌림과 영향" },
  { screen: 4, key: "hidden_pattern", title: "숨은 패턴" },
  { screen: 5, key: "compare", title: "서로 비교" },
  { screen: 6, key: "story_expansion", title: "이야기 확장" },
  { screen: 7, key: "action", title: "실천 조언" },
];

function countTenGods(sajuJson: SajuDataForIntegrated): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of sajuJson.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function mergeRelationshipAxes(
  basicA?: RelationshipBasicAxes | null,
  basicB?: RelationshipBasicAxes | null,
): RelationshipBasicAxes | null {
  if (!basicA && !basicB) return null;
  const merged: RelationshipBasicAxes = { ...(basicA ?? {}) };
  for (const [key, block] of Object.entries(basicB ?? {})) {
    const axis = key as keyof RelationshipBasicAxes;
    if (!block) continue;
    merged[axis] = {
      ...merged[axis],
      ...block,
      insights: [...(merged[axis]?.insights ?? []), ...(block.insights ?? [])],
      actions: [...(merged[axis]?.actions ?? []), ...(block.actions ?? [])],
    };
  }
  return merged;
}

function extractRelationshipAxes(resultBasic: unknown): RelationshipBasicAxes | null {
  if (!resultBasic || typeof resultBasic !== "object") return null;
  const perspectives = (resultBasic as Record<string, unknown>).perspectives;
  if (!perspectives || typeof perspectives !== "object") return null;
  const blocks = Object.values(perspectives as Record<string, unknown>);
  const axesList = blocks
    .map((b) => (b && typeof b === "object" ? (b as RelationshipBasicAxes) : null))
    .filter(Boolean) as RelationshipBasicAxes[];
  return axesList.reduce<RelationshipBasicAxes | null>(
    (acc, cur) => mergeRelationshipAxes(acc, cur),
    null,
  );
}

/** pair·strength·grade·survey 등 1회 준비 — rule 파일은 참조만 */
export function buildRomanticRuleContext(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  surveyProfileA?: CurrentSelfProfile | null;
  surveyProfileB?: CurrentSelfProfile | null;
  surveyAnswersA?: Record<string, unknown> | null;
  surveyAnswersB?: Record<string, unknown> | null;
  resultBasic?: unknown;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  /** 이미 계산된 pair가 있으면 재사용 */
  pairAnalysis?: ReturnType<typeof computePairAnalysisOnce>;
  insightPool?: ReturnType<typeof buildRomanticInsightPool>;
  opening?: RomanticOpeningSelection;
  locale?: RomanticHeadlineLocale;
}): RomanticRuleContext {
  const locale = normalizeRomanticHeadlineLocale(params.locale);
  const pairAnalysis =
    params.pairAnalysis ??
    computePairAnalysisOnce(params.sajuJsonA, params.sajuJsonB);

  const pillarsA = sajuJsonToPillars(
    params.sajuJsonA.saju as Required<NonNullable<typeof params.sajuJsonA.saju>>,
  );
  const pillarsB = sajuJsonToPillars(
    params.sajuJsonB.saju as Required<NonNullable<typeof params.sajuJsonB.saju>>,
  );

  const strengthComplementDir =
    (() => {
      const aStrong = estimateStrengthBalance(pillarsA).label.includes("신강");
      const bStrong = estimateStrengthBalance(pillarsB).label.includes("신강");
      const aWeak = estimateStrengthBalance(pillarsA).label.includes("신약");
      const bWeak = estimateStrengthBalance(pillarsB).label.includes("신약");
      return (aStrong && bWeak) || (bStrong && aWeak);
    })();

  const fullLocale = fromLegacyShortLocale(locale);
  const validationA = validateSajuPillars(pillarsA, {
    birthTimeUnknown: params.birthTimeUnknownA,
    locale: fullLocale,
  });
  const validationB = validateSajuPillars(pillarsB, {
    birthTimeUnknown: params.birthTimeUnknownB,
    locale: fullLocale,
  });

  const uncertainItems = [
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceA,
      validationNotes: validationA.notes,
      locale: fullLocale,
    }),
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceB,
      validationNotes: validationB.notes,
      locale: fullLocale,
    }),
  ];

  const { grade, reason: gradeReason, eventScores } = computeCompatibilityGrade(
    pairAnalysis,
    { hasStrengthComplement: strengthComplementDir },
    locale,
  );
  const metaphorA = resolvePersonalityLabel(params.sajuJsonA);
  const metaphorB = resolvePersonalityLabel(params.sajuJsonB);
  const romanticProfileA = resolveDayStemRomanticProfileFromSaju(params.sajuJsonA, locale);
  const romanticProfileB = resolveDayStemRomanticProfileFromSaju(params.sajuJsonB, locale);
  const metaphorCombo =
    romanticProfileA && romanticProfileB
      ? romanticHeadlineFromProfiles(romanticProfileA, romanticProfileB, locale)
      : joinPersonalityHeadline(metaphorA, metaphorB, locale);

  const insightPool =
    params.insightPool ??
    buildRomanticInsightPool({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      sajuJsonA: params.sajuJsonA,
      sajuJsonB: params.sajuJsonB,
      pairAnalysis,
      locale,
    });

  const opening =
    params.opening ??
    selectRomanticOpening({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      sajuJsonA: params.sajuJsonA,
      sajuJsonB: params.sajuJsonB,
      pairAnalysis,
      insightPool,
      hasStrengthComplement: strengthComplementDir,
      locale,
    });

  const surveyPatternA: SurveyPatternRecord | null = null;
  const surveyPatternB: SurveyPatternRecord | null = null;

  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    pairAnalysis,
    strengthA: estimateStrengthBalance(pillarsA),
    strengthB: estimateStrengthBalance(pillarsB),
    metaphorA,
    metaphorB,
    metaphorCombo,
    romanticProfileA,
    romanticProfileB,
    tenGodsA: countTenGods(params.sajuJsonA),
    tenGodsB: countTenGods(params.sajuJsonB),
    tenGodsActivationA: analyzeTenGodActivation(params.sajuJsonA),
    tenGodsActivationB: analyzeTenGodActivation(params.sajuJsonB),
    grade,
    gradeReason,
    eventScores,
    uncertainItems,
    surveyProfileA: params.surveyProfileA,
    surveyProfileB: params.surveyProfileB,
    surveyPatternA,
    surveyPatternB,
    relationshipAxes: extractRelationshipAxes(params.resultBasic),
    insightPool,
    rankedInsights: opening.ranked_insights,
    opening,
    locale,
  };
}

/** Screen 1~7 rule plan — selector + rule library */
export function buildRomanticRuleScreenPlan(
  ctx: RomanticRuleContext,
): RomanticRuleScreenPlan[] {
  const headline = resolveHeadlineRule(ctx);
  const snapshot = resolveSnapshotRule(ctx);
  const attraction = resolveAttractionRule(ctx);
  const hidden = resolveHiddenPatternRule(ctx);
  const compare = resolveCompareRule(ctx);
  const story = resolveStoryExpansionRule(ctx);
  const action = resolveActionRule(ctx);

  const outputs: Record<number, RomanticRuleScreenPlan> = {
    1: {
      screen: 1,
      key: "headline",
      title: SCREEN_LAYOUT[0]!.title,
      output: headline,
      resolvedFrom: headline.ruleId.endsWith("default") ? "fallback" : "rule",
    },
    2: {
      screen: 2,
      key: "snapshot",
      title: SCREEN_LAYOUT[1]!.title,
      output: snapshot,
      resolvedFrom: snapshot.ruleId.endsWith("default") ? "fallback" : "rule",
    },
    3: {
      screen: 3,
      key: "attraction",
      title: SCREEN_LAYOUT[2]!.title,
      output: attraction,
      resolvedFrom: attraction.ruleId.endsWith("together") ? "fallback" : "rule",
    },
    4: {
      screen: 4,
      key: "hidden_pattern",
      title: SCREEN_LAYOUT[3]!.title,
      output: hidden,
      resolvedFrom: hidden.ruleId.includes("fallback") || hidden.ruleId.endsWith("survey_insight")
        ? "fallback"
        : "rule",
    },
    5: {
      screen: 5,
      key: "compare",
      title: SCREEN_LAYOUT[4]!.title,
      output: compare,
      resolvedFrom: compare.ruleId.endsWith("default") ? "fallback" : "rule",
    },
    6: {
      screen: 6,
      key: "story_expansion",
      title: SCREEN_LAYOUT[5]!.title,
      output: story,
      resolvedFrom: story.ruleId.endsWith("default") ? "fallback" : "rule",
    },
    7: {
      screen: 7,
      key: "action",
      title: SCREEN_LAYOUT[6]!.title,
      output: action,
      resolvedFrom: action.ruleId.endsWith("default") ? "fallback" : "rule",
    },
  };

  return SCREEN_LAYOUT.map((layout) => outputs[layout.screen]!);
}

/** headline context + 7-screen rule plan 한 번에 */
export function buildRomanticRulesBundle(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  surveyProfileA?: CurrentSelfProfile | null;
  surveyProfileB?: CurrentSelfProfile | null;
  surveyAnswersA?: Record<string, unknown> | null;
  surveyAnswersB?: Record<string, unknown> | null;
  resultBasic?: unknown;
  locale?: RomanticHeadlineLocale;
}) {
  const locale = normalizeRomanticHeadlineLocale(params.locale);
  const pairAnalysis = computePairAnalysisOnce(params.sajuJsonA, params.sajuJsonB);
  const insightPool = buildRomanticInsightPool({ ...params, pairAnalysis, locale });
  const opening = selectRomanticOpening({ ...params, pairAnalysis, insightPool, locale });
  const ctx = buildRomanticRuleContext({ ...params, pairAnalysis, insightPool, opening, locale });
  const ruleScreenPlan = buildRomanticRuleScreenPlan(ctx);

  const screen1 = ruleScreenPlan.find((s) => s.screen === 1);
  if (screen1 && screen1.key === "headline") {
    opening.relationship_name = screen1.output.headline;
    opening.one_line_summary = screen1.output.body;
    opening.selected_insight_id = screen1.output.ruleId;
  }

  return {
    ctx,
    pairAnalysis,
    opening,
    insightPool,
    ruleScreenPlan,
  };
}

export { SCREEN_LAYOUT as ROMANTIC_RULE_SCREEN_LAYOUT };
