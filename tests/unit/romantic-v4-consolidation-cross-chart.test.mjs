/**
 * Romantic V4 Engine Consolidation — Batch A1 (cross-chart calculation lock).
 *
 * Ports the exact-value assertions already proven in
 * tests/scripts/verify-romantic-cross-chart-phase1.ts and
 * tests/scripts/verify-romantic-connection-batch.ts into a permanent
 * tests/unit/*.test.mjs file, so these calculation rules are guarded by the
 * normal test suite (not a manually-run script) before Batch B relocates
 * relationshipDynamics.ts and Batch C rewires buildActualFourCeContract.ts.
 *
 * These are all real saju-fact calculations (stem/branch codes, shinsal
 * flags) — no survey/psych-axis data required, so none of this is affected
 * by the CurrentSelfProfile gap documented in
 * romantic-v4-consolidation-pair-dynamics.test.mjs.
 *
 * Run: npx tsx tests/unit/romantic-v4-consolidation-cross-chart.test.mjs
 */
import assert from "node:assert/strict";
import {
  analyzeCrossChartRelations,
  analyzeCrossChartStemCombines,
  analyzeCrossChartTrioCombines,
} from "../../lib/saju/pairChartAnalysis.ts";
import {
  analyzeCrossChartWonjinGuimun,
  analyzeCrossChartGongmang,
} from "../../lib/saju/workPairRiskSignals.ts";
import { resolveCrossChartTension } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import { buildSpecialSignals } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function makeChart(pillars) {
  const full = pillars.map((p) => ({
    name: p.name,
    pillar: `${p.stemCode}${p.branchCode}`,
    stemCode: p.stemCode,
    branchCode: p.branchCode,
  }));
  const day = full.find((p) => p.name === "일주");
  const month = full.find((p) => p.name === "월주");
  const year = full.find((p) => p.name === "년주");
  const hour = full.find((p) => p.name === "시주");
  return {
    pillars: full,
    stemCodes: new Set(full.map((p) => p.stemCode)),
    branchCodes: new Set(full.map((p) => p.branchCode)),
    dayStemCode: day.stemCode,
    dayBranchCode: day.branchCode,
    monthStemCode: month.stemCode,
    monthBranchCode: month.branchCode,
    yearStemCode: year.stemCode,
    yearBranchCode: year.branchCode,
    hourStemCode: hour.stemCode,
    hourBranchCode: hour.branchCode,
    dayPillar: day.pillar,
  };
}

// ---------------------------------------------------------------------------
section("1) 천간합(丁壬合) — exact day-pillar-vs-day-pillar pairing");

const chartAStem = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "in" },
  { name: "월주", stemCode: "gap", branchCode: "myo" },
  { name: "일주", stemCode: "jeong", branchCode: "sa" },
  { name: "시주", stemCode: "gap", branchCode: "o" },
]);
const chartBStem = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "chuk" },
  { name: "월주", stemCode: "gap", branchCode: "jin" },
  { name: "일주", stemCode: "im", branchCode: "mi" },
  { name: "시주", stemCode: "gap", branchCode: "sin" },
]);
const stemHits = analyzeCrossChartStemCombines(chartAStem, chartBStem);
const jeongIm = stemHits.find(
  (h) => h.personA_pillarSlot === "일주" && h.personB_pillarSlot === "일주",
);
assert.ok(jeongIm, "expected a day-pillar stem-combine hit");
assert.equal(jeongIm.type, "천간합");
assert.equal(jeongIm.personA_code, "jeong");
assert.equal(jeongIm.personB_code, "im");
assert.equal(jeongIm.detail, "정임합목");
assert.equal(jeongIm.category, "stem_combine");
ok("丁壬合 (정임합목) detected exactly on day×day pillars");

// ---------------------------------------------------------------------------
section("2) 삼합/방합 — genuine cross-person contribution required");

const chartASplit = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "chuk" },
  { name: "월주", stemCode: "gap", branchCode: "in" },
  { name: "일주", stemCode: "gap", branchCode: "o" },
  { name: "시주", stemCode: "gap", branchCode: "chuk" },
]);
const chartBSplit = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "sul" },
  { name: "월주", stemCode: "gap", branchCode: "chuk" },
  { name: "일주", stemCode: "gap", branchCode: "chuk" },
  { name: "시주", stemCode: "gap", branchCode: "chuk" },
]);
const trioSplit = analyzeCrossChartTrioCombines(chartASplit, chartBSplit);
const inOSul = trioSplit.find((h) => h.resultCode === "in_o_sul");
assert.ok(inOSul, "expected 인오술 삼합 to fire when split across A+B");
assert.equal(inOSul.label, "삼합");
assert.ok(inOSul.contributedBranches.some((c) => c.owner === "A" && c.branchCode === "in"));
assert.ok(inOSul.contributedBranches.some((c) => c.owner === "A" && c.branchCode === "o"));
assert.ok(inOSul.contributedBranches.some((c) => c.owner === "B" && c.branchCode === "sul"));
ok("인오술 삼합 fires with correct A/B contribution split");

