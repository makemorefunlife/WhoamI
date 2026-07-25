/**
 * Deep Essence structured tone polish must never break Inner Compass schema.
 * Run: node --test tests/unit/deep-essence-structured-polish.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishDeepEssenceStructuredReport } from "../../lib/report/polishDeepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";

function fixture() {
  return {
    summary: {
      core_mode: "깊은 물",
      energy_balance: "56 / 40",
      growth_edge: "결단",
    },
    radar_potential: {
      autonomy: 70,
      connection: 80,
      stability: 60,
      growth: 75,
      structure: 55,
      adaptability: 65,
    },
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
      balance_pct: 56,
      bars: [
        { label: "관계에 쓰는 에너지", value: 56, tone: "highlight" },
        { label: "돌아오는 에너지", value: 40, tone: "accent" },
        { label: "혼자 회복", value: 70, tone: "ink" },
      ],
      summary: "관계에 마음을 많이 쓰는 흐름이다 — 편으로 보일 수 있으며, 실제로는 휴식이 필요하다.",
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
        {
          situation: "의견이 다를 때",
          old: "바로 맞선다",
          better: "상대 요지를 한 문장으로 확인한다",
        },
        {
          situation: "서운할 때",
          old: "참다가 터진다",
          better: "작은 신호로 먼저 말한다",
        },
        {
          situation: "결정을 앞둘 때",
          old: "미룬다",
          better: "오늘 중 선택지 두 개만 적는다",
        },
      ],
      heated: "목소리가 커지면 10분 쿨다운.",
      reset: "물 한 잔 마시고 다시 시작한다.",
    },
    future: {
      remember: ["속도보다 리듬", "혼자 회복은 이기심이 아니다", "작은 결단이 쌓인다"],
      leap: "거절을 한 문장으로 연습한다.",
    },
    closing: "당신은 이미 충분히 섬세하다. 그 섬세함을 지키며 앞으로 가면 된다.",
    checklist: [
      "오늘 거절 한 번 연습하기",
      "혼자 있는 30분 확보하기",
      "서운함을 작게 말하기",
      "결정 메모 두 줄",
      "수면 루틴 지키기",
      "감사 한 문장",
      "산책 15분",
      "내일의 작은 목표 하나",
    ],
  };
}

describe("polishDeepEssenceStructuredReport", () => {
  it("keeps schema valid after Korean tone polish", () => {
    const raw = fixture();
    assert.equal(isDeepEssenceStructuredReport(raw), true);
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(isDeepEssenceStructuredReport(polished), true);
    assert.equal(polished.summary.core_mode, "깊은 물");
    assert.equal(polished.energy.bars[0].tone, "highlight");
    assert.match(polished.strengths[0].body, /있어요|경향/);
    assert.doesNotMatch(polished.energy.summary, /[—–ㅡ]/);
  });

  it("never blanks a required prose field", () => {
    const raw = fixture();
    raw.closing = "있다.";
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.ok(polished.closing.trim().length > 0);
    assert.equal(isDeepEssenceStructuredReport(polished), true);
  });

  it("leaves short chips and titles untouched", () => {
    const raw = fixture();
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(polished.summary.growth_edge, "결단");
    assert.equal(polished.strengths[0].title, "공감");
  });
});
