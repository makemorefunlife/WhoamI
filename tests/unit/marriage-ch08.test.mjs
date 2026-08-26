import assert from "node:assert/strict";
import { buildMarriageChapter08Intelligence } from "../../lib/relationship/marriage/marriageChapter08Intelligence.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`✓ ${name}`);
}

console.log("==========================================");
console.log("Marriage Report Chapter 08 Unit Test Suite");
console.log("==========================================");

const inputA = {
  personId: "Sera",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  gender: "F",
};

const inputB = {
  personId: "Donggeul",
  birthDate: "1992-08-20",
  birthTime: "09:00",
  gender: "M",
};

const psychA = {
  primary: { stability: 75, structure: 80, adaptability: 40 },
  secondary: { self_control: 75, decision_style: 40, resilience: 70 },
};

const psychB = {
  primary: { adaptability: 75, growth: 70, autonomy: 65 },
  secondary: { decision_style: 75, stimulation: 70, resilience: 65 },
};

const ch08 = buildMarriageChapter08Intelligence({
  personAOptions: inputA,
  personBOptions: inputB,
  psychInputA: psychA,
  psychInputB: psychB,
  names: ["Sera", "동글"],
});

// ---------------------------------------------------------------------------
section("1. 5-Section IA Completeness");
assert.ok(ch08.introSentence, "Intro sentence must exist");
assert.ok(ch08.section01CurrentPeriod.personA.headline, "Section 01 Person A headline must exist");
assert.ok(ch08.section01CurrentPeriod.personB.headline, "Section 01 Person B headline must exist");
assert.ok(ch08.section01CurrentPeriod.pair.headline, "Section 01 Pair headline must exist");
assert.ok(ch08.section02RelationshipThemes.length > 0 && ch08.section02RelationshipThemes.length <= 2, "Section 02 themes must exist (max 2)");
assert.equal(ch08.section03ThreeYearForecast.length, 3, "Section 03 must have 3 years forecast");
assert.ok(ch08.section04TurningPoint, "Section 04 Turning Point must exist");
assert.ok(ch08.section05ActionGuide.forPair.advice, "Section 05 Action Guide advice must exist");
ok("5-Section IA completeness verified");

// ---------------------------------------------------------------------------
section("2. Dynamic 3-Year Forecast Range (No Hardcoded 2026/2027/2028)");
const currentYear = new Date().getFullYear();
assert.equal(ch08.section03ThreeYearForecast[0].year, currentYear);
assert.equal(ch08.section03ThreeYearForecast[1].year, currentYear + 1);
assert.equal(ch08.section03ThreeYearForecast[2].year, currentYear + 2);

const customCh08 = buildMarriageChapter08Intelligence({
  personAOptions: inputA,
  personBOptions: inputB,
  psychInputA: psychA,
  psychInputB: psychB,
  names: ["Sera", "동글"],
  targetYears: [2030, 2031, 2032],
});
assert.equal(customCh08.section03ThreeYearForecast[0].year, 2030);
ok("Dynamic year range support verified");

// ---------------------------------------------------------------------------
section("3. Zero Saju Jargon in User-Facing Output");
const allUiTexts = [
  ch08.introSentence,
  ch08.section01CurrentPeriod.personA.headline,
  ch08.section01CurrentPeriod.personA.description,
  ch08.section01CurrentPeriod.personB.headline,
  ch08.section01CurrentPeriod.personB.description,
  ch08.section01CurrentPeriod.pair.headline,
  ch08.section01CurrentPeriod.pair.description,
  ...ch08.section02RelationshipThemes.map((t) => `${t.title} ${t.description}`),
  ...ch08.section03ThreeYearForecast.map(
    (f) => `${f.yearLabel} ${f.personA.summary} ${f.personB.summary} ${f.pair.summary}`,
  ),
  ch08.section05ActionGuide.forPersonA.advice,
  ch08.section05ActionGuide.forPersonB.advice,
  ch08.section05ActionGuide.forPair.advice,
].join(" ");

