import {
  humanizeDayStemInteraction,
  humanizeRomanticCrossBody,
  humanizeStrengthComplement,
  joinPersonalityHeadline,
} from "@/lib/relationship/romanticEverydayText";
import type { HeadlineRuleOutput, RomanticRule, RomanticRuleContext } from "./types";
import {
  crossHits,
  dayStemIncludes,
  hasCross,
  romanticCrossBodyContext,
  strengthComplement,
  TENSION_CROSS,
} from "./types";

export const HEADLINE_RULES: RomanticRule<HeadlineRuleOutput>[] = [
  {
    id: "headline_tension_day_cross",
    screen: 1,
    priority: 92,
    when: (ctx) =>
      crossHits(ctx, [...TENSION_CROSS]).some(
        (h) =>
          h.personA_pillar.startsWith("일주") || h.personB_pillar.startsWith("일주"),
      ),
    build: (ctx) => {
      const hit = crossHits(ctx, [...TENSION_CROSS]).sort(
        (a, b) => b.priority - a.priority,
      )[0]!;
      return {
        ruleId: "headline_tension_day_cross",
        headline: "가까울수록 예민해지는 조합",
        body: `${ctx.nicknameA}와 ${ctx.nicknameB} — ${humanizeRomanticCrossBody(hit, romanticCrossBodyContext(ctx), { closeRelationship: true })}`,
        insightTags: ["pair_cross", hit.type, "close"],
      };
    },
  },
  {
    id: "headline_day_stem_sangsaeng",
    screen: 1,
    priority: 88,
    when: (ctx) => dayStemIncludes(ctx, "상생"),
    build: (ctx) => {
      const { stemNameA, stemNameB } = romanticCrossBodyContext(ctx);
      return {
      ruleId: "headline_day_stem_sangsaeng",
      headline: ctx.metaphorCombo,
      body: humanizeDayStemInteraction(ctx.pairAnalysis.dayStemInteraction, {
        a: stemNameA,
        b: stemNameB,
      }),
      insightTags: ["pair_day_stem", "support"],
    };
    },
  },
  {
    id: "headline_yukhap_pull",
    screen: 1,
    priority: 85,
    when: (ctx) => hasCross(ctx, "육합"),
    build: (ctx) => {
      const hit = crossHits(ctx, "육합")[0]!;
      return {
        ruleId: "headline_yukhap_pull",
        headline: "끌리는데 이유가 있는 관계",
        body: humanizeRomanticCrossBody(hit, romanticCrossBodyContext(ctx)),
        insightTags: ["pair_cross", "육합"],
      };
    },
  },
  {
    id: "headline_strength_complement",
    screen: 1,
    priority: 80,
    when: (ctx) => strengthComplement(ctx) != null,
    build: (ctx) => {
      const dir = strengthComplement(ctx);
      const [strong, soft] =
        dir === "ab"
          ? [ctx.nicknameA, ctx.nicknameB]
          : [ctx.nicknameB, ctx.nicknameA];
      return {
        ruleId: "headline_strength_complement",
        headline: joinPersonalityHeadline(ctx.metaphorA, ctx.metaphorB),
        body: humanizeStrengthComplement(strong, soft),
        insightTags: ["strength_complement"],
      };
    },
  },
  {
    id: "headline_metaphor_default",
    screen: 1,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "headline_metaphor_default",
      headline: ctx.metaphorCombo,
      body: `${ctx.metaphorA} 같은 ${ctx.nicknameA}와 ${ctx.metaphorB} 같은 ${ctx.nicknameB}가 만나 서로 다른 리듬을 채워요.`,
      insightTags: ["metaphor_combo"],
    }),
  },
];

export function resolveHeadlineRule(ctx: RomanticRuleContext): HeadlineRuleOutput {
  const ranked = [...HEADLINE_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return HEADLINE_RULES[HEADLINE_RULES.length - 1]!.build(ctx);
}
