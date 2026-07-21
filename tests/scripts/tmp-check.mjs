import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { countTenGodsForMarriage, profileTenGods } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";

function sajuFromBirth(birthDate, birthTime) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return { saju: payload.saju, tenGods: payload.tenGods };
}

const START = new Date("1970-01-01").getTime();
const END = new Date("2010-12-31").getTime();
function seededRandom(seed) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }
const rand = seededRandom(42);

let diffCount = 0;
const totals = [];
for (let i=0;i<500;i++) {
  const t = START + rand()*(END-START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0,10);
  const hh = String(Math.floor(rand()*24)).padStart(2,"0");
  const mm = String(Math.floor(rand()*60)).padStart(2,"0");
  let sajuJson;
  try { sajuJson = sajuFromBirth(birthDate, `${hh}:${mm}`); } catch { continue; }
  const counts = countTenGodsForMarriage(sajuJson);
  const p = profileTenGods(counts);
  const T = p.self+p.wealth+p.food+p.seal+p.officer;
  totals.push(T);
  const rawSweet = (p.food+p.seal+p.officer) >= (p.self+p.wealth);
  const normSweet = (p.food+p.seal+p.officer)/3 >= (p.self+p.wealth)/2;
  if (rawSweet !== normSweet) diffCount++;
}
console.log("diffCount:", diffCount);
console.log("T distribution sample:", totals.slice(0,20));
console.log("avg T:", totals.reduce((a,b)=>a+b,0)/totals.length);
console.log("min T, max T:", Math.min(...totals), Math.max(...totals));
