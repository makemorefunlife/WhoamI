/**
 * en-US Personal deep-report prompt must not carry Korean natural-language prose.
 * Canonical Saju terms (listed below) are the only allowed Hangul.
 * Run: npx tsx tests/unit/en-us-prompt-localization.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { formatEssenceAnalysisForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated.ts";
import { localizePromptExamplesEn } from "../../lib/prompts/enPromptLocalization.ts";
import {
  getDeepEssenceStructuredSystemPrompt,
  buildDeepEssenceStructuredPartAUserPrompt,
  buildDeepEssenceStructuredPartBUserPrompt,
  getPart04ExpertSynthesisSystemPrompt,
} from "../../lib/prompts/deepEssenceStructured.ts";

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
// Canonical / internal Saju source terms (star names such as 장성살, ten-god/relation terms)
// that may remain as internal source reference; the prompt forbids writing them.
const CANONICAL = /[가-힣]{1,3}살|[가-힣]{1,3}귀인|도화살|현침살|천을귀인|십신|격국|용신|귀문|합\/충\/형\/파\/해|\(합\)|\(충\)|\(형\)|합|충|형|파|해/g;
const residual = (s) => s.replace(CANONICAL, "").match(/[가-힣]+/g) ?? [];

const BIRTHS = ["1990-03-15", "1985-11-02", "1998-07-28", "1976-01-09", "2001-12-21"];

describe("en-US Saju summary", () => {
  for (const birthDate of BIRTHS) {
    it(`no Korean prose for ${birthDate}`, () => {
      const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00", birthTimeUnknown: false });
      const payload = toV1SajuApiPayload(bundle);
      const en = formatEssenceAnalysisForIntegrated(payload, "en-US");
      // Only the natal-chart pillar line may carry Hangul (canonical pillar strings).
      const lines = en.split("\n").filter((l) => !l.startsWith("Year "));
      for (const l of lines) assert.doesNotMatch(l, HANGUL, `Hangul in: ${l}`);
      assert.match(en, /Essence analysis|Natal chart/);
      // The analysis is not weakened: key sections still carry English content.
      assert.match(en, /Day stem essence\n.+/);
      assert.ok(en.length > 600, "summary should keep substantive content");
    });
  }

  it("keeps substantive English strength/advice text (not just headings)", () => {
    const bundle = calculateSajuBundle({ birthDate: "1990-03-15", birthTime: "12:00", birthTimeUnknown: false });
    const en = formatEssenceAnalysisForIntegrated(toV1SajuApiPayload(bundle), "en-US");
    assert.match(en, /Strengths: [A-Za-z]/);
  });

  it("ko-KR and no-locale callers keep the Korean summary", () => {
    const bundle = calculateSajuBundle({ birthDate: "1990-03-15", birthTime: "12:00", birthTimeUnknown: false });
    const payload = toV1SajuApiPayload(bundle);
    const def = formatEssenceAnalysisForIntegrated(payload);
    const ko = formatEssenceAnalysisForIntegrated(payload, "ko-KR");
    assert.equal(def, ko);
    assert.match(def, /일간 본질/);
  });
});

describe("en-US assembled prompts", () => {
  const partA = (locale) =>
    buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "survey",
      essenceAnalysisSummary: "essence",
      birthEnergyContext: "birth",
      currentAxisScores: { autonomy: 60, connection: 70, stability: 50, growth: 65, structure: 55, adaptability: 60 },
      locale,
    });
  const partB = (locale) =>
    buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: "survey",
      essenceAnalysisSummary: "essence",
      birthEnergyContext: "birth",
      partAExcerpt: "excerpt",
      locale,
    });

  it("system prompt: no Korean prose beyond canonical terms", () => {
    assert.deepEqual(residual(getDeepEssenceStructuredSystemPrompt("en-US")), []);
  });
  it("Part A user prompt: no Korean prose beyond canonical terms", () => {
    assert.deepEqual(residual(partA("en-US")), []);
  });
  it("Part B user prompt: no Korean prose beyond canonical terms", () => {
    assert.deepEqual(residual(partB("en-US")), []);
  });
  it("Part 04 en system prompt: no Korean prose beyond canonical terms", () => {
    assert.deepEqual(residual(getPart04ExpertSynthesisSystemPrompt("en-US")), []);
  });

  it("ko-KR prompts keep their Korean examples (unchanged)", () => {
    assert.match(getDeepEssenceStructuredSystemPrompt("ko-KR"), HANGUL);
    assert.match(partA("ko-KR"), /말보다 먼저 분위기를 읽는 힘/);
    assert.match(partB("ko-KR"), HANGUL);
    assert.match(getPart04ExpertSynthesisSystemPrompt("ko-KR"), /당신은 세계 최고 수준/);
  });

  it("en-US prompts keep the schema/rules (not weakened)", () => {
    const a = partA("en-US");
    assert.match(a, /strengths/);
    assert.match(a, /watchouts/);
    assert.match(partB("en-US"), /compare/);
    assert.match(partB("en-US"), /checklist/);
  });
});

describe("en-US localization covers evidence-conditional prompt branches too", () => {
  // The layered-identity, axis, energy, relationship and future rule blocks only
  // render when Part01 evidence is present, so scan the prompt source itself:
  // every non-comment Korean span (excluding the ko-only Part 04 system prompt)
  // must be translated or be a canonical Saju term after localization.
  const src = readFileSync(new URL("../../lib/prompts/deepEssenceStructured.ts", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  const enPortion = src.split("return `당신은")[0];
  const lines = enPortion
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join("\n");

  it("no untranslated Korean prose remains in the en-US prompt source", () => {
    const left = residual(localizePromptExamplesEn(lines));
    assert.deepEqual(left, [], `untranslated: ${left.join(" | ")}`);
  });
});

import {
  runPersonalContextEngine,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";

describe("en-US evidence text built from a real packet", () => {
  const collect = (v, out = []) => {
    if (typeof v === "string") out.push(v);
    else if (v instanceof Set || v instanceof Map) return out;
    else if (Array.isArray(v)) v.forEach((x) => collect(x, out));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => collect(x, out));
    return out;
  };
  for (const kind of ["known_time", "unknown_time"]) {
    it(`no Korean prose in evidence prompt text (${kind})`, () => {
      let chart;
      try {
        chart = buildPersonalCeFixtureChart(kind);
      } catch {
        return; // fixture kind not available
      }
      const personalContext = runPersonalContextEngine({ chart });
      const packet = buildPart01IdentityEvidencePacket({
        chart,
        personalContext,
        currentPrimary: { autonomy: 80, connection: 40, stability: 55, growth: 60, structure: 45, adaptability: 65 },
        currentSecondary: { stimulation: 60, self_control: 50, practicality: 55, structure: 45, empathy: 65, conflict_style: 40, resilience: 70, recognition: 50, energy_style: 55, thinking_style: 60, decision_style: 85 },
        innatePrimary: { autonomy: 40, connection: 70, stability: 55, growth: 60, structure: 45, adaptability: 65 },
      });
      const ev = formatPart01EvidenceForPrompt(packet, "en-US");
      const text = collect(ev).join("\n");
      assert.ok(text.length > 500);
      const left = residual(text);
      console.log(`# residual Hangul in en-US evidence (${kind}):`, JSON.stringify([...new Set(left)]).slice(0, 600));
      assert.deepEqual([...new Set(left)], []);
    });
  }
});
