/**
 * 합성 데이터 스윕 — resolveMannerArchetype(bedroom_lead) 수정 전/후 분포 비교.
 * DB 불필요 — 생년월일/시간만 넓게 스윕해서 차트를 생성한다. 읽기 전용, 코드 수정 없음.
 *
 * 실행: npx tsx tests/scripts/bedroom-manner-archetype-sweep.mjs [N]
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { countTenGodsForMarriage } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { resolveMannerArchetype } from "../../lib/relationship/marriage/bedroomProfile.ts";

// 수정 전(원본, 6:4 배정) 로직 — 비교용으로만 재현. 소스는 이미 5:5로 수정 완료됨.
function resolveMannerArchetypeOld(counts) {
  const siksin = counts["식신"] ?? 0;
  const jungwan = counts["정관"] ?? 0;
  const pyeoja = counts["편재"] ?? 0;
  const self = (counts["비견"] ?? 0) + (counts["겁재"] ?? 0);

  const powerExcess = self >= 3 || pyeoja >= 2;
  const sweetDeveloped = siksin >= 2 || jungwan >= 2 || (siksin >= 1 && jungwan >= 1);

  if (powerExcess && !sweetDeveloped) return "power_leader";
  if (sweetDeveloped && !powerExcess) return "sweet_guide";

  const sweetScore = siksin * 2 + jungwan * 2;
  const powerScore = self * 2 + pyeoja * 2;
  return sweetScore >= powerScore ? "sweet_guide" : "power_leader";
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

const oldCounts = { power_leader: 0, sweet_guide: 0 };
const newCounts = { power_leader: 0, sweet_guide: 0 };
let changed = 0;
let n = 0;

for (let i = 0; i < N; i++) {
  const t = START + rand() * (END - START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0, 10);
  const hh = String(Math.floor(rand() * 24)).padStart(2, "0");
  const mm = String(Math.floor(rand() * 60)).padStart(2, "0");
  const birthTime = `${hh}:${mm}`;

  let sajuJson;
  try {
    sajuJson = sajuFromBirth(birthDate, birthTime);
  } catch {
    continue;
  }

  const counts = countTenGodsForMarriage(sajuJson);
  const oldR = resolveMannerArchetypeOld(counts);
  const newR = resolveMannerArchetype(counts);

  oldCounts[oldR]++;
  newCounts[newR]++;
  if (oldR !== newR) changed++;
  n++;
}

function matchProb(p) {
  return p * p + (1 - p) * (1 - p);
}

console.log(`N=${n}`);
console.log("\n[OLD, 6:4 배정] power_leader/sweet_guide 분포:");
console.log(`  power_leader: ${oldCounts.power_leader} (${((oldCounts.power_leader / n) * 100).toFixed(1)}%)`);
console.log(`  sweet_guide:  ${oldCounts.sweet_guide} (${((oldCounts.sweet_guide / n) * 100).toFixed(1)}%)`);

console.log("\n[NEW, 5:5 배정] power_leader/sweet_guide 분포:");
console.log(`  power_leader: ${newCounts.power_leader} (${((newCounts.power_leader / n) * 100).toFixed(1)}%)`);
console.log(`  sweet_guide:  ${newCounts.sweet_guide} (${((newCounts.sweet_guide / n) * 100).toFixed(1)}%)`);

console.log(`\n결과가 바뀐 케이스: ${changed} (${((changed / n) * 100).toFixed(1)}%)`);
console.log("\n[짝(랜덤 독립 2인) 매칭 확률 p²+(1-p)²]");
console.log(`  OLD: ${(matchProb(oldCounts.sweet_guide / n) * 100).toFixed(1)}%`);
console.log(`  NEW: ${(matchProb(newCounts.sweet_guide / n) * 100).toFixed(1)}%`);
