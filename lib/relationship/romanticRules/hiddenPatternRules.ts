import {
  humanizeDayStemInteraction,
  humanizePersonRelation,
  humanizeRomanticCrossBody,
} from "@/lib/relationship/romanticEverydayText";
import type {
  HiddenPatternRuleOutput,
  RomanticRule,
  RomanticRuleContext,
} from "./types";
import {
  crossHits,
  dayStemIncludes,
  hasPersonRelation,
  hasTenGod,
  pickRelationshipInsight,
  romanticCrossBodyContext,
  topTenGod,
  TENSION_CROSS,
} from "./types";

export const HIDDEN_PATTERN_RULES: RomanticRule<HiddenPatternRuleOutput>[] = [
  {
    id: "hidden_day_tension_crisis",
    screen: 4,
    priority: 90,
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
        ruleId: "hidden_day_tension_crisis",
        headline: "말하지 않은 예민함",
        body: `겉으로는 괜찮아 보여도, ${humanizeRomanticCrossBody(hit, romanticCrossBodyContext(ctx), { closeRelationship: true })}`,
        crisisHint: "작은 말투 차이가 크게 느껴지는 순간이 위기 포인트예요.",
        hiddenTags: ["pair_cross", hit.type, "crisis"],
      };
    },
  },
  {
    id: "hidden_person_relation",
    screen: 4,
    priority: 82,
    when: (ctx) =>
      hasPersonRelation(ctx, "a", [...TENSION_CROSS]) ||
      hasPersonRelation(ctx, "b", [...TENSION_CROSS]),
    build: (ctx) => {
      const who = hasPersonRelation(ctx, "a", [...TENSION_CROSS]) ? "a" : "b";
      const json = who === "a" ? ctx.sajuJsonA : ctx.sajuJsonB;
      const nick = who === "a" ? ctx.nicknameA : ctx.nicknameB;
      const rel = (json.relations ?? []).find(
        (r) => r.type && TENSION_CROSS.has(r.type),
      );
      return {
        ruleId: "hidden_person_relation",
        headline: `${nick}의 마음 패턴`,
        body: humanizePersonRelation(rel?.interpretation?.trim() ?? ""),
        crisisHint: "혼자 삼키다가 한꺼번에 터지는 패턴을 조심해요.",
        hiddenTags: ["person_relation", rel?.type ?? "tension"],
      };
    },
  },
  {
    id: "hidden_shiksang_emotion",
    screen: 4,
    priority: 75,
    when: (ctx) =>
      hasTenGod(ctx, "a", ["식신", "상관"]) || hasTenGod(ctx, "b", ["식신", "상관"]),
    build: (ctx) => {
      const who = hasTenGod(ctx, "a", ["식신", "상관"]) ? "a" : "b";
      const nick = who === "a" ? ctx.nicknameA : ctx.nicknameB;
      const activation =
        who === "a" ? ctx.tenGodsActivationA : ctx.tenGodsActivationB;
      const activeGod = activation.find((r) => r.state === "active");
      const godLabel = activeGod?.name ?? topTenGod(ctx, who) ?? "식신";
      return {
        ruleId: "hidden_shiksang_emotion",
        headline: "말보다 행동으로 보이는 마음",
        body: `${nick}은 ${godLabel} 기운이 ${activeGod ? "실제로" : "때때로"} 강해, 감정을 직접 말하기보다 행동·표현으로 드러내요.`,
        crisisHint: "표현 방식 차이를 무시하면 오해가 쌓여요.",
        hiddenTags: ["ten_gods", godLabel],
      };
    },
  },
  {
    id: "hidden_day_stem_clash",
    screen: 4,
    priority: 70,
    when: (ctx) => dayStemIncludes(ctx, "상극"),
    build: (ctx) => {
      const { stemNameA, stemNameB } = romanticCrossBodyContext(ctx);
      return {
      ruleId: "hidden_day_stem_clash",
      headline: "부딪히지만 자극이 되는 마음",
      body: humanizeDayStemInteraction(ctx.pairAnalysis.dayStemInteraction, {
        a: stemNameA ?? "",
        b: stemNameB ?? "",
      }),
      crisisHint: "서로를 바꾸려 할 때 갈등이 커져요.",
      hiddenTags: ["pair_day_stem", "상극"],
    };
    },
  },
  {
    id: "hidden_survey_insight",
    screen: 4,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "hidden_survey_insight",
      headline: "말하지 않은 마음",
      body:
        pickRelationshipInsight(ctx, 0) ??
        "겉으로는 괜찮아 보여도, 속으로는 더 들어주길 바라는 순간이 있어요.",
      crisisHint:
        pickRelationshipInsight(ctx, 1) ??
        "감정이 쌓인 뒤 한꺼번에 거리를 두는 패턴을 조심해요.",
      hiddenTags: ["fallback", "relationship_axes"],
    }),
  },
];

export function resolveHiddenPatternRule(
  ctx: RomanticRuleContext,
): HiddenPatternRuleOutput {
  const ranked = [...HIDDEN_PATTERN_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return HIDDEN_PATTERN_RULES[HIDDEN_PATTERN_RULES.length - 1]!.build(ctx);
}
