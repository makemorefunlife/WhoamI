import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import type { TenGodActivationRow } from "@/lib/saju/tenGodActivation";
import type { RomanticCrossBodyContext } from "@/lib/relationship/romanticEverydayText";
import { resolveDayStemNamesFromPair } from "@/lib/relationship/romanticEverydayText";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { RelationshipAxisKey } from "@/lib/relationship/normalizeRelationshipPerspectives";
import type {
  RomanticInsightCandidate,
  RomanticOpeningSelection,
} from "@/lib/relationship/romanticHeadline/types";
import type { CrossChartHit, PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import type {
  CurrentSelfProfile,
  PrimaryAxisKey,
  SecondaryAxisKey,
} from "@/lib/v2/survey/types";

export type DomainKey =
  | "mbti"
  | "disc"
  | "enneagram"
  | "riasec"
  | "pss"
  | "tci";

export type SurveyPatternRecord = Partial<Record<DomainKey, string>>;

export type RomanticRuleScreen = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RomanticRuleScreenKey =
  | "headline"
  | "snapshot"
  | "attraction"
  | "hidden_pattern"
  | "compare"
  | "story_expansion"
  | "action";

export type StrengthSnapshot = {
  label: string;
  note: string;
};

export type TenGodCounts = Record<string, number>;

export type RelationshipBasicAxes = Partial<
  Record<
    RelationshipAxisKey,
    {
      my_line?: string;
      partner_line?: string;
      insights?: string[];
      actions?: string[];
    }
  >
>;

/**
 * Screen rule 매칭용 컨텍스트.
 * saju·pair·survey 값은 buildRomanticRuleContext에서 1회만 준비하고,
 * 개별 rule은 여기서 참조만 한다 (새 계산 금지).
 */
import type { DayStemRomanticProfile } from "@/lib/relationship/dayStemRomanticProfile";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";

export type RomanticRuleContext = {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  strengthA: StrengthSnapshot;
  strengthB: StrengthSnapshot;
  /** 조후(온도) 밴드 — [시작점] 헤드라인의 "촛불과 촛불" 계열 한난 상호보완 규칙에 씀 */
  temperatureBandA: "cold" | "neutral" | "hot";
  temperatureBandB: "cold" | "neutral" | "hot";
  /** 일간 천간 코드(gap/eul/byeong/...) — 천간합(A/B 간 일간 합) 판정에 씀 */
  dayStemCodeA: string;
  dayStemCodeB: string;
  metaphorA: string;
  metaphorB: string;
  metaphorCombo: string;
  romanticProfileA: DayStemRomanticProfile | null;
  romanticProfileB: DayStemRomanticProfile | null;
  tenGodsA: TenGodCounts;
  tenGodsB: TenGodCounts;
  grade: "A" | "B" | "C" | "D";
  gradeReason: string;
  eventScores: RelationshipEventScores;
  tenGodsActivationA: TenGodActivationRow[];
  tenGodsActivationB: TenGodActivationRow[];
  uncertainItems: string[];
  surveyProfileA?: CurrentSelfProfile | null;
  surveyProfileB?: CurrentSelfProfile | null;
  surveyPatternA?: SurveyPatternRecord | null;
  surveyPatternB?: SurveyPatternRecord | null;
  relationshipAxes?: RelationshipBasicAxes | null;
  insightPool?: RomanticInsightCandidate[];
  rankedInsights?: RomanticInsightCandidate[];
  opening?: RomanticOpeningSelection;
  locale: RomanticHeadlineLocale;
};

export type RomanticRule<TOut> = {
  id: string;
  screen: RomanticRuleScreen;
  priority: number;
  when: (ctx: RomanticRuleContext) => boolean;
  build: (ctx: RomanticRuleContext) => TOut;
};

export type HeadlineRuleOutput = {
  ruleId: string;
  headline: string;
  body: string;
  insightTags: string[];
};

import type { RomanticSnapshotPanel } from "@/lib/relationship/romanticSnapshot/buildRomanticSnapshot";

export type SnapshotRuleOutput = {
  ruleId: string;
  grade: string;
  keywords: string[];
  gaugeLabel: string;
  representativeLine: string;
  panel: RomanticSnapshotPanel;
};

export type AttractionRuleOutput = {
  ruleId: string;
  headline: string;
  body: string;
  influenceTags: string[];
  togetherChangeHint: string;
};

export type HiddenPatternRuleOutput = {
  ruleId: string;
  headline: string;
  body: string;
  crisisHint: string;
  hiddenTags: string[];
};

export type CompareRuleOutput = {
  ruleId: string;
  rowThemes: Array<{ label: string; focus: string }>;
};

export type StoryExpansionRuleOutput = {
  ruleId: string;
  headline: string;
  body: string;
  themes: string[];
};

export type ActionRuleOutput = {
  ruleId: string;
  goodPhrases: string[];
  avoidPhrases: string[];
  recoveryTip: string;
  togetherStarter: string;
};

export type RomanticRuleScreenResult =
  | { screen: 1; key: "headline"; output: HeadlineRuleOutput }
  | { screen: 2; key: "snapshot"; output: SnapshotRuleOutput }
  | { screen: 3; key: "attraction"; output: AttractionRuleOutput }
  | { screen: 4; key: "hidden_pattern"; output: HiddenPatternRuleOutput }
  | { screen: 5; key: "compare"; output: CompareRuleOutput }
  | { screen: 6; key: "story_expansion"; output: StoryExpansionRuleOutput }
  | { screen: 7; key: "action"; output: ActionRuleOutput };

export type RomanticRuleScreenPlan = RomanticRuleScreenResult & {
  title: string;
  resolvedFrom: "rule" | "fallback";
};

export const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);
export const TENSION_CROSS = new Set(["충", "형", "해", "파"]);

