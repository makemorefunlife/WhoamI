import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { countTenGodsForMarriage } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";

function sajuFromBirth(birthDate, birthTime) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return { saju: payload.saju, tenGods: payload.tenGods };
}

const START = new Date("1970-01-01").getTime();
const END = new Date("2010-12-31").getTime();
function seededRandom(seed) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }
const rand = seededRandom(42);

// 편관을 power 쪽으로 옮겨 5:5로 맞춘 후보안
const POWER_GODS = ["비견","겁재","정재","편재","편관"];
const SWEET_GODS = ["식신","상관","정인","편인","정관"];

function resolve55(counts) {
  const power = POWER_GODS.reduce((s,g)=>s+(counts[g]??0),0);
  const sweet = SWEET_GODS.reduce((s,g)=>s+(counts[g]??0),0);
  return sweet >= power ? "sweet_guide" : "power_leader";
}

const dist = { power_leader: 0, sweet_guide: 0 };
let n = 0;
for (let i=0;i<500;i++) {
  const t = START + rand()*(END-START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0,10);
  const hh = String(Math.floor(rand()*24)).padStart(2,"0");
  const mm = String(Math.floor(rand()*60)).padStart(2,"0");
  let sajuJson;
  try { sajuJson = sajuFromBirth(birthDate, `${hh}:${mm}`); } catch { continue; }
  const counts = countTenGodsForMarriage(sajuJson);
  dist[resolve55(counts)]++;
  n++;
}
console.log("N:", n);
console.log("power_leader:", dist.power_leader, (dist.power_leader/n*100).toFixed(1)+"%");
console.log("sweet_guide:", dist.sweet_guide, (dist.sweet_guide/n*100).toFixed(1)+"%");
const p = dist.sweet_guide/n;
console.log("짝 매칭 확률:", ((p*p+(1-p)*(1-p))*100).toFixed(1)+"%");