assert.ok(!allUiTexts.includes("정관"), "Must not contain Saju term 정관");
assert.ok(!allUiTexts.includes("편재"), "Must not contain Saju term 편재");
assert.ok(!allUiTexts.includes("상관"), "Must not contain Saju term 상관");
assert.ok(!allUiTexts.includes("대운"), "Must not contain Saju term 대운");
assert.ok(!allUiTexts.includes("원진"), "Must not contain Saju term 원진");
ok("Zero Saju jargon in UI verified");

// ---------------------------------------------------------------------------
section("4. Zero Weather/Good/Bad Labels & Zero Modern Event Predictions");
assert.ok(!allUiTexts.includes("맑음"), "Must not contain weather label 맑음");
assert.ok(!allUiTexts.includes("폭풍"), "Must not contain weather label 폭풍");
assert.ok(!allUiTexts.includes("좋은 해"), "Must not contain good year label");
assert.ok(!allUiTexts.includes("이직"), "Must not contain event prediction 이직");
assert.ok(!allUiTexts.includes("이혼"), "Must not contain event prediction 이혼");
assert.ok(!allUiTexts.includes("임신"), "Must not contain event prediction 임신");
ok("Zero weather/good/bad labels & zero modern predictions verified");

assert.ok(!allUiTexts.includes("월운"), "Must not contain Wolwoon");
assert.ok(!allUiTexts.includes("4월"), "Must not contain month reference");
assert.ok(!allUiTexts.includes("5월"), "Must not contain month reference");
assert.ok(!allUiTexts.includes("절차적 점진 적응"), "Must not contain internal taxonomy 절차적 점진 적응");
assert.ok(!allUiTexts.includes("파트너 A"), "Must not contain internal taxonomy 파트너 A");
assert.ok(!allUiTexts.includes("거주"), "Must not contain housing prediction 거주");
assert.ok(!allUiTexts.includes("부동산"), "Must not contain real estate prediction 부동산");
ok("Zero Wolwoon, zero month references & zero taxonomy leakage verified");

// ---------------------------------------------------------------------------
section("5b. Yearly Forecast Differentiation");
const f2026 = ch08.section03ThreeYearForecast[0];
const f2027 = ch08.section03ThreeYearForecast[1];
const f2028 = ch08.section03ThreeYearForecast[2];

assert.notEqual(f2026.personB.summary, f2027.personB.summary, "Donggeul 2026 and 2027 summaries must differ");
assert.notEqual(f2027.personB.summary, f2028.personB.summary, "Donggeul 2027 and 2028 summaries must differ");
ok("Yearly forecast differentiation (2026 vs 2027 vs 2028) verified");

// ---------------------------------------------------------------------------
section("6. A/B Swap Safety");
const swappedCh08 = buildMarriageChapter08Intelligence({
  personAOptions: inputB,
  personBOptions: inputA,
  psychInputA: psychB,
  psychInputB: psychA,
  names: ["동글", "Sera"],
});
assert.ok(swappedCh08.section01CurrentPeriod.personA.headline);
assert.ok(swappedCh08.section01CurrentPeriod.personB.headline);
ok("A/B swap safety verified");

// ---------------------------------------------------------------------------
section("7. Provenance Tracking & Major Finding Trace");
assert.ok(ch08.provenance.length > 0, "Provenance entries must exist");
const prov1 = ch08.provenance[0];
assert.ok(prov1.userConclusion, "Provenance user conclusion must exist");
assert.ok(prov1.personATimingEvidence.length > 0, "Person A timing evidence must exist");
assert.ok(prov1.confidence, "Provenance confidence must exist");
ok("Provenance tracking verified");

console.log("\n==========================================");
console.log("ALL 7 MARRIAGE CH08 UNIT TESTS PASSED!");
console.log("==========================================");