export function crossHits(
  ctx: RomanticRuleContext,
  types?: string | string[],
): CrossChartHit[] {
  const list = ctx.pairAnalysis.allCrossHits;
  if (!types) return list;
  const set = new Set(Array.isArray(types) ? types : [types]);
  return list.filter((h) => set.has(h.type));
}

export function hasCross(ctx: RomanticRuleContext, type: string): boolean {
  return crossHits(ctx, type).length > 0;
}

export function dayStemIncludes(ctx: RomanticRuleContext, fragment: string): boolean {
  return ctx.pairAnalysis.dayStemInteraction.includes(fragment);
}

export function strengthComplement(ctx: RomanticRuleContext): "ab" | "ba" | null {
  const aStrong = ctx.strengthA.label.includes("신강");
  const bStrong = ctx.strengthB.label.includes("신강");
  const aWeak = ctx.strengthA.label.includes("신약");
  const bWeak = ctx.strengthB.label.includes("신약");
  if (aStrong && bWeak) return "ab";
  if (bStrong && aWeak) return "ba";
  return null;
}

/** 한쪽 cold, 다른 쪽 hot일 때만 "ab"(A가 cold)/"ba"(B가 cold) — 조후(온도) 상호보완 */
export function temperatureComplement(ctx: RomanticRuleContext): "ab" | "ba" | null {
  if (ctx.temperatureBandA === "cold" && ctx.temperatureBandB === "hot") return "ab";
  if (ctx.temperatureBandB === "cold" && ctx.temperatureBandA === "hot") return "ba";
  return null;
}

/**
 * 갑기/을경/병신/정임/무계 — 일간 천간합 5쌍. `analyzeCrossChartRelations`(allCrossHits)는
 * 지지(육합/충/형/해/파)만 A-B 교차 비교하고 천간 자체는 안 봐서(`analyzeStemCombines`는
 * 한 사람 사주 내부 기둥끼리만 비교하는 별개 함수), A/B 일간끼리의 천간합은 여기서 직접 판정한다.
 */
const HEAVENLY_STEM_COMBINE_PAIRS = new Set(
  [
    ["gap", "gi"],
    ["eul", "gyeong"],
    ["byeong", "sin"],
    ["jeong", "im"],
    ["mu", "gye"],
  ].map(([a, b]) => [a, b].sort().join("-")),
);

export function hasHeavenlyStemCombine(ctx: RomanticRuleContext): boolean {
  const key = [ctx.dayStemCodeA, ctx.dayStemCodeB].sort().join("-");
  return HEAVENLY_STEM_COMBINE_PAIRS.has(key);
}

