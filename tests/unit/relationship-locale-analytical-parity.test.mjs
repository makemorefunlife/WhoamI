/**
 * Phase 1 English remediation — analytical parity regression coverage
 * (task item 9/10): proves locale never changes a computed numeric score,
 * grade/tier band, color, or threshold — only the localized display string
 * differs. Covers the two shared/cross-vertical pieces touched in this
 * phase: lib/relationship/scoreBarAppearance.ts (Work/Family/Marriage/
 * Friend's score gauges) and buildRomanticOverviewSnapshot.ts (Romantic's
 * overview cards). Role-assignment/evidence-selection parity for Romantic
 * chapter content is separately covered end-to-end by
 * tests/unit/romantic-v4-ko-en-parity.test.mjs section 5 (comparisonTable
 * confidence + axisOverview score/gap/match_type identical across locale).
 *
 * Run: npx tsx tests/unit/relationship-locale-analytical-parity.test.mjs
 */
import assert from "node:assert/strict";
import { resolveScoreBarAppearance } from "../../lib/relationship/scoreBarAppearance.ts";
import { buildRomanticOverviewSnapshot } from "../../lib/relationship/romantic/prototypeV4/buildRomanticOverviewSnapshot.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
// 1. resolveScoreBarAppearance — tier/color/threshold identical across
//    locale for every representative (value, polarity) pair; only `hint`
//    text differs, and it differs in exactly the expected pairing.
{
  const HINT_PAIRS = {
    "higher_better:good": ["좋은 편", "Good"],
    "higher_better:mid": ["보통", "Average"],
    "higher_better:low": ["낮은 편", "Low"],
    "higher_worse:warn": ["주의 필요", "Needs attention"],
    "higher_worse:mid": ["보통", "Average"],
    "higher_worse:stable": ["안정적", "Stable"],
  };

  const cases = [
    { value: 85, polarity: "higher_better", tierKey: "higher_better:good" },
    { value: 70, polarity: "higher_better", tierKey: "higher_better:good" },
    { value: 55, polarity: "higher_better", tierKey: "higher_better:mid" },
    { value: 41, polarity: "higher_better", tierKey: "higher_better:mid" },
    { value: 20, polarity: "higher_better", tierKey: "higher_better:low" },
    { value: 0, polarity: "higher_better", tierKey: "higher_better:low" },
    { value: 85, polarity: "higher_worse", tierKey: "higher_worse:warn" },
    { value: 70, polarity: "higher_worse", tierKey: "higher_worse:warn" },
    { value: 60, polarity: "higher_worse", tierKey: "higher_worse:mid" },
    { value: 51, polarity: "higher_worse", tierKey: "higher_worse:mid" },
    { value: 30, polarity: "higher_worse", tierKey: "higher_worse:stable" },
    { value: 0, polarity: "higher_worse", tierKey: "higher_worse:stable" },
  ];

  for (const { value, polarity, tierKey } of cases) {
    const ko = resolveScoreBarAppearance(value, polarity, "ko-KR");
    const en = resolveScoreBarAppearance(value, polarity, "en-US");

    assert.equal(ko.barGradient, en.barGradient, `barGradient must match for value=${value} polarity=${polarity}`);
    assert.equal(ko.ringColor, en.ringColor, `ringColor must match for value=${value} polarity=${polarity}`);
    assert.equal(ko.ringOpacity, en.ringOpacity, `ringOpacity must match for value=${value} polarity=${polarity}`);
    assert.equal(ko.hintClass, en.hintClass, `hintClass (tier CSS) must match for value=${value} polarity=${polarity}`);

    const [expectedKo, expectedEn] = HINT_PAIRS[tierKey];
    assert.equal(ko.hint, expectedKo, `ko-KR hint text for value=${value} polarity=${polarity}`);
    assert.equal(en.hint, expectedEn, `en-US hint text for value=${value} polarity=${polarity}`);
  }
  ok(`resolveScoreBarAppearance: tier/color/threshold identical across locale for ${cases.length} (value, polarity) pairs — only hint text localizes`);
}

// ---------------------------------------------------------------------------
// 2. buildRomanticOverviewSnapshot — score/inverted/tone identical across
//    locale; gradeLabel differs only in text, never in which tier fired.
{
  const GRADE_PAIRS_NON_INVERTED = {
    "매우 좋음": "Great",
    "좋은 편": "Good",
    "보통 수준": "Average",
  };
  const GRADE_PAIRS_INVERTED = {
    "안전한 편": "Stable",
    "보통 수준": "Average",
    "주의 필요": "Needs attention",
  };

  const fixtures = {
    neutral: { allCrossHits: [], dayStemInteraction: "", combinedElementNote: "" },
    positiveLeaning: {
      allCrossHits: [
        { type: "육합", personA_pillar: "월주", personB_pillar: "월주", priority: 90 },
        { type: "삼합", personA_pillar: "년주", personB_pillar: "년주", priority: 90 },
      ],
      dayStemInteraction: "상생",
      combinedElementNote: "",
    },
    highTension: {
      allCrossHits: [
        { type: "충", personA_pillar: "일주", personB_pillar: "일주", priority: 90 },
        { type: "형", personA_pillar: "일주", personB_pillar: "월주", priority: 90 },
      ],
      dayStemInteraction: "상극",
      combinedElementNote: "약한 기운",
    },
  };

  let comparedCards = 0;
  for (const [fixtureName, pairSajuAnalysis] of Object.entries(fixtures)) {
    const ko = buildRomanticOverviewSnapshot({ pairSajuAnalysis, locale: "ko" });
    const en = buildRomanticOverviewSnapshot({ pairSajuAnalysis, locale: "en" });
    assert.equal(ko.length, en.length, `${fixtureName}: same card count across locale`);

    for (let i = 0; i < ko.length; i++) {
      const koCard = ko[i];
      const enCard = en.find((c) => c.key === koCard.key);
      assert.ok(enCard, `${fixtureName}: en-US card "${koCard.key}" must exist`);

      assert.equal(koCard.score, enCard.score, `${fixtureName}/${koCard.key}: score must be locale-independent`);
      assert.equal(koCard.inverted, enCard.inverted, `${fixtureName}/${koCard.key}: inverted flag must be locale-independent`);
      assert.equal(koCard.tone, enCard.tone, `${fixtureName}/${koCard.key}: tone must be locale-independent`);

      const pairs = koCard.inverted ? GRADE_PAIRS_INVERTED : GRADE_PAIRS_NON_INVERTED;
      assert.ok(
        koCard.gradeLabel in pairs,
        `${fixtureName}/${koCard.key}: unexpected ko-KR gradeLabel "${koCard.gradeLabel}"`,
      );
      assert.equal(
        enCard.gradeLabel,
        pairs[koCard.gradeLabel],
        `${fixtureName}/${koCard.key}: en-US gradeLabel must be the exact English pairing of the ko-KR tier, not an independently-computed one`,
      );
      comparedCards++;
    }
  }
  ok(`buildRomanticOverviewSnapshot: score/inverted/tone identical and gradeLabel tier-paired across locale for ${comparedCards} cards across ${Object.keys(fixtures).length} fixtures`);
}

console.log("All relationship locale analytical parity tests passed.");
