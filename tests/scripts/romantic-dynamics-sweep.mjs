/**
 * 합성 데이터 스윕 — relationshipDynamics.ts 전체(심리축 판정 + 사주 보정) band 분포 확인.
 * 설문 축 점수는 실제 유저 응답 분포가 없어 균등분포(0~100)로 합성.
 * 사주 쪽(rooted, romantic_signals, dayStemInteraction)은 실제 합성 차트로 계산.
 * 읽기 전용, 코드 수정 없음.
 *
 * 실행: npx tsx tests/scripts/romantic-dynamics-sweep.mjs [N]
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import {
  hasDayStemRootInDayBranch,
  resolveBalanceOfPower,
  resolveSubLeads,
  resolveRecoverySpeedGap,
  resolveResidualBand,
  resolveReassuranceBand,
  resolveGiveStyle,
  resolveReassuranceMatch,
  resolveRolePlayWithSajuFrame,
} from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import { extractRomanticSignals } from "../../lib/personCore/sajuSignals/extractRomanticSignals.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { sajuJsonToPillars, countElements, elementInteraction } from "../../lib/saju/pairChartAnalysis.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { REF_HEAVENLY_STEMS } from "../../lib/hardcoded/sajuReferenceData.ts";

const stemElement = new Map(REF_HEAVENLY_STEMS.map((r) => [r.code, r.element]));

function buildJohuClimateForDiagnosis(chart) {
  const el = countElements(chart);
  const wood = el.wood ?? 0, fire = el.fire ?? 0, earth = el.earth ?? 0, metal = el.metal ?? 0, water = el.water ?? 0;
  const cold = water + metal, hot = fire + wood, dry = earth + metal, moist = water + wood;
  const heatDenom = hot + cold, moistureDenom = dry + moist;
  const heat_score = heatDenom > 0 ? Math.round((hot / heatDenom) * 100) : 50;
  const moisture_score = moistureDenom > 0 ? Math.round((moist / moistureDenom) * 100) : 50;
  let temperature_band = "neutral";
  if (cold >= hot + 2) temperature_band = "cold";
  else if (hot >= cold + 2) temperature_band = "hot";
  return { heat_score, moisture_score, temperature_band, element_counts: { wood, fire, earth, metal, water } };
}

const N = Number(process.argv[2] ?? 1000);
const START = new Date("1970-01-01").getTime();
const END = new Date("2010-12-31").getTime();
function seededRandom(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
const rand = seededRandom(7);

function randomProfile() {
  const axes = ["stimulation", "self_control", "practicality", "structure", "empathy", "conflict_style", "resilience", "recognition", "energy_style", "thinking_style", "decision_style"];
  const secondary_axes = {};
  for (const a of axes) secondary_axes[a] = Math.round(rand() * 100);
  return { profile_type: "current_self", secondary_axes, primary_axes: {} };
}

function randomPerson() {
  const t = START + rand() * (END - START);
  const d = new Date(t);
  const birthDate = d.toISOString().slice(0, 10);
  const hh = String(Math.floor(rand() * 24)).padStart(2, "0");
  const mm = String(Math.floor(rand() * 60)).padStart(2, "0");
  try {
    const bundle = calculateSajuBundle({ birthDate, birthTime: `${hh}:${mm}` });
    const payload = toV1SajuApiPayload(bundle);
    const chart = buildChartContext(sajuJsonToPillars(payload.saju));
    const johu = buildJohuClimateForDiagnosis(bundle.chart);
    const romantic = extractRomanticSignals(bundle, johu);
    const rooted = hasDayStemRootInDayBranch(chart);
    const dayStemCode = bundle.chart.dayStemCode;
    return { romantic, rooted, dayStemCode };
  } catch {
    return null;
  }
}

function bump(obj, key) { obj[key] = (obj[key] ?? 0) + 1; }
function printDist(title, dist, total) {
  console.log(`[${title}]`);
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  }
  console.log();
}

const subLeadIdea = {}, subLeadDecision = {}, subLeadExec = {};
const residualBands = {};
const reassuranceMatchAB = {}, reassuranceMatchBA = {};
const sajuFrameBands = {};
let sajuFrameAgree = 0;
let n = 0;

for (let i = 0; i < N; i++) {
  const A = randomPerson();
  const B = randomPerson();
  if (!A || !B) continue;
  const profileA = randomProfile();
  const profileB = randomProfile();

  const subLeads = resolveSubLeads(A.romantic, B.romantic);
  bump(subLeadIdea, subLeads.ideaMoodLead);
  bump(subLeadDecision, subLeads.decisionApprovalLead);
  bump(subLeadExec, subLeads.executionLead);

  bump(residualBands, resolveResidualBand(A.romantic));
  bump(residualBands, resolveResidualBand(B.romantic));

  const needA = resolveReassuranceBand(profileA, A.rooted);
  const needB = resolveReassuranceBand(profileB, B.rooted);
  const giveA = resolveGiveStyle(A.romantic);
  const giveB = resolveGiveStyle(B.romantic);
  bump(reassuranceMatchAB, String(resolveReassuranceMatch(needA, giveB)));
  bump(reassuranceMatchBA, String(resolveReassuranceMatch(needB, giveA)));

  const elA = stemElement.get(A.dayStemCode) ?? "earth";
  const elB = stemElement.get(B.dayStemCode) ?? "earth";
  const dayStemInteraction = elementInteraction(elA, elB);
  const rp = resolveRolePlayWithSajuFrame(profileA, profileB, A.romantic, B.romantic, dayStemInteraction);
  bump(sajuFrameBands, rp.sajuFrame);
  if (rp.agrees) sajuFrameAgree++;

  n++;
}

console.log(`N=${n}\n`);
printDist("① idea/mood lead (식상)", subLeadIdea, n);
printDist("① decision/approval lead (관성)", subLeadDecision, n);
printDist("① execution lead (재성)", subLeadExec, n);
printDist("② residual band (A+B 합산, 2n)", residualBands, n * 2);
printDist("③ reassurance match A-need vs B-give", reassuranceMatchAB, n);
printDist("③ reassurance match B-need vs A-give", reassuranceMatchBA, n);
printDist("④ sajuFrame", sajuFrameBands, n);
console.log(`④ primaryFrame vs sajuFrame 일치율: ${((sajuFrameAgree / n) * 100).toFixed(1)}%`);