export function topTenGod(ctx: RomanticRuleContext, who: "a" | "b"): string | null {
  const counts = who === "a" ? ctx.tenGodsA : ctx.tenGodsB;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

export function hasTenGod(
  ctx: RomanticRuleContext,
  who: "a" | "b",
  names: string[],
): boolean {
  const top = topTenGod(ctx, who);
  if (!top) return false;
  return names.some((n) => top.includes(n));
}

export function primaryAxis(
  ctx: RomanticRuleContext,
  who: "a" | "b",
  axis: PrimaryAxisKey,
): number | null {
  const profile = who === "a" ? ctx.surveyProfileA : ctx.surveyProfileB;
  return profile?.primary_axes?.[axis] ?? null;
}

export function axisGap(ctx: RomanticRuleContext, axis: PrimaryAxisKey): number | null {
  const a = primaryAxis(ctx, "a", axis);
  const b = primaryAxis(ctx, "b", axis);
  if (a == null || b == null) return null;
  return Math.abs(a - b);
}

export function higherAxis(
  ctx: RomanticRuleContext,
  axis: PrimaryAxisKey,
): "a" | "b" | "tie" | null {
  const a = primaryAxis(ctx, "a", axis);
  const b = primaryAxis(ctx, "b", axis);
  if (a == null || b == null) return null;
  if (a > b + 5) return "a";
  if (b > a + 5) return "b";
  return "tie";
}

export function secondaryAxis(
  ctx: RomanticRuleContext,
  who: "a" | "b",
  axis: SecondaryAxisKey,
): number | null {
  const profile = who === "a" ? ctx.surveyProfileA : ctx.surveyProfileB;
  return profile?.secondary_axes?.[axis] ?? null;
}

export function secondaryAxisGap(
  ctx: RomanticRuleContext,
  axis: SecondaryAxisKey,
): number | null {
  const a = secondaryAxis(ctx, "a", axis);
  const b = secondaryAxis(ctx, "b", axis);
  if (a == null || b == null) return null;
  return Math.abs(a - b);
}

export function higherSecondaryAxis(
  ctx: RomanticRuleContext,
  axis: SecondaryAxisKey,
): "a" | "b" | "tie" | null {
  const a = secondaryAxis(ctx, "a", axis);
  const b = secondaryAxis(ctx, "b", axis);
  if (a == null || b == null) return null;
  if (a > b + 5) return "a";
  if (b > a + 5) return "b";
  return "tie";
}

export function hasPersonRelation(
  ctx: RomanticRuleContext,
  who: "a" | "b",
  types: string | string[],
): boolean {
  const json = who === "a" ? ctx.sajuJsonA : ctx.sajuJsonB;
  const set = new Set(Array.isArray(types) ? types : [types]);
  return (json.relations ?? []).some((r) => r.type && set.has(r.type));
}

export function surveyDomainPattern(
  ctx: RomanticRuleContext,
  who: "a" | "b",
  domain: DomainKey,
  pattern: string,
): boolean {
  const record = who === "a" ? ctx.surveyPatternA : ctx.surveyPatternB;
  return record?.[domain] === pattern;
}

export function combinedElementWeak(ctx: RomanticRuleContext): boolean {
  return ctx.pairAnalysis.combinedElementNote.includes("약한 기운");
}

export function pickRelationshipAction(ctx: RomanticRuleContext, index = 0): string | null {
  const axes = ctx.relationshipAxes;
  if (!axes) return null;
  for (const key of Object.keys(axes) as RelationshipAxisKey[]) {
    const actions = axes[key]?.actions?.filter(Boolean);
    if (actions?.[index]) return actions[index]!;
  }
  return null;
}

export function pickRelationshipInsight(ctx: RomanticRuleContext, index = 0): string | null {
  const axes = ctx.relationshipAxes;
  if (!axes) return null;
  for (const key of Object.keys(axes) as RelationshipAxisKey[]) {
    const insights = axes[key]?.insights?.filter(Boolean);
    if (insights?.[index]) return insights[index]!;
  }
  return null;
}

export function romanticCrossBodyContext(
  ctx: RomanticRuleContext,
): RomanticCrossBodyContext {
  const { stemNameA, stemNameB } = resolveDayStemNamesFromPair(
    ctx.sajuJsonA,
    ctx.sajuJsonB,
  );
  return {
    nicknameA: ctx.nicknameA,
    nicknameB: ctx.nicknameB,
    metaphorA: ctx.metaphorA,
    metaphorB: ctx.metaphorB,
    romanticProfileA: ctx.romanticProfileA,
    romanticProfileB: ctx.romanticProfileB,
    stemNameA,
    stemNameB,
    dayStemInteraction: ctx.pairAnalysis.dayStemInteraction,
  };
}
