/**
 * Romantic V4 — stress-style classification must be locale-independent.
 *
 * chapterLensResolvers.ts used to classify "cave withdrawal" vs "immediate
 * confrontation" stress styles by pattern-matching Korean keywords (동굴/침묵/
 * 물러나, 즉각/바로 대화/풀고자) inside the already-rendered stressResponse.text.
 * That breaks the moment the text is in English — the classification would
 * silently fall through to "neither" for every English-locale person, since
 * none of those Korean substrings appear in English prose.
 *
 * Fixed by exposing a categorical, locale-independent stressTempBand field
 * ("hot" | "cold" | "neutral") on PersonalRelationshipCe, computed once in
 * personalRelationshipCe.ts (the same value that already selects which
 * Korean/English stressResponse.text template to use), and having
 * chapterLensResolvers.ts read that field directly instead of re-deriving it
 * from rendered text. This test proves the resulting Chapter 3 (dynamics)
 * and Chapter 8 (strength/vulnerability) narrative BRANCHING is identical
 * between locales — same isSlowA/isSlowB/isFastA/isFastB outcome — even
 * though the rendered sentences differ.
 *
 * Run: npx tsx tests/unit/romantic-v4-stress-classifier-locale-safety.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { resolveDynamicsLens, resolveStrengthVulnerabilityLens } = await import(
  "../../lib/relationship/romantic/prototypeV4/chapterLensResolvers.ts"
);

function fakeRelCe(personId, name, stressTempBand, stressText) {
  return {
    personId,
    name,
    stressResponse: { text: stressText, evidenceId: `chart.${personId}.johu.stress`, source: "personal_saju_chart", sourcePath: "johu.temperature_band", confidence: "high" },
    stressTempBand,
    coreRelationshipNature: { text: "steady", evidenceId: "x", source: "x", sourcePath: "x", confidence: "high" },
    careExpression: { text: "steady", evidenceId: "x", source: "x", sourcePath: "x", confidence: "high" },
    decisionStyle: { text: "steady", evidenceId: "x", source: "x", sourcePath: "x", confidence: "high" },
    strengthsGivenToPartner: [{ text: "steady", evidenceId: "x", source: "x", sourcePath: "x", confidence: "high" }],
    depletionRisk: { text: "steady", evidenceId: "x", source: "x", sourcePath: "x", confidence: "high" },
  };
}

// ---------------------------------------------------------------------------
section("1) resolveDynamicsLens: cold+cold branch fires identically in ko-KR and en-US");

// English stress text deliberately contains NONE of the old Korean trigger
// substrings (동굴/침묵/물러나) — if the classifier still string-matched text,
// this would misclassify as "neither" for the English case.
const relCeAcoldKo = fakeRelCe("a", "지민", "cold", "감정 충돌을 피해 혼자만의 공간(동굴)으로 물러나 생각을 정리할 시간이 필요합니다.");
const relCeBcoldKo = fakeRelCe("b", "정우", "cold", "감정 충돌을 피해 혼자만의 공간(동굴)으로 물러나 생각을 정리할 시간이 필요합니다.");
const relCeAcoldEn = fakeRelCe("a", "Priya", "cold", "avoids emotional confrontation and needs time alone to sort out their thoughts.");
const relCeBcoldEn = fakeRelCe("b", "Jonas", "cold", "avoids emotional confrontation and needs time alone to sort out their thoughts.");

const facesKo = resolveDynamicsLens({ relCeA: relCeAcoldKo, relCeB: relCeBcoldKo, names: { a: "지민", b: "정우" }, locale: "ko-KR" });
const facesEn = resolveDynamicsLens({ relCeA: relCeAcoldEn, relCeB: relCeBcoldEn, names: { a: "Priya", b: "Jonas" }, locale: "en-US" });

const stressFaceKo = facesKo.find((f) => f.situation === "stress");
const stressFaceEn = facesEn.find((f) => f.situation === "stress");

// The cold+cold branch's distinctive Korean risk text mentions "동굴" — its
// English counterpart must mention the equivalent "retreat into silence"
// framing. Both must have picked the SAME branch (cold+cold), not diverged.
assert.ok(stressFaceKo.riskWhenExcess.includes("동굴"), "ko-KR cold+cold branch selected (Korean risk text)");
assert.ok(
  /silence at the same time|retreat into silence/i.test(stressFaceEn.riskWhenExcess),
  "en-US cold+cold branch selected (English risk text) — same branch as ko-KR, proving locale-independent classification",
);
ok("resolveDynamicsLens selects the identical cold+cold narrative branch regardless of locale");

// ---------------------------------------------------------------------------
section("2) resolveDynamicsLens: hot+cold (pursue-withdraw) branch fires identically in both locales");

const relCeAhotEn = fakeRelCe("a", "Priya", "hot", "wants an immediate conversation and answer.");
const relCeBcoldEn2 = fakeRelCe("b", "Jonas", "cold", "needs time alone to sort out their thoughts.");
const facesMixedEn = resolveDynamicsLens({ relCeA: relCeAhotEn, relCeB: relCeBcoldEn2, names: { a: "Priya", b: "Jonas" }, locale: "en-US" });
const stressFaceMixedEn = facesMixedEn.find((f) => f.situation === "stress");
assert.ok(
  /pursue-withdraw loop/i.test(stressFaceMixedEn.riskWhenExcess),
  "en-US hot(A)+cold(B) branch correctly selected via stressTempBand, not text pattern-matching",
);
ok("resolveDynamicsLens correctly selects the asymmetric hot/cold branch from stressTempBand alone in en-US");

// ---------------------------------------------------------------------------
section("3) resolveStrengthVulnerabilityLens: cold+cold shared-vulnerability branch is locale-independent");

const svKo = resolveStrengthVulnerabilityLens({ relCeA: relCeAcoldKo, relCeB: relCeBcoldKo, names: { a: "지민", b: "정우" }, locale: "ko-KR" });
const svEn = resolveStrengthVulnerabilityLens({ relCeA: relCeAcoldEn, relCeB: relCeBcoldEn, names: { a: "Priya", b: "Jonas" }, locale: "en-US" });
// Markers updated for the Romantic VNext editorial pass's tone rewrite
// (chapterLensResolvers.ts's cold+cold sharedVulnText branch no longer says
// "동굴"/"retreat into silence" — it was rewritten in plainer language) —
// this still checks the same thing: the cold+cold branch, not another one.
assert.ok(svKo.sharedVulnerability.includes("참는"), "ko-KR cold+cold shared-vulnerability branch selected");
assert.ok(
  /let it go/i.test(svEn.sharedVulnerability),
  "en-US cold+cold shared-vulnerability branch selected — same branch as ko-KR",
);
ok("resolveStrengthVulnerabilityLens selects the identical cold+cold vulnerability branch regardless of locale");

// ---------------------------------------------------------------------------
section("4) Zero Hangul in any en-US output from this module");

const enText = JSON.stringify([facesEn, facesMixedEn, svEn]);
assert.equal(/[가-힣]/.test(enText), false, "en-US chapterLensResolvers output must contain zero Hangul");
ok("zero Hangul across resolveDynamicsLens + resolveStrengthVulnerabilityLens en-US output");

console.log("\nOK: romantic-v4-stress-classifier-locale-safety tests passed");
