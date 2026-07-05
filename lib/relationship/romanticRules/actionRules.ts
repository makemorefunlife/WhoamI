import type { ActionRuleOutput, RomanticRule, RomanticRuleContext } from "./types";
import {
  combinedElementWeak,
  crossHits,
  dayStemIncludes,
  pickRelationshipAction,
  TENSION_CROSS,
} from "./types";

export const ACTION_RULES: RomanticRule<ActionRuleOutput>[] = [
  {
    id: "action_tension_recovery",
    screen: 7,
    priority: 88,
    when: (ctx) => crossHits(ctx, [...TENSION_CROSS]).length >= 1,
    build: (ctx) => ({
      ruleId: "action_tension_recovery",
      goodPhrases: [
        "지금 기분부터 들어볼게",
        "속도 맞춰 가자, 괜찮아",
        pickRelationshipAction(ctx, 0) ?? "함께 숨 고르자",
      ],
      avoidPhrases: [
        "왜 그렇게 예민해?",
        "그만 좀 해",
        "너는 항상 그래",
      ],
      recoveryTip:
        "갈등 직후 바로 결론 내리지 말고, 감정 라벨링 후 20분 쉬어가요.",
      togetherStarter: `${ctx.nicknameA}와 ${ctx.nicknameB} — 작은 신호부터 맞춰 보세요.`,
    }),
  },
  {
    id: "action_day_stem_harmony",
    screen: 7,
    priority: 82,
    when: (ctx) => dayStemIncludes(ctx, "상생"),
    build: (ctx) => ({
      ruleId: "action_day_stem_harmony",
      goodPhrases: [
        "네 덕분에 힘이 돼",
        "오늘도 고마워",
        ctx.sajuJsonA.dayStemData?.advice_ko?.split(/[.。]/)[0] ?? "함께해서 다행이야",
      ],
      avoidPhrases: [
        "당연한 거 아니야?",
        "나만 노력하는 것 같아",
      ],
      recoveryTip: "상생 관계는 칭찬·감사가 끊기면 균형이 무너져요.",
      togetherStarter: `${ctx.metaphorA} × ${ctx.metaphorB} — 좋은 날의 말투를 기억해 두세요.`,
    }),
  },
  {
    id: "action_element_fill",
    screen: 7,
    priority: 75,
    when: (ctx) => combinedElementWeak(ctx),
    build: (ctx) => ({
      ruleId: "action_element_fill",
      goodPhrases: [
        "오늘은 쉬는 날로 하자",
        "네가 좋아하는 걸로 맞출게",
        pickRelationshipAction(ctx, 1) ?? "함께 채우고 싶은 게 뭐야?",
      ],
      avoidPhrases: [
        "왜 이렇게 지쳐 보여?",
        "나만 맞추는 거야?",
      ],
      recoveryTip:
        ctx.pairAnalysis.combinedElementNote.split("|").pop()?.trim() ??
        "부족한 기운은 휴식·함께하는 취미로 채워요.",
      togetherStarter: "주말 루틴 하나를 함께 정해 보세요.",
    }),
  },
  {
    id: "action_survey_actions",
    screen: 7,
    priority: 70,
    when: (ctx) => pickRelationshipAction(ctx, 0) != null,
    build: (ctx) => ({
      ruleId: "action_survey_actions",
      goodPhrases: [
        pickRelationshipAction(ctx, 0)!,
        pickRelationshipAction(ctx, 1) ?? "오늘 하루 어땠어?",
        "네 말 듣고 있어",
      ],
      avoidPhrases: [
        "대충 알겠어",
        "나중에 얘기하자",
      ],
      recoveryTip: "설문에서 나온 행동 팁을 갈등 전에 미리 써 보세요.",
      togetherStarter: `${ctx.nicknameA} · ${ctx.nicknameB} — 작은 실천부터.`,
    }),
  },
  {
    id: "action_default",
    screen: 7,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "action_default",
      goodPhrases: [
        "오늘 어땠는지 듣고 싶어",
        "네 편이야",
        "함께 방법 찾아보자",
      ],
      avoidPhrases: [
        "그건 네 문제야",
        "말 안 해도 알잖아",
      ],
      recoveryTip: "거리가 생겼을 때 먼저 연결 신호(짧은 메시지·안부)를 보내세요.",
      togetherStarter: `${ctx.nicknameA}와 ${ctx.nicknameB} — 오늘 한 가지만 함께해 보세요.`,
    }),
  },
];

export function resolveActionRule(ctx: RomanticRuleContext): ActionRuleOutput {
  const ranked = [...ACTION_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return ACTION_RULES[ACTION_RULES.length - 1]!.build(ctx);
}
