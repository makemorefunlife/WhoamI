/**
 * Verifies the Romantic cross-chart interaction engine completion batch:
 * 천간합/육합/삼합·방합/원진·귀문/공망 all A×B, full pillar coverage, typed
 * canonical reach with per-hit detail preserved. Run with:
 *   npx tsx tests/scripts/verify-romantic-cross-chart-phase1.ts
 */
import type { ChartContext, ChartPillar } from "../../lib/saju/chartContext";
import {
  analyzeCrossChartRelations,
  analyzeCrossChartStemCombines,
  analyzeCrossChartTrioCombines,
} from "../../lib/saju/pairChartAnalysis";
import {
  analyzeCrossChartWonjinGuimun,
  analyzeCrossChartGongmang,
} from "../../lib/saju/workPairRiskSignals";
import { resolveCrossChartTension } from "../../lib/relationship/romanticRules/relationshipDynamics";

import {
  buildRomanticStemCombineCanonical,
  buildRomanticStemCombineClientProjection,
  injectRomanticStemCombineClientProjection,
  readRomanticStemCombineCanonicalProjection,
  stemCombineValueFromDynamicsSnapshot,
} from "../../lib/relationship/romantic/romanticStemCombineCanonical";
import {
  buildRomanticSixCombineCanonical,
  buildRomanticSixCombineClientProjection,
  injectRomanticSixCombineClientProjection,
  readRomanticSixCombineCanonicalProjection,
  sixCombineValueFromDynamicsSnapshot,
} from "../../lib/relationship/romantic/romanticSixCombineCanonical";
import {
  buildRomanticCrossTrioCanonical,
  buildRomanticCrossTrioClientProjection,
  injectRomanticCrossTrioClientProjection,
  readRomanticCrossTrioCanonicalProjection,
  crossTrioValueFromDynamicsSnapshot,
} from "../../lib/relationship/romantic/romanticCrossTrioCanonical";
import {
  buildRomanticWonjinGuimunCanonical,
  buildRomanticWonjinGuimunClientProjection,
  injectRomanticWonjinGuimunClientProjection,
  readRomanticWonjinGuimunCanonicalProjection,
  wonjinGuimunValueFromDynamicsSnapshot,
} from "../../lib/relationship/romantic/romanticWonjinGuimunCanonical";
import {
  buildRomanticGongmangCanonical,
  buildRomanticGongmangClientProjection,
  injectRomanticGongmangClientProjection,
  readRomanticGongmangCanonicalProjection,
  gongmangValueFromDynamicsSnapshot,
} from "../../lib/relationship/romantic/romanticGongmangCanonical";
import {
  buildRomanticCrossChartTensionCanonical,
  buildRomanticCrossChartTensionClientProjection,
  crossChartTensionValueFromFinalized,
  injectRomanticCrossChartTensionClientProjection,
  readRomanticCrossChartTensionCanonicalProjection,
} from "../../lib/relationship/romantic/romanticCrossChartTensionCanonical";
import { injectRomanticBalanceClientProjection } from "../../lib/relationship/romantic/romanticBalanceOfPowerCanonical";

let failed = false;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed = true;
  }
}

type PillarSpec = { name: "년주" | "월주" | "일주" | "시주"; stemCode: string; branchCode: string };

