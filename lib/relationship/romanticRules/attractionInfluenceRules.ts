import {
  humanizeDayStemInteraction,
  humanizeElementNote,
  humanizeRomanticCrossBody,
  humanizeStrengthComplement,
} from "@/lib/relationship/romanticEverydayText";
import type { AttractionRuleOutput, RomanticRule, RomanticRuleContext } from "./types";
import {
  axisGap,
  combinedElementWeak,
  crossHits,
  dayStemIncludes,
  hasCross,
  higherAxis,
  POSITIVE_CROSS,
  romanticCrossBodyContext,
  strengthComplement,
} from "./types";

export const ATTRACTION_INFLUENCE_RULES: RomanticRule<AttractionRuleOutput>[] = [
  {
    id: "attraction_yukhap_bond",
    screen: 3,
    priority: 88,
    when: (ctx) => hasCross(ctx, "육합"),
    build: (ctx) => {
      const hit = crossHits(ctx, "육합")[0]!;
      const crossCtx = romanticCrossBodyContext(ctx);
      return {
        ruleId: "attraction_yukhap_bond",
        headline: "끌리는 조합",
        body: `${humanizeRomanticCrossBody(hit, crossCtx)} — ${ctx.nicknameA}와 ${ctx.nicknameB}는 처음부터 편안한 끌림이 있어요.`,
        influenceTags: ["pair_cross", "육합"],
        togetherChangeHint: "함께 있을수록 서로의 리듬을 자연스럽게 맞춰 가요.",
      };
    },
  },
  {
    id: "attraction_day_stem_support",
    screen: 3,
    priority: 90,
    when: (ctx) => dayStemIncludes(ctx, "상생"),
    build: (ctx) => {
      const { stemNameA, stemNameB } = romanticCrossBodyContext(ctx);
      return {
      ruleId: "attraction_day_stem_support",
      headline: "서로를 살리는 만남",
      body: humanizeDayStemInteraction(ctx.pairAnalysis.dayStemInteraction, {
        a: stemNameA,
        b: stemNameB,
      }),
      influenceTags: ["pair_day_stem", "상생"],
      togetherChangeHint: "한쪽이 흔들릴 때 다른 쪽이 버팀목이 되는 패턴이에요.",
    };
    },
  },
  {
    id: "attraction_strength_fill",
    screen: 3,
    priority: 80,
    when: (ctx) => strengthComplement(ctx) != null,
    build: (ctx) => {
      const dir = strengthComplement(ctx)!;
      const [strong, soft] =
        dir === "ab"
          ? [ctx.nicknameA, ctx.nicknameB]
          : [ctx.nicknameB, ctx.nicknameA];
      return {
        ruleId: "attraction_strength_fill",
        headline: "버팀목과 공감의 짝",
        body: humanizeStrengthComplement(strong, soft),
        influenceTags: ["strength_complement"],
        togetherChangeHint: `${soft}은 더 표현하고, ${strong}은 더 들어주면 균형이 맞아요.`,
      };
    },
  },
  {
    id: "attraction_connection_axis",
    screen: 3,
    priority: 72,
    when: (ctx) => {
      const gap = axisGap(ctx, "connection");
      return gap != null && gap >= 8;
    },
    build: (ctx) => {
      const who = higherAxis(ctx, "connection");
      const lead =
        who === "a"
          ? ctx.nicknameA
          : who === "b"
            ? ctx.nicknameB
            : "두 사람";
      return {
        ruleId: "attraction_connection_axis",
        headline: "친밀감 속도가 다른 만남",
        body: `${lead} 쪽이 먼저 다가서고, 상대는 한 박자 늦게 마음을 여는 패턴이에요.`,
        influenceTags: ["survey_axis", "connection"],
        togetherChangeHint: "속도 차이를 탓하지 말고, 신호를 맞추는 연습이 필요해요.",
      };
    },
  },
  {
    id: "attraction_element_together",
    screen: 3,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "attraction_element_together",
      headline: "함께 변하는 두 사람",
      body: combinedElementWeak(ctx)
        ? humanizeElementNote(ctx.pairAnalysis.combinedElementNote)
        : `${ctx.metaphorA} 같은 ${ctx.nicknameA}와 ${ctx.metaphorB} 같은 ${ctx.nicknameB}가 서로 다른 리듬을 채워요.`,
      influenceTags: combinedElementWeak(ctx)
        ? ["pair_element"]
        : ["metaphor_combo"],
      togetherChangeHint:
        crossHits(ctx, [...POSITIVE_CROSS])[0]
          ? humanizeRomanticCrossBody(
              crossHits(ctx, [...POSITIVE_CROSS])[0]!,
              romanticCrossBodyContext(ctx),
            )
          : "함께할수록 서로의 강점이 더 드러나요.",
    }),
  },
];

export function resolveAttractionRule(
  ctx: RomanticRuleContext,
): AttractionRuleOutput {
  const ranked = [...ATTRACTION_INFLUENCE_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return ATTRACTION_INFLUENCE_RULES[ATTRACTION_INFLUENCE_RULES.length - 1]!.build(ctx);
}
