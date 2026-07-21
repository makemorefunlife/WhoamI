/**
 * 합성 데이터 스윕 — origin_family_distance threshold(55)가 실제로 도달
 * 가능한 값인지, 다른 축들도 십신 버그 영향으로 얼마나 쏠리는지 확인.
 * DB 불필요 — 생년월일/시간만 넓게 스윕해서 차트를 생성한다. 읽기 전용,
 * 코드 수정 없음.
 *
 * 실행: npx tsx tests/scripts/family-synthetic-threshold-sweep.mjs [N]
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { countTenGodsForMarriage } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { countElements } from "../../lib/saju/pairChartAnalysis.ts";
import { resolveOriginFamilyTension } from "../../lib/personCore/sajuSignals/sharedPersonaSignals.ts";
import {
  resolveNaggingReactionBucket,
  resolveCareBalanceBucket,
  resolveAffectionExpressionBucket,
  resolveGatheringRecoveryBucket,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";

// mapSajuMasterJson.ts의 buildJohuClimate()는 export 안 돼 있어서, 진단 목적으로
// 정확히 동일한 공식을 여기서 재현한다(원본 미수정, 읽기 전용 검증용).
function buildJohuClimateForDiagnosis(chart) {
  const el = countElements(chart);
  const wood = el.wood ?? 0;
  const fire = el.fire ?? 0;
  const earth = el.earth ?? 0;
  const metal = el.metal ?? 0;
  const water = el.water ?? 0;
  const cold = water + metal;
  const hot = fire + wood;
  const dry = earth + metal;
  const moist = water + wood;
  const heatDenom = hot + cold;
  const moistureDenom = dry + moist;
  const heat_score = heatDenom > 0 ? Math.round((hot / heatDenom) * 100) : 50;
  const moisture_score = moistureDenom > 0 ? Math.round((moist / moistureDenom) * 100) : 50;
  let temperature_band = "neutral";
  if (cold >= hot + 2) temperature_band = "cold";
  else if (hot >= cold + 2) temperature_band = "hot";
  return { heat_score, moisture_score, temperature_band };
}

function sajuFromBirth(birthDate, birthTime) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

const N = Number(process.argv[2] ?? 500);
const START = new Date("1970-01-01").getTime();
const END = new Date("2010-12-31").getTime();

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rand = seededRandom(42);

const results = [];
for (let i = 0; i < N; i++) {
  const t = START + rand() * (END - START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0, 10);
  const hh = String(Math.floor(rand() * 24)).padStart(2, "0");
  const mm = String(Math.floor(rand() * 60)).padStart(2, "0");
  const birthTime = `${hh}:${mm}`;

  try {
    const sajuJson = sajuFromBirth(birthDate, birthTime);
    const counts = countTenGodsForMarriage(sajuJson);
    const chart = buildChartContext(sajuJson.saju);
    const tension = resolveOriginFamilyTension(counts, chart);
    const nagging = resolveNaggingReactionBucket(counts).bucket;
    const care = resolveCareBalanceBucket(counts).bucket;
    const affection = resolveAffectionExpressionBucket(chart).bucket;
    const recovery = resolveGatheringRecoveryBucket(chart).bucket;
    const johu = buildJohuClimateForDiagnosis(chart);
    results.push({ birthDate, birthTime, tension, nagging, care, affection, recovery, johu, rawCounts: counts });
  } catch (e) {
    // skip invalid synthetic date
  }
}

console.log(`=== 합성 스윕 결과 (N=${results.length}) ===\n`);

console.log("[origin_family_distance 관련 원본 수치]");
const tensionIdxs = results.map((r) => r.tension.tensionIndex);
const needsCount = results.filter((r) => r.tension.needsStrongBoundary).length;
const yearTensionCount = results.filter((r) => r.tension.yearPalaceTension).length;
const hyoshinCount = results.filter((r) => r.tension.hyoshinRisk).length;
const sealExcessCount = results.filter((r) => r.tension.sealExcess).length;
const bothCount = results.filter((r) => r.tension.hyoshinRisk && r.tension.sealExcess).length;
console.log(
  `  tensionIndex: min=${Math.min(...tensionIdxs)}, max=${Math.max(...tensionIdxs)}, 평균=${(
    tensionIdxs.reduce((a, b) => a + b, 0) / tensionIdxs.length
  ).toFixed(1)}`,
);
console.log(`  yearPalaceTension=true: ${yearTensionCount}/${results.length} (${((yearTensionCount / results.length) * 100).toFixed(1)}%)`);
console.log(`  hasHyoshin=true: ${hyoshinCount}/${results.length} (${((hyoshinCount / results.length) * 100).toFixed(1)}%)`);
console.log(`  sealExcess=true: ${sealExcessCount}/${results.length} (${((sealExcessCount / results.length) * 100).toFixed(1)}%)`);
console.log(`  hyoshin&&sealExcess 동시: ${bothCount}/${results.length} (${((bothCount / results.length) * 100).toFixed(1)}%)`);
console.log(`  needsStrongBoundary=true: ${needsCount}/${results.length} (${((needsCount / results.length) * 100).toFixed(1)}%)`);

function printHist(title, key) {
  console.log(`\n[${title} bucket 분포]`);
  const hist = {};
  for (const r of results) hist[r[key]] = (hist[r[key]] ?? 0) + 1;
  for (const [k, v] of Object.entries(hist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(12)} ${String(v).padStart(4)} (${((v / results.length) * 100).toFixed(1)}%)`);
  }
}
printHist("nagging_reaction", "nagging");
printHist("care_balance", "care");
printHist("affection_expression", "affection");
printHist("gathering_recovery", "recovery");

console.log("\n[gathering_temperature 관련 원본 수치 — johu heat/moisture]");
const heatScores = results.map((r) => r.johu.heat_score);
const moistScores = results.map((r) => r.johu.moisture_score);
console.log(
  `  heat_score: min=${Math.min(...heatScores)}, max=${Math.max(...heatScores)}, 평균=${(
    heatScores.reduce((a, b) => a + b, 0) / heatScores.length
  ).toFixed(1)}`,
);
console.log(
  `  moisture_score: min=${Math.min(...moistScores)}, max=${Math.max(...moistScores)}, 평균=${(
    moistScores.reduce((a, b) => a + b, 0) / moistScores.length
  ).toFixed(1)}`,
);
console.log("\n[gathering_temperature bucket 분포]");
const tempHist = {};
for (const r of results) tempHist[r.johu.temperature_band] = (tempHist[r.johu.temperature_band] ?? 0) + 1;
for (const [k, v] of Object.entries(tempHist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(12)} ${String(v).padStart(4)} (${((v / results.length) * 100).toFixed(1)}%)`);
}

console.log("\n[참고: 일주(day pillar) 포함 십신버그 정량화]");
let selfNonZero = 0;
let selfPurelyFromBug = 0;
for (const r of results) {
  const c = r.rawCounts;
  const self = (c["비견"] ?? 0) + (c["겁재"] ?? 0);
  if (self >= 1) selfNonZero++;
  const selfExcludingDay = self - 1; // 일주가 항상 보장하는 비견 1개를 제거
  if (self > 0 && selfExcludingDay <= 0) selfPurelyFromBug++;
}
console.log(`  self>=1인 사람: ${selfNonZero}/${results.length} (${((selfNonZero / results.length) * 100).toFixed(1)}%)`);
console.log(
  `  "일주 자기비교"가 없었으면 self=0이 됐을 사람: ${selfPurelyFromBug}/${results.length} (${(
    (selfPurelyFromBug / results.length) *
    100
  ).toFixed(1)}%) — 이만큼이 순수 버그로 인한 self`,
);

console.log("\n완료.");
