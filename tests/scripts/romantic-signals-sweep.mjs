/**
 * 합성 데이터 스윕 — extractRomanticSignals 6축 band 분포 확인.
 * DB 불필요. 읽기 전용, 코드 수정 없음.
 *
 * 실행: npx tsx tests/scripts/romantic-signals-sweep.mjs [N]
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { extractRomanticSignals } from "../../lib/personCore/sajuSignals/extractRomanticSignals.ts";
import { countElements } from "../../lib/saju/pairChartAnalysis.ts";

// mapSajuMasterJson.ts의 buildJohuClimate()는 export 안 돼 있어서 동일 공식 재현 (읽기 전용 검증용)
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
  return { heat_score, moisture_score, temperature_band, element_counts: { wood, fire, earth, metal, water } };
}

const N = Number(process.argv[2] ?? 500);
const START = new Date("1970-01-01").getTime();
const END = new Date("2010-12-31").getTime();
function seededRandom(seed) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }
const rand = seededRandom(42);

const bands = {
  expression_band: {},
  conflict_band: {},
  affection_band: {},
  stress_band: {},
  decision_band: {},
  communication_band: {},
};
function bump(obj, key) { obj[key] = (obj[key] ?? 0) + 1; }

let n = 0;
for (let i = 0; i < N; i++) {
  const t = START + rand() * (END - START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0, 10);
  const hh = String(Math.floor(rand() * 24)).padStart(2, "0");
  const mm = String(Math.floor(rand() * 60)).padStart(2, "0");
  let bundle;
  try {
    bundle = calculateSajuBundle({ birthDate, birthTime: `${hh}:${mm}` });
  } catch {
    continue;
  }
  const johu = buildJohuClimateForDiagnosis(bundle.chart);
  const sig = extractRomanticSignals(bundle, johu);

  bump(bands.expression_band, sig.expression_style.expression_band);
  bump(bands.conflict_band, sig.conflict_response.conflict_band);
  bump(bands.affection_band, sig.affection_language.affection_band);
  bump(bands.stress_band, sig.stress_pattern.stress_band);
  bump(bands.decision_band, sig.decision_making.decision_band);
  bump(bands.communication_band, sig.communication_style.communication_band);
  n++;
}

console.log(`N=${n}\n`);
for (const [axis, dist] of Object.entries(bands)) {
  console.log(`[${axis}]`);
  for (const [band, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${band}: ${count} (${((count / n) * 100).toFixed(1)}%)`);
  }
  console.log();
}
