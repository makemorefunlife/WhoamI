import type {
  RomanticRule,
  RomanticRuleContext,
  StoryExpansionRuleOutput,
} from "./types";
import {
  combinedElementWeak,
  higherAxis,
  higherSecondaryAxis,
  pickRelationshipAction,
  surveyDomainPattern,
} from "./types";

export const STORY_EXPANSION_RULES: RomanticRule<StoryExpansionRuleOutput>[] = [
  {
    id: "story_lifestyle_energy",
    screen: 6,
    priority: 82,
    when: (ctx) => higherSecondaryAxis(ctx, "energy_style") != null,
    build: (ctx) => {
      const who = higherSecondaryAxis(ctx, "energy_style");
      const lead =
        who === "a" ? ctx.nicknameA : who === "b" ? ctx.nicknameB : "두 사람";
      return {
        ruleId: "story_lifestyle_energy",
        headline: "생활 리듬이 다른 두 사람",
        body: `${lead} 쪽이 먼저 움직이고, 상대는 정리·안정 쪽에 강점이 있어요. 일상 루틴을 맞출 때 마찰이 줄어요.`,
        themes: ["생활 리듬", "에너지", "루틴"],
      };
    },
  },
  {
    id: "story_attachment_connection",
    screen: 6,
    priority: 80,
    when: (ctx) => higherAxis(ctx, "connection") != null,
    build: (ctx) => ({
      ruleId: "story_attachment_connection",
      headline: "애착 속도의 차이",
      body:
        higherAxis(ctx, "connection") === "tie"
          ? "두 사람 모두 친밀감 속도가 비슷해, 안정적인 애착 패턴을 만들기 쉬워요."
          : `${
              higherAxis(ctx, "connection") === "a" ? ctx.nicknameA : ctx.nicknameB
            }이 먼저 다가가고, 상대는 확인 후 마음을 여는 패턴이에요.`,
      themes: ["애착", "친밀감", "확신"],
    }),
  },
  {
    id: "story_family_stability",
    screen: 6,
    priority: 75,
    when: (ctx) =>
      surveyDomainPattern(ctx, "a", "tci", "YNN") ||
      surveyDomainPattern(ctx, "b", "tci", "YNN") ||
      higherAxis(ctx, "stability") != null,
    build: (ctx) => ({
      ruleId: "story_family_stability",
      headline: "가족·미래 이야기",
      body: `${ctx.nicknameA}와 ${ctx.nicknameB}는 안정·계획 축에서 ${
        higherAxis(ctx, "stability") === "tie"
          ? "비슷한"
          : "다른"
      } 리듬을 가져요. 장기 계획을 말할 때 속도를 맞추면 좋아요.`,
      themes: ["가족", "미래", "안정"],
    }),
  },
  {
    id: "story_element_home",
    screen: 6,
    priority: 70,
    when: (ctx) => combinedElementWeak(ctx),
    build: (ctx) => ({
      ruleId: "story_element_home",
      headline: "함께 채우는 공간",
      body:
        ctx.pairAnalysis.combinedElementNote.split("|").pop()?.trim() ??
        "둘이 함께하는 공간·취미에서 부족한 기운을 채우는 패턴이에요.",
      themes: ["오행", "공간", "취미"],
    }),
  },
  {
    id: "story_default",
    screen: 6,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "story_default",
      headline: "일상 속 이 관계",
      body:
        pickRelationshipAction(ctx, 0) ??
        `${ctx.metaphorA} 같은 ${ctx.nicknameA}와 ${ctx.metaphorB} 같은 ${ctx.nicknameB} — 생활·애착·가족 이야기에서도 서로 다른 강점이 드러나요.`,
      themes: ["생활", "애착", "가족"],
    }),
  },
];

export function resolveStoryExpansionRule(
  ctx: RomanticRuleContext,
): StoryExpansionRuleOutput {
  const ranked = [...STORY_EXPANSION_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return STORY_EXPANSION_RULES[STORY_EXPANSION_RULES.length - 1]!.build(ctx);
}