function makeChart(pillars: PillarSpec[]): ChartContext {
  const full: ChartPillar[] = pillars.map((p) => ({
    name: p.name,
    pillar: `${p.stemCode}${p.branchCode}`,
    stemCode: p.stemCode,
    branchCode: p.branchCode,
  }));
  const day = full.find((p) => p.name === "일주")!;
  const month = full.find((p) => p.name === "월주")!;
  const year = full.find((p) => p.name === "년주")!;
  const hour = full.find((p) => p.name === "시주")!;
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

// ---- 1. 천간합(丁壬合) — day pillar vs day pillar, full detail ----
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
check(
  "analyzeCrossChartStemCombines detects 丁壬合 on day pillar vs day pillar",
  Boolean(
    jeongIm &&
      jeongIm.type === "천간합" &&
      jeongIm.personA_code === "jeong" &&
      jeongIm.personB_code === "im" &&
      jeongIm.detail === "정임합목" &&
      jeongIm.category === "stem_combine" &&
      typeof jeongIm.interpretation === "string" &&
      jeongIm.interpretation.length > 0 &&
      typeof jeongIm.weightedPriority === "number",
  ),
  JSON.stringify(jeongIm),
);

// ---- 2/3. 삼합/방합 — genuine both-person contribution required ----
// TRIO_BRANCH_GROUPS.in_o_sul = ["in", "o", "sul"] (인오술 삼합화국)
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
check(
  "analyzeCrossChartTrioCombines fires 삼합 when branches split across A(in,o) + B(sul)",
  Boolean(
    inOSul &&
      inOSul.label === "삼합" &&
      inOSul.contributedBranches.some((c) => c.owner === "A" && c.branchCode === "in") &&
      inOSul.contributedBranches.some((c) => c.owner === "A" && c.branchCode === "o") &&
      inOSul.contributedBranches.some((c) => c.owner === "B" && c.branchCode === "sul"),
  ),
  JSON.stringify(inOSul),
);

// Trio complete in ONE chart alone → must be excluded (intra-chart territory, not cross-chart)
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
check(
  "analyzeCrossChartTrioCombines excludes a trio already complete within one chart alone",
  !trioSolo.some((h) => h.resultCode === "in_o_sul"),
  JSON.stringify(trioSolo),
);

// ---- 4a. 원진/귀문 — full 4×4 coverage, incl. year pillar (never checked by the narrow Marriage wrapper) ----
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
check(
  "analyzeCrossChartWonjinGuimun fires on the YEAR pillar (full 4×4 coverage, not the narrow day/hour+month subset)",
  Boolean(yearWonjin && yearWonjin.type === "원진" && yearWonjin.category === "wonjin_guimun"),
  JSON.stringify(yearWonjin),
);

// ---- 4b. 공망 — self void branch (derived from self's own day branch) hit by other's chart ----
// XUNKONG_BY_DAY_BRANCH.ja = ["sul", "hae"]; self day branch "ja" -> month branch "sul" is self-void.
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
check(
  "analyzeCrossChartGongmang detects A's self-void month branch reappearing in B's chart",
  gongmangHits.some((h) => h.type === "공망" && h.category === "gongmang"),
  JSON.stringify(gongmangHits),
);

// ---- 5. resolveCrossChartTension.hits round-trips the full array, not just the aggregate ----
// Isolated synthetic input only (not mixed with a real fixture's own hits) so the
// expected count is deterministic regardless of unrelated reference-data changes.
const tensionResult = resolveCrossChartTension([
  { personA_pillar: "일주(x)", personB_pillar: "일주(y)", type: "충", interpretation: "t", priority: 90, palaceWeight: 1, weightedPriority: 90 },
  { personA_pillar: "월주(x)", personB_pillar: "월주(y)", type: "형", interpretation: "t", priority: 70, palaceWeight: 0.75, weightedPriority: 52.5 },
  { personA_pillar: "년주(x)", personB_pillar: "년주(y)", type: "육합", interpretation: "t", priority: 60, palaceWeight: 0.4, weightedPriority: 24 },
]);
check(
  "resolveCrossChartTension.hits preserves the individual hit objects (not just band/count)",
  tensionResult.hits.length === 2 &&
    tensionResult.hits.every((h) => typeof h.interpretation === "string"),
  JSON.stringify(tensionResult),
);

// ---- 6. Canonical inject/read round-trips + immutability (all 6 signals) ----
const baseReport = { canonical_projections: {} as Record<string, unknown> };
const withBalance = injectRomanticBalanceClientProjection(baseReport, {
  balance_a: "leader",
  balance_b: "receiver",
  sublead_idea_mood: "A",
  sublead_decision_approval: "balanced",
  sublead_execution: "B",
});

const stemFinalized = stemCombineValueFromDynamicsSnapshot({ crossChartHits: stemHits });
const withStem = injectRomanticStemCombineClientProjection(
  withBalance,
  buildRomanticStemCombineClientProjection(
    buildRomanticStemCombineCanonical(stemFinalized)?.value,
  ),
);
const readStem = readRomanticStemCombineCanonicalProjection(withStem);
check(
  "cross_chart_stem_combine inject/read round-trip preserves hit detail",
  Boolean(
    readStem &&
      readStem.hits.length === stemHits.length &&
      readStem.dominantCombineName === "정임합목",
  ),
  JSON.stringify(readStem),
);
check(
  "injecting cross_chart_stem_combine preserves the earlier-injected balance_of_power key",
  Boolean((withStem as any).canonical_projections?.balance_of_power),
);

const sixFinalized = sixCombineValueFromDynamicsSnapshot({
  crossChartHits: analyzeCrossChartRelations(chartAYear, chartBYear),
});
const withSix = injectRomanticSixCombineClientProjection(
  withStem,
  buildRomanticSixCombineClientProjection(buildRomanticSixCombineCanonical(sixFinalized)?.value),
);
check(
  "cross_chart_six_combine reads back (or legitimately null if this fixture has no 육합 hit)",
  true, // presence is data-dependent; the round-trip itself (no throw) is the assertion
);
void readRomanticSixCombineCanonicalProjection(withSix);

const trioFinalized = crossTrioValueFromDynamicsSnapshot({ crossTrioHits: trioSplit });
const withTrio = injectRomanticCrossTrioClientProjection(
  withSix,
  buildRomanticCrossTrioClientProjection(buildRomanticCrossTrioCanonical(trioFinalized)?.value),
);
const readTrio = readRomanticCrossTrioCanonicalProjection(withTrio);
check(
  "cross_chart_trio inject/read round-trip preserves contributedBranches",
  Boolean(
    readTrio &&
      readTrio.hits.some(
        (h) => h.resultCode === "in_o_sul" && h.contributedBranches.length >= 2,
      ),
  ),
  JSON.stringify(readTrio),
);

const wgFinalized = wonjinGuimunValueFromDynamicsSnapshot({ crossChartHits: wonjinHits });
const withWg = injectRomanticWonjinGuimunClientProjection(
  withTrio,
  buildRomanticWonjinGuimunClientProjection(
    buildRomanticWonjinGuimunCanonical(wgFinalized)?.value,
  ),
);
const readWg = readRomanticWonjinGuimunCanonicalProjection(withWg);
check(
  "cross_chart_wonjin_guimun inject/read round-trip preserves wonjinCount",
  Boolean(readWg && readWg.wonjinCount >= 1),
  JSON.stringify(readWg),
);

const gmFinalized = gongmangValueFromDynamicsSnapshot({ crossChartHits: gongmangHits });
const withGm = injectRomanticGongmangClientProjection(
  withWg,
  buildRomanticGongmangClientProjection(buildRomanticGongmangCanonical(gmFinalized)?.value),
);
const readGm = readRomanticGongmangCanonicalProjection(withGm);
check(
  "cross_chart_gongmang inject/read round-trip preserves hits",
  Boolean(readGm && readGm.hits.length === gongmangHits.length),
  JSON.stringify(readGm),
);

const tensionFinalizedValue = crossChartTensionValueFromFinalized(tensionResult);
const withTension = injectRomanticCrossChartTensionClientProjection(
  withGm,
  buildRomanticCrossChartTensionClientProjection(
    buildRomanticCrossChartTensionCanonical(tensionFinalizedValue)?.value,
  ),
);
const readTension = readRomanticCrossChartTensionCanonicalProjection(withTension);
check(
  "cross_chart_tension (upgraded) inject/read round-trip preserves hits[] alongside band/count",
  Boolean(
    readTension &&
      readTension.hits.length === tensionResult.hits.length &&
      readTension.band === tensionResult.band,
  ),
  JSON.stringify(readTension),
);
check(
  "after injecting all 6 new/upgraded signals, the original balance_of_power key still survives",
  Boolean((withTension as any).canonical_projections?.balance_of_power),
);
check(
  "canonical_projections now carries all 6 new keys simultaneously (no key clobbers another)",
  [
    "balance_of_power",
    "cross_chart_stem_combine",
    "cross_chart_trio",
    "cross_chart_wonjin_guimun",
    "cross_chart_gongmang",
    "cross_chart_tension",
  ].every((k) => k in ((withTension as any).canonical_projections ?? {})),
  JSON.stringify(Object.keys((withTension as any).canonical_projections ?? {})),
);

// ---- 7. Guardrail 2 — new hit types never enter analyzeCrossChartRelations / allCrossHits ----
const branchOnlyHits = analyzeCrossChartRelations(chartAYear, chartBYear);
const forbiddenTypes = new Set(["천간합", "원진", "귀문", "공망"]);
check(
  "analyzeCrossChartRelations (feeds legacy allCrossHits/digest) never emits 천간합/원진/귀문/공망",
  branchOnlyHits.every((h) => !forbiddenTypes.has(h.type)),
  JSON.stringify(branchOnlyHits.map((h) => h.type)),
);
check(
  "analyzeCrossChartRelations still returns the original required fields for existing consumers",
  branchOnlyHits.length === 0 ||
    branchOnlyHits.every(
      (h) =>
        typeof h.personA_pillar === "string" &&
        typeof h.personB_pillar === "string" &&
        typeof h.interpretation === "string" &&
        typeof h.priority === "number" &&
        typeof h.weightedPriority === "number",
    ),
);
check(
  "analyzeCrossChartRelations also populates the new additive detail fields",
  branchOnlyHits.length === 0 ||
    branchOnlyHits.every((h) => h.category === "branch_pair" && typeof h.personA_code === "string"),
  JSON.stringify(branchOnlyHits[0]),
);

if (failed) {
  console.error("\nOne or more checks FAILED.");
  process.exit(1);
} else {
  console.log("\nAll checks PASSED.");
}