const chartASolo = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "in" },
  { name: "월주", stemCode: "gap", branchCode: "o" },
  { name: "일주", stemCode: "gap", branchCode: "sul" },
  { name: "시주", stemCode: "gap", branchCode: "chuk" },
]);
const chartBUnrelated = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "chuk" },
  { name: "월주", stemCode: "gap", branchCode: "chuk" },
  { name: "일주", stemCode: "gap", branchCode: "chuk" },
  { name: "시주", stemCode: "gap", branchCode: "chuk" },
]);
const trioSolo = analyzeCrossChartTrioCombines(chartASolo, chartBUnrelated);
assert.ok(
  !trioSolo.some((h) => h.resultCode === "in_o_sul"),
  "a trio complete within one chart alone must NOT count as cross-chart",
);
ok("trio complete in one chart alone is correctly excluded");

// ---------------------------------------------------------------------------
section("3) 원진/귀문 — full 4×4 pillar coverage including year pillar");

const chartAYear = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "ja" },
  { name: "월주", stemCode: "gap", branchCode: "chuk" },
  { name: "일주", stemCode: "gap", branchCode: "in" },
  { name: "시주", stemCode: "gap", branchCode: "myo" },
]);
const chartBYear = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "myo" },
  { name: "월주", stemCode: "gap", branchCode: "chuk" },
  { name: "일주", stemCode: "gap", branchCode: "jin" },
  { name: "시주", stemCode: "gap", branchCode: "sa" },
]);
const wonjinHits = analyzeCrossChartWonjinGuimun(chartAYear, chartBYear);
const yearWonjin = wonjinHits.find(
  (h) => h.personA_pillarSlot === "년주" && h.personB_pillarSlot === "년주",
);
assert.ok(yearWonjin, "expected 원진 to fire on the year pillar");
assert.equal(yearWonjin.type, "원진");
assert.equal(yearWonjin.category, "wonjin_guimun");
ok("원진 fires on year pillar (full 4×4 coverage)");

// ---------------------------------------------------------------------------
section("4) 공망 — self-void branch reappearing in partner's chart");

const chartAVoid = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "chuk" },
  { name: "월주", stemCode: "gap", branchCode: "sul" },
  { name: "일주", stemCode: "gap", branchCode: "ja" },
  { name: "시주", stemCode: "gap", branchCode: "in" },
]);
const chartBVoidHit = makeChart([
  { name: "년주", stemCode: "gap", branchCode: "sul" },
  { name: "월주", stemCode: "gap", branchCode: "chuk" },
  { name: "일주", stemCode: "gap", branchCode: "jin" },
  { name: "시주", stemCode: "gap", branchCode: "sa" },
]);
const gongmangHits = analyzeCrossChartGongmang(chartAVoid, chartBVoidHit);
assert.ok(
  gongmangHits.some((h) => h.type === "공망" && h.category === "gongmang"),
  "expected A's self-void branch to be detected in B's chart",
);
ok("공망 self-void-branch detection fires correctly");

// ---------------------------------------------------------------------------
section("5) 충/형/파/해 tension banding — exact thresholds");

const tensionHigh = resolveCrossChartTension([
  { personA_pillar: "일주(x)", personB_pillar: "일주(y)", type: "충", interpretation: "t", priority: 90, palaceWeight: 1, weightedPriority: 90 },
  { personA_pillar: "월주(x)", personB_pillar: "월주(y)", type: "형", interpretation: "t", priority: 70, palaceWeight: 0.75, weightedPriority: 52.5 },
  { personA_pillar: "년주(x)", personB_pillar: "년주(y)", type: "육합", interpretation: "t", priority: 60, palaceWeight: 0.4, weightedPriority: 24 },
]);
assert.equal(tensionHigh.band, "high");
assert.equal(tensionHigh.dominantType, "충");
assert.equal(tensionHigh.hitCount, 2);
assert.equal(tensionHigh.hits.length, 2, "육합 must be excluded from tension hits");
ok("tension bands 'high' at exactly 2 hits, 육합 excluded, dominant = highest weighted priority");

const tensionNone = resolveCrossChartTension([
  { personA_pillar: "년주(x)", personB_pillar: "년주(y)", type: "육합", interpretation: "t", priority: 80, palaceWeight: 0.4, weightedPriority: 32 },
]);
assert.equal(tensionNone.band, "none");
assert.equal(tensionNone.hitCount, 0);
ok("tension band 'none' when only 육합 present (not a tension type)");

// ---------------------------------------------------------------------------
section("6) 도화(dohwa) — 함지살-only regression");

const fakeChart = { branchCodes: new Set() };
const dohwaHong = buildSpecialSignals(fakeChart, [{ name_ko: "홍염살" }]).find(
  (s) => s.key === "dohwa",
);
const dohwaHam = buildSpecialSignals(fakeChart, [{ name_ko: "함지살" }]).find(
  (s) => s.key === "dohwa",
);
const dohwaNone = buildSpecialSignals(fakeChart, [{ name_ko: "천을귀인" }]).find(
  (s) => s.key === "dohwa",
);
assert.equal(dohwaHong.possessed, true, "홍염살-only chart must flag dohwa=true");
assert.equal(dohwaHam.possessed, true, "함지살-only chart must flag dohwa=true (regression)");
assert.ok(dohwaHam.evidence.includes("shinsal:함지살"));
assert.equal(dohwaNone.possessed, false, "chart with neither source must flag dohwa=false");
ok("도화 possession fires for both 홍염살 and 함지살 sources, false otherwise");

console.log("\nOK: romantic-v4-consolidation-cross-chart tests passed");
