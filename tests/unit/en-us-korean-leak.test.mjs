/**
 * en-US must never receive or emit Korean (Hangul) from deterministic fallbacks.
 * Run: npx tsx tests/unit/en-us-korean-leak.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishDeepEssenceStructuredReport } from "../../lib/report/polishDeepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";
import {
  ENERGY_MECHANISM_SPECS_EN,
  FIT_CATEGORY_SPECS_EN,
  ACTION_FALLBACK_EN,
  FAMILY_CLOSING_FRAMES_EN,
  buildActionDirectionsEn,
} from "../../lib/report/part01EvidenceEn.ts";
import { selectActionPlan } from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import {
  buildSurveyAnalysisFallback,
  buildSurveyAnalysisForSlimV1,
} from "../../lib/v1/slim/surveyAnalysis.ts";
import { buildLlmOutputLocaleInstruction } from "../../lib/i18n/llmLocale.ts";

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const walk = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => walk(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => walk(x, out));
  return out;
};
const noHangul = (v, label) => {
  for (const s of walk(v)) assert.doesNotMatch(s, HANGUL, `${label}: Hangul in "${s}"`);
};

function enReport() {
  return {
    summary: { core_mode: "Deep water", energy_balance: "56 / 40", growth_edge: "Deciding" },
    radar_potential: { autonomy: 70, connection: 80, stability: 60, growth: 75, structure: 55, adaptability: 65 },
    strengths: [1, 2, 3].map((i) => ({ title: `Strength ${i}`, body: "You read the room before you speak, and you tend to adjust early." })),
    watchouts: [1, 2, 3].map((i) => ({ title: `Watchout ${i}`, body: "You can stretch a strength until it wears you out." })),
    energy: {
      headline: "You spend a lot of energy on people.",
      balance_pct: 56,
      bars: [
        { label: "Energy on others", value: 56, tone: "highlight" },
        { label: "Energy back", value: 40, tone: "accent" },
        { label: "Solo recovery", value: 70, tone: "ink" },
      ],
      summary: "You put a lot of heart into relationships, so you need real rest.",
      fuels: ["Quiet talks", "Walks", "Slow mornings"],
      drains: ["Sudden plans", "Loud rooms", "Rushed decisions"],
      optimal: ["A small team with clear lanes", "Predictable routines you can rely on"],
    },
    relationships: {
      pattern: "You get more careful as people get closer.",
      fit: ["Someone who approaches slowly", "Someone who acts before they talk", "Someone who respects your space"],
      friction: ["Hasty certainty", "Over-the-top emotion", "Boundary-free closeness"],
      compare: [
        { wound: "Why do you always decide everything yourself?", steady: "Let's agree on who owns which part first." },
        { wound: "Why didn't you tell me the plan changed?", steady: "I'll share changes ahead of time so you can prepare." },
        { wound: "Just answer me right now!", steady: "Take the time you need and tell me when you're ready." },
      ],
    },
    playbook: {
      rule: "Pause for one beat before you speak.",
      rows: [
        { situation: "When you disagree", old: "Push back right away", better: "Restate their point in one sentence first" },
        { situation: "When you feel hurt", old: "Hold it until it blows up", better: "Name it early with a small signal" },
        { situation: "Before a decision", old: "Put it off", better: "Write down two options today" },
      ],
      heated: "If voices rise, take ten minutes.",
      reset: "Drink some water and start again.",
    },
    future: {
      remember: ["Rhythm over speed", "Recovering alone isn't selfish", "Small decisions add up"],
      leap: "Practice a one-sentence no.",
    },
    closing: "You see both ways you work, and both are real. The difference between them is something you can now see.",
    checklist: ["Practice one no today", "Protect 30 quiet minutes", "Say a hurt out loud, gently", "Write two lines on a decision", "Keep a sleep routine", "One line of thanks", "Walk 15 minutes", "One small goal for tomorrow"],
  };
}

describe("en-US polish never injects Korean", () => {
  const fitPlan = {
    primaryFit: FIT_CATEGORY_SPECS_EN.AUTONOMY,
    secondaryFit: FIT_CATEGORY_SPECS_EN.STRUCTURE,
  };

  it("fixture is schema-valid", () => {
    assert.equal(isDeepEssenceStructuredReport(enReport()), true);
  });

  for (const fam of ["DECISION", "STRUCTURE", "GROWTH", "ADAPTABILITY", "BOUNDARY", "COMMUNICATION", "RELATIONAL", "ENERGY"]) {
    it(`en-US, fitPlan + primaryFamily=${fam}: no Hangul, LLM prose preserved`, () => {
      const raw = enReport();
      const out = polishDeepEssenceStructuredReport(raw, "en-US", fitPlan, fam);
      noHangul(out, `polish ${fam}`);
      assert.equal(out.relationships.compare[0].wound, raw.relationships.compare[0].wound);
      assert.equal(out.energy.optimal[0], raw.energy.optimal[0]);
      assert.equal(out.closing, raw.closing);
    });
  }

  it("en-US with a Korean-fitPlan (legacy caller) still yields no Hangul", () => {
    const out = polishDeepEssenceStructuredReport(enReport(), "en-US", {
      primaryFit: { ...FIT_CATEGORY_SPECS_EN.AUTONOMY, environmentFitDirection: "역할과 목표" },
      secondaryFit: FIT_CATEGORY_SPECS_EN.STRUCTURE,
    }, "DECISION");
    noHangul(out, "legacy fitPlan");
  });

  it("ko-KR still applies Korean deterministic fallback (behavior preserved)", () => {
    const koFit = {
      primaryFit: { key: "AUTONOMY", label: "x", peopleFitDirection: "x", frictionDirection: "x", communicationTrigger: "왜 이것도 멋대로 정해?", communicationBetter: "네가 맡은 부분의 우선순위를 먼저 정해서 공유해줘.", environmentFitDirection: "역할과 목표는 분명하지만 자율권이 보장되는 환경" },
      secondaryFit: { key: "STRUCTURE", label: "x", peopleFitDirection: "x", frictionDirection: "x", communicationTrigger: "그냥 대충 해.", communicationBetter: "원칙을 먼저 정리하자.", environmentFitDirection: "업무 절차와 책임 소재가 명확한 환경" },
    };
    const out = polishDeepEssenceStructuredReport(enReport(), "ko-KR", koFit, "DECISION");
    assert.ok(walk(out.relationships.compare).some((s) => HANGUL.test(s)), "ko path still substitutes Korean pool rows");
  });
});

describe("English evidence tables", () => {
  it("energy / fit / action / closing tables contain no Hangul", () => {
    noHangul(ENERGY_MECHANISM_SPECS_EN, "energy");
    noHangul(FIT_CATEGORY_SPECS_EN, "fit");
    noHangul(ACTION_FALLBACK_EN, "action fallback");
    noHangul(FAMILY_CLOSING_FRAMES_EN, "closing frames");
    const fams = ["DECISION", "STRUCTURE", "GROWTH", "ADAPTABILITY", "BOUNDARY", "COMMUNICATION", "RELATIONAL", "ENERGY"];
    for (const p of fams) for (const s of fams) noHangul(buildActionDirectionsEn(p, s), `dirs ${p}/${s}`);
  });

  it("same key sets as Korean tables", async () => {
    assert.equal(Object.keys(FIT_CATEGORY_SPECS_EN).length, 12);
    assert.equal(Object.keys(ENERGY_MECHANISM_SPECS_EN).length, 8);
  });

  it("selectActionPlan(null, en-US) is English-only; ko-KR keeps Korean", () => {
    noHangul(selectActionPlan(null, "en-US"), "en plan");
    assert.ok(walk(selectActionPlan(null, "ko-KR")).some((s) => HANGUL.test(s)));
  });
});

describe("survey fallback is locale-aware", () => {
  it("en-US: missing survey never yields Korean", () => {
    noHangul(buildSurveyAnalysisFallback("en-US"), "fallback");
    const r = buildSurveyAnalysisForSlimV1(null, "en-US");
    assert.equal(r.source, "none_fallback");
    noHangul(r.text, "slim none");
  });
  it("en-US: profile text has no Korean; ko-KR keeps Korean", () => {
    const profile = {
      primary_axes: { autonomy: 60, connection: 70, stability: 40, growth: 80, structure: 50, adaptability: 55 },
      personalization: { primary_concern: "career" },
    };
    noHangul(buildSurveyAnalysisForSlimV1(profile, "en-US").text, "profile en");
    assert.match(buildSurveyAnalysisForSlimV1(profile, "ko-KR").text, HANGUL);
    assert.match(buildSurveyAnalysisFallback("ko-KR"), HANGUL);
  });
});

describe("prompt locale instruction", () => {
  it("en-US instruction forbids Hangul output; ko-KR does not", () => {
    assert.match(buildLlmOutputLocaleInstruction("en-US"), /never output Hangul/i);
    assert.doesNotMatch(buildLlmOutputLocaleInstruction("ko-KR"), /never output Hangul/i);
  });
});
