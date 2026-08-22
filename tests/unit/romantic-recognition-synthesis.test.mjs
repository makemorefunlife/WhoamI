/**
 * Final Evidence-to-Voice pass, items 3 & 4 — recognition/contradiction
 * synthesis layer. Every insight must be evidence-gated: no signal, no line.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildRomanticRecognitionSynthesis } from "../../lib/relationship/romantic/prototypeV4/romanticRecognitionSynthesis.ts";

function transition(personName, overrides = {}) {
  return {
    personName,
    normalState: "기본 상태",
    tensionRising: "긴장 상승 반응",
    overloadState: "과부하 반응",
    recoveryState: "회복 반응",
    canonicalSummary: "요약",
    ...overrides,
  };
}

function relCe(role, need) {
  return {
    familiarRelationshipRole: { text: role, evidenceId: "chart.x.day_master.role" },
    hiddenVulnerability: { text: need, evidenceId: "chart.x.hidden_vulnerability" },
  };
}

test("shared_goal_different_strategy fires only when wasHarmonyDifferentiated is true", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: null,
    relCeB: null,
    conflictTransitions: {
      sharedBaseline: null,
      transitionA: transition("지민"),
      transitionB: transition("정우"),
      wasHarmonyDifferentiated: true,
    },
    locale: "ko-KR",
  });
  const shared = insights.find((i) => i.insightType === "shared_goal_different_strategy");
  assert.ok(shared, "expected a shared_goal_different_strategy insight");
  assert.equal(shared.suggestedChapter, "c4_conflict");
  assert.ok(shared.claimBoundary.supported);
  assert.ok(shared.claimBoundary.notSupported);
  assert.ok(shared.evidenceRefs.length > 0);
});

test("shared_goal_different_strategy does NOT fire when sharedBaseline is set (truly similar, no strategy difference to report)", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: null,
    relCeB: null,
    conflictTransitions: {
      sharedBaseline: "둘 다 관계의 평화와 조화를 중요하게 여기는 편입니다.",
      transitionA: transition("지민"),
      transitionB: transition("정우"),
      wasHarmonyDifferentiated: false,
    },
    locale: "ko-KR",
  });
  assert.equal(insights.some((i) => i.insightType === "shared_goal_different_strategy"), false);
});

test("shared_goal_different_strategy does NOT fire when someone cleared Pattern 1-3 on their own (not a harmony story at all)", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: null,
    relCeB: null,
    conflictTransitions: {
      sharedBaseline: null,
      transitionA: transition("지민"),
      transitionB: transition("정우"),
      wasHarmonyDifferentiated: false,
    },
    locale: "ko-KR",
  });
  assert.equal(insights.some((i) => i.insightType === "shared_goal_different_strategy"), false);
});

test("persona_hidden_need_contradiction fires per-person only when real relCe data exists", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: relCe("원칙과 결단력의 수호자", "인정받고 싶은 깊은 필요"),
    relCeB: null,
    conflictTransitions: { sharedBaseline: null, transitionA: transition("지민"), transitionB: transition("정우"), wasHarmonyDifferentiated: false },
    locale: "ko-KR",
  });
  const personaInsights = insights.filter((i) => i.insightType === "persona_hidden_need_contradiction");
  assert.equal(personaInsights.length, 1);
  assert.equal(personaInsights[0].subject, "a");
  assert.ok(personaInsights[0].derivedMeaning.includes("원칙과 결단력의 수호자"));
  assert.ok(personaInsights[0].derivedMeaning.includes("인정받고 싶은 깊은 필요"));
});

test("persona_hidden_need_contradiction never fabricates when relCe is entirely absent", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: null,
    relCeB: null,
    conflictTransitions: { sharedBaseline: null, transitionA: transition("지민"), transitionB: transition("정우"), wasHarmonyDifferentiated: false },
    locale: "ko-KR",
  });
  assert.equal(insights.length, 0);
});

test("every emitted insight carries evidenceRefs, claimBoundary, and a suggestedChapter (spec requirement)", () => {
  const insights = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: relCe("원칙과 결단력의 수호자", "인정받고 싶은 깊은 필요"),
    relCeB: relCe("묵묵한 안정의 버팀목", "자율성을 존중받고 싶은 필요"),
    conflictTransitions: {
      sharedBaseline: null,
      transitionA: transition("지민", { tensionRising: "혼자 정리하려 함" }),
      transitionB: transition("정우", { tensionRising: "먼저 확인하려 함" }),
      wasHarmonyDifferentiated: true,
    },
    locale: "ko-KR",
  });
  assert.equal(insights.length, 3);
  for (const insight of insights) {
    assert.ok(insight.evidenceRefs.length > 0, `${insight.id} must carry evidenceRefs`);
    assert.ok(insight.claimBoundary.supported, `${insight.id} must state what's supported`);
    assert.ok(insight.claimBoundary.notSupported, `${insight.id} must state what's NOT supported`);
    assert.ok(insight.suggestedChapter, `${insight.id} must have a chapter owner`);
  }
});

test("A/B swap integrity — persona insight content follows the person, not the a/b slot", () => {
  const forward = buildRomanticRecognitionSynthesis({
    names: { a: "지민", b: "정우" },
    relCeA: relCe("원칙과 결단력의 수호자", "인정받고 싶은 깊은 필요"),
    relCeB: relCe("묵묵한 안정의 버팀목", "자율성을 존중받고 싶은 필요"),
    conflictTransitions: { sharedBaseline: null, transitionA: transition("지민"), transitionB: transition("정우"), wasHarmonyDifferentiated: false },
    locale: "ko-KR",
  });
  const swapped = buildRomanticRecognitionSynthesis({
    names: { a: "정우", b: "지민" },
    relCeA: relCe("묵묵한 안정의 버팀목", "자율성을 존중받고 싶은 필요"),
    relCeB: relCe("원칙과 결단력의 수호자", "인정받고 싶은 깊은 필요"),
    conflictTransitions: { sharedBaseline: null, transitionA: transition("정우"), transitionB: transition("지민"), wasHarmonyDifferentiated: false },
    locale: "ko-KR",
  });
  const jiminForward = forward.find((i) => i.subject === "a");
  const jiminSwapped = swapped.find((i) => i.subject === "b");
  assert.equal(jiminForward.derivedMeaning, jiminSwapped.derivedMeaning);
});
