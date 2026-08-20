/**
 * Personal Premium Final Narrative Stabilization — Batch A: Adaptation Story.
 *
 * Live fresh-generation QA (Narrative Quality Singleton, Final Phase) found
 * two concrete residuals: (1) adaptation_story's 5th-beat closing echoed the
 * prompt's own polished WORKING example sentence near-verbatim in 2 of 3
 * profiles, and (2) explicit advice language ("~연습이 필요해요",
 * "~활용하는 것이 중요해요") leaked despite an existing ZERO-advice rule.
 * This file covers both fixes plus the paragraph-count relaxation.
 *
 * Run: npx tsx --test tests/unit/personal-premium-stabilization-batch-a-adaptation-story.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { polishDeepEssenceStructuredReport } from "../../lib/report/polishDeepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";

const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

describe("Prompt contract — no copy-ready example sentence for adaptation_story's closing beat", () => {
  it("the old complete, polished WORKING sentence is fully removed (not just warned against)", () => {
    assert.doesNotMatch(
      src,
      /본래의 성향과 지금 살아가는 방식은 서로 다른 결을 갖고 있지만, 둘 다 지금 이 사람 안에 함께 있어요\. 어느 한쪽만 진짜라고 말하기는 어려워요\./,
      "the exact echoed sentence must no longer appear anywhere as a copyable example",
    );
  });

  it("replaces it with an abstract structural description (WORKING STRUCTURE, not a fixed sentence)", () => {
    assert.match(src, /SYNTHESIS QUESTION TO ANSWER/);
  });

  it("includes a self-check for over-generic 5th-paragraph sentences", () => {
    assert.match(src, /BANNED GENERIC CLOSINGS/);
  });
});

describe("Prompt contract — emergent-claim worked example", () => {
  it("includes a concrete worked example distinguishing side-by-side facts from a genuine emergent claim", () => {
    assert.match(src, /SYNTHESIS QUESTION TO ANSWER/);
  });
});

describe("Prompt contract — explicit zero-advice banned-ending category", () => {
  it("lists the specific banned KO endings observed leaking live", () => {
    for (const phrase of ["해야 해요", "할 필요가 있어요", "하는 것이 중요해요", "연습해보세요", "활용해보세요", "시도해보세요", "기억하세요"]) {
      assert.match(src, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("explicitly protects the descriptive '~할 필요가 생길 수 있어요' pattern from over-broad banning", () => {
    assert.match(src, /할 필요가 생길 수 있어요/);
    assert.match(src, /is not what this bans/);
  });
});

describe("Prompt contract — paragraph count relaxed from EXACTLY 4-5 to 2-5", () => {
  it("schema field no longer requires EXACTLY 4-5 paragraphs", () => {
    assert.doesNotMatch(src, /EXACTLY 4-5 paragraphs/);
    assert.match(src, /"2-5 short paragraphs/);
  });

  it("rule text no longer requires MUST be 4-5 separate paragraphs", () => {
    assert.doesNotMatch(src, /MUST be 4-5 separate paragraphs/);
    assert.match(src, /MUST be 2-5 short paragraphs/);
  });

  it("still requires the final beat to land as its own distinct last paragraph", () => {
    assert.match(src, /final beat \(integrated closing\) always gets its own last paragraph/);
  });
});

describe("components/results/deep/DeepEssenceAdaptationStory.tsx — stale comment fixed, split logic unchanged (source wiring)", () => {
  const uiSrc = fs.readFileSync("components/results/deep/DeepEssenceAdaptationStory.tsx", "utf8");

  it("comment reflects the new 2-5 paragraph contract", () => {
    assert.match(uiSrc, /2-5 short paragraphs/);
    assert.doesNotMatch(uiSrc, /4-5 paragraphs/);
  });

  it("split logic is paragraph-count-agnostic (splits on blank lines, no hardcoded count)", () => {
    assert.match(uiSrc, /split\(\/\\n\{2,\}\/\)/);
  });
});

function fixtureReport(adaptationStoryNarrative) {
  return {
    summary: { core_mode: "깊은 물", energy_balance: "56 / 40", growth_edge: "결단" },
    radar_potential: { autonomy: 70, connection: 80, stability: 60, growth: 75, structure: 55, adaptability: 65 },
    strengths: [
      { title: "공감", body: "상대의 기분을 잘 읽고 맞춰 주는 경향이 있다." },
      { title: "집중", body: "혼자 있는 시간에 에너지를 회복하는 편이다." },
      { title: "통찰", body: "겉으로 드러난 말보다 맥락을 먼저 본다." },
    ],
    watchouts: [
      { title: "과몰입", body: "관계에 너무 깊이 들어가면 지치기 쉽다." },
      { title: "미룸", body: "결정을 미루다 타이밍을 놓칠 수 있다." },
      { title: "자기검열", body: "속마음을 너무 오래 담아 두는 편이다." },
    ],
    energy: {
      headline: "사람에게 쓰는 에너지가 큰 편이다.",
      balance_pct: 40,
      bars: [
        { label: "관계에 쓰는 에너지", value: 56, tone: "highlight" },
        { label: "돌아오는 에너지", value: 40, tone: "accent" },
        { label: "혼자 회복", value: 70, tone: "ink" },
      ],
      summary: "관계에 마음을 많이 쓰는 흐름이다.",
      fuels: ["조용한 대화", "산책", "혼자만의 아침"],
      drains: ["갑작스러운 약속", "시끄러운 자리", "급한 결정 압박"],
      optimal: ["작은 팀", "예측 가능한 루틴"],
    },
    relationships: {
      pattern: "가까워질수록 조심스러워지는 패턴이다.",
      fit: ["천천히 다가오는 사람", "말보다 행동이 앞서는 사람", "공간을 존중하는 사람"],
      friction: ["성급한 확신", "감정의 과잉 표현", "경계 없는 친밀감"],
      compare: [
        { wound: "거절이 무섭다", steady: "거절도 대화로 본다" },
        { wound: "바로 답이 없다", steady: "생각할 시간을 준다" },
        { wound: "감정 기복", steady: "기복을 함께 읽는다" },
      ],
    },
    playbook: {
      rule: "먼저 한 박자 쉬고 말한다.",
      rows: [
        { situation: "의견이 다를 때", old: "바로 맞선다", better: "상대 요지를 한 문장으로 확인한다" },
        { situation: "서운할 때", old: "참다가 터진다", better: "작은 신호로 먼저 말한다" },
        { situation: "결정을 앞둘 때", old: "미룬다", better: "오늘 중 선택지 두 개만 적는다" },
      ],
      heated: "목소리가 커지면 10분 쿨다운.",
      reset: "물 한 잔 마시고 다시 시작한다.",
    },
    future: {
      remember: ["속도보다 리듬", "혼자 회복은 이기심이 아니다", "작은 결단이 쌓인다"],
      leap: "거절을 한 문장으로 연습한다.",
    },
    closing: "지금까지 살아오며 만들어온 방식과 본래 편한 방식 중 어느 하나만이 진짜 당신인 것은 아니에요. 중요한 건 앞으로 어떤 선택에서 어느 쪽을 더 사용할지 스스로 알아볼 수 있게 되었다는 점입니다.",
    checklist: ["오늘 거절 한 번 연습하기"],
    adaptation_story: { narrative: adaptationStoryNarrative },
  };
}

describe("cleanAdaptationStoryText (via polishDeepEssenceStructuredReport) — defensive advice-ending strip", () => {
  it("strips a mid-narrative sentence ending in '~하는 것이 중요해요'", () => {
    const raw = fixtureReport(
      "본래는 자기 판단을 믿는 편이에요.\n\n현재는 관계 신호를 계속 확인하며 결정해요.\n\n스스로의 의견을 표현하는 것이 중요해요.\n\n두 가지 방식 모두 지금 당신 안에 함께 있어요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.adaptation_story.narrative, /하는 것이 중요해요/);
    assert.match(polished.adaptation_story.narrative, /본래는 자기 판단을 믿는 편이에요/);
    assert.match(polished.adaptation_story.narrative, /두 가지 방식 모두 지금 당신 안에 함께 있어요/);
  });

  it("strips a sentence ending in '~연습해보세요'", () => {
    const raw = fixtureReport(
      "본래는 독립적인 판단을 선호해요.\n\n현재는 여러 사람의 의견을 먼저 확인해요.\n\n결정 전에 스스로의 생각부터 정리하는 연습해보세요.\n\n두 방식 모두 함께 존재해요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.adaptation_story.narrative, /연습해보세요/);
  });

  it("does NOT strip the descriptive '~할 필요가 생길 수 있어요' pattern", () => {
    const raw = fixtureReport(
      "본래는 독립적인 판단을 선호해요.\n\n현재는 여러 사람의 의견을 확인하다 보니, 때로는 다시 확인할 필요가 생길 수 있어요.\n\n두 방식 모두 함께 존재해요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.match(polished.adaptation_story.narrative, /필요가 생길 수 있어요/);
  });

  it("never fully empties adaptation_story even if every sentence looks like advice", () => {
    const raw = fixtureReport("연습해보세요. 활용해보세요. 기억하세요.");
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.ok(polished.adaptation_story.narrative.trim().length > 0);
  });

  it("cleans up paragraph structure when an entire paragraph was only an advice sentence (no dangling blank paragraph)", () => {
    const raw = fixtureReport(
      "본래는 독립적인 판단을 선호해요.\n\n이 부분은 연습해보세요.\n\n두 방식 모두 함께 존재해요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.adaptation_story.narrative, /\n\n\n/);
    assert.doesNotMatch(polished.adaptation_story.narrative, /^\s*\n/);
  });

  it("leaves EN-locale adaptation_story untouched (KO-only defensive guard, matching cleanClosingText's own scope)", () => {
    const raw = fixtureReport("You tend to trust your own judgment naturally. You should practice checking in with yourself first.");
    const polished = polishDeepEssenceStructuredReport(raw, "en-US");
    assert.match(polished.adaptation_story.narrative, /You should practice checking in with yourself first/);
  });

  it("a report with no adaptation_story at all still polishes cleanly (optional field handled)", () => {
    const raw = fixtureReport("placeholder");
    delete raw.adaptation_story;
    assert.equal(isDeepEssenceStructuredReport(raw), true);
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(polished.adaptation_story, undefined);
    assert.equal(isDeepEssenceStructuredReport(polished), true);
  });

  it("report stays schema-valid after the advice-ending strip", () => {
    const raw = fixtureReport(
      "본래는 독립적인 판단을 선호해요.\n\n현재는 의견을 계속 확인해요.\n\n표현하는 것이 중요해요.\n\n두 방식 모두 함께 있어요.",
    );
    assert.equal(isDeepEssenceStructuredReport(raw), true);
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(isDeepEssenceStructuredReport(polished), true);
  });
});

describe("LLM call sites in runDeepEssenceStructuredLlm.ts (source wiring)", () => {
  const runnerSrc = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
  it("exactly 3 callLlmJson call sites (Part A, Part 04 focused synthesis, Part B)", () => {
    const calls = runnerSrc.match(/callLlmJson\(openai,/g) ?? [];
    assert.equal(calls.length, 3);
  });
});
