/**
 * Personal Premium Final Narrative Stabilization — Batch C: Closing.
 *
 * v1 (banned-phrase lists across 4 categories, trailing-only regex net) was
 * fresh-QA'd twice against 5 live profiles: 2/5 FAIL round 1, 4/5 FAIL round
 * 2 AFTER expanding the phrase lists with the round-1 violations. The model
 * kept escaping each specific banned phrase with a new paraphrase of the
 * same banned function, and the trailing-only regex never had a chance
 * against ~3 of 4 violations because they sat mid-closing, not in the last
 * sentence. Root cause: the schema field for closing said "6-10 sentences"
 * while the prose rule wanted a 2-sentence Recognition+Integration shape —
 * every violation in both fresh-QA rounds showed up in one of those extra,
 * schema-invited sentences 3-10, never in sentence 1 or 2.
 *
 * v2 (this file) replaces the ever-expanding phrase-ban list with a hard
 * structural cap — closing is EXACTLY 2 sentences, both at the prompt level
 * (schema field + prose rule) and as a deterministic backstop in
 * polishDeepEssenceStructuredReport (truncate to <=2 sentences, then scan
 * only the survivors for a banned function — no longer trailing-only, since
 * there are at most 2 short sentences left to check).
 *
 * Run: npx tsx --test tests/unit/personal-premium-stabilization-batch-c-closing.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { polishDeepEssenceStructuredReport } from "../../lib/report/polishDeepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";

const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

describe("Prompt contract — no copy-ready closing example sentence anywhere", () => {
  it("the over-anchored opening sentence is fully removed from the prompt", () => {
    assert.doesNotMatch(src, /지금까지 살아오며 만들어온 방식과 본래 편한 방식 중 어느 하나만이 진짜 당신인 것은 아니에요/);
  });

  it("the evaluative-praise ban's old WORKING example sentence is also removed", () => {
    assert.doesNotMatch(src, /이제 중요한 선택 앞에서 어느 쪽을 더 사용하고 있는지 알아차릴 수 있습니다/);
  });

  it("the FAILED evaluation example sentence is removed too", () => {
    assert.doesNotMatch(src, /이 점을 알게 되었다는 것이 참 의미 있어요/);
  });
});

describe("Prompt contract — closing hard-capped at EXACTLY 2 sentences (the structural fix)", () => {
  it("schema field states the 2-sentence cap explicitly, replacing the old '6-10 sentences' instruction", () => {
    assert.match(src, /"closing": "EXACTLY 2 sentences, no more/);
    assert.doesNotMatch(src, /"closing":\s*"[^"]*6-10 sentences/);
  });

  it("prose rule states the same hard cap and names it as a structural limit, not a style preference", () => {
    assert.match(src, /closing is EXACTLY 2 SENTENCES, NEVER MORE/);
    assert.match(src, /this is a hard structural limit, not a style preference/);
  });

  it("names the root cause found in live QA — every violation lived in an extra sentence beyond the required two", () => {
    assert.match(src, /every single violation.*showed up in a 3rd, 4th, 5th, or 6th sentence the model added beyond the required two/s);
  });

  it("defines sentence 1 as RECOGNITION and sentence 2 as INTEGRATION, with the required recognition ending on sentence 2 only", () => {
    assert.match(src, /Sentence 1 \(RECOGNITION\)/);
    assert.match(src, /Sentence 2 \(INTEGRATION\).*MUST end in a present-tense statement of recognition/s);
  });

  it("still names the four drift risks as compact reference, not as an exhaustive phrase-ban list to expand further", () => {
    assert.match(src, /Compact reference only \(do not use these as a checklist to satisfy word-for-word/);
    assert.match(src, /PREDICTION.*EVALUATION.*ADVICE.*CHEERING/s);
  });
});

function fixtureReport(closingText) {
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
    closing: closingText,
    checklist: ["오늘 거절 한 번 연습하기"],
  };
}

describe("cleanClosingText (defensive polish) — sentence-count truncation, then per-sentence banned-function scan", () => {
  it("truncates a 6-sentence closing (the schema-invited overrun shape) down to at most 2 sentences", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 이 둘을 스스로 구분해서 볼 수 있게 되었다는 점입니다. " +
      "이러한 두 가지 방식 모두 현재의 당신에게는 중요한 부분이에요. 자신의 목소리를 표현하는 것이 자연스럽고 원래의 모습이었음을 잊지 마세요. " +
      "이 두 가지가 공존할 수 있다는 점을 인식하는 것이 중요해요. 당신의 감정과 의견을 솔직하게 표현하는 것이 관계를 더욱 깊이 있게 만들어 줄 거예요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    const sentenceCount = (polished.closing.match(/[.!?]/g) ?? []).length;
    assert.ok(sentenceCount <= 2, `expected at most 2 sentences, got ${sentenceCount} in: ${polished.closing}`);
  });

  it("a mid-closing 'advice' violation (사실상 3rd+ sentence) is removed by truncation even though it isn't the trailing sentence", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 이 둘을 스스로 구분해서 볼 수 있게 되었다는 점입니다. " +
      "이 두 가지가 공존할 수 있다는 점을 잊지 마세요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /잊지 마세요/);
    assert.match(polished.closing, /구분해서 볼 수 있게 되었다는 점입니다/);
  });

  it("a banned-function sentence that survives truncation (i.e. is within the first 2) is still dropped by the per-sentence scan", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 앞으로 더 나은 관계가 펼쳐질 거예요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /펼쳐질 거예요/);
  });

  it("does NOT strip a legitimate '~게 되었다는 점입니다' recognition ending (the required ending shape, not evaluation)", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 이 둘을 스스로 구분해서 볼 수 있게 되었다는 점입니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.match(polished.closing, /구분해서 볼 수 있게 되었다는 점입니다/);
  });

  it("strips a sentence-1 '잊지 마세요' advice violation even though it isn't the whack-a-mole-expanded literal 기억하세요 (fresh-QA found this exact live leak — it's a direct synonym of an already-banned word, not new tuning against an unknown paraphrase)", () => {
    const raw = fixtureReport(
      "현재의 모습과 자연스러운 모습이 모두 존재한다는 점을 잊지 마세요. 그 차이를 이해하게 되었다는 점입니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /잊지 마세요/);
    assert.match(polished.closing, /이해하게 되었다는 점입니다/);
  });

  it("strips a '기억해요' advice violation (casual register conjugation of the already-banned 기억하세요 — found in a second live re-verify round, still the same word family, not a new paraphrase)", () => {
    const raw = fixtureReport(
      "현재의 당신과 자연스러운 모습이 모두 사실이라는 점을 기억해요. 이러한 차이를 인식하게 되었다는 점입니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /기억해요/);
    assert.match(polished.closing, /인식하게 되었다는 점입니다/);
  });

  it("never fully empties closing even if both surviving sentences look banned", () => {
    const raw = fixtureReport("기억하세요. 노력하세요.");
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.ok(polished.closing.trim().length > 0);
  });

  it("existing cheer/wishing strip still works (both the prefix-specific pattern and the per-sentence CHEER pattern)", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 이 둘을 스스로 구분해서 볼 수 있게 되었다는 점입니다. 항상 응원할게요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /응원할게요/);
  });

  it("report stays schema-valid after truncation + per-sentence scan", () => {
    const raw = fixtureReport(
      "지금의 방식과 본래 편한 방식 모두 당신 안에 있어요. 구분해서 볼 수 있게 되었다는 점입니다. 앞으로 더 좋아질 거예요. 참 의미 있어요. 이 점을 기억하세요. 항상 응원할게요.",
    );
    assert.equal(isDeepEssenceStructuredReport(raw), true);
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(isDeepEssenceStructuredReport(polished), true);
  });

  it("EN-locale closing is untouched by the KO-only sentence-scan (no truncation, no scan)", () => {
    const raw = fixtureReport(
      "Both ways are part of you. Remember to trust yourself and it will get better. A third sentence too.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "en-US");
    assert.match(polished.closing, /A third sentence too/);
  });
});
