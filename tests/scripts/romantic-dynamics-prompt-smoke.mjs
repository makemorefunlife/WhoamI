/**
 * prepareRomanticSajuDeepRun 스모크 테스트 — 새 dynamics_digest가 크래시 없이
 * 프롬프트에 들어가는지, 실제 LLM 호출 없이 확인. 읽기 전용, 코드 수정 없음.
 * 실행: npx tsx tests/scripts/romantic-dynamics-prompt-smoke.mjs
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { mapSajuBundleToMasterJson } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";
import { prepareRomanticSajuDeepRun } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";

function toSajuJson(bundle) {
  return {
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    relations: bundle.relations,
    shinsals: bundle.shinsals,
  };
}

const birthA = { date: "1990-05-15", time: "14:30", place: "서울" };
const birthB = { date: "1992-08-20", time: "09:00", place: "부산" };

const b1 = calculateSajuBundle({ birthDate: birthA.date, birthTime: birthA.time });
const b2 = calculateSajuBundle({ birthDate: birthB.date, birthTime: birthB.time });

const masterA = mapSajuBundleToMasterJson({
  bundle: b1,
  birthDate: birthA.date,
  birthTime: birthA.time,
  birthTimeUnknown: false,
});
const masterB = mapSajuBundleToMasterJson({
  bundle: b2,
  birthDate: birthB.date,
  birthTime: birthB.time,
  birthTimeUnknown: false,
});

const prepared = prepareRomanticSajuDeepRun({
  nicknameA: "동글",
  nicknameB: "fafa",
  birthA,
  birthB,
  sajuJsonA: toSajuJson(b1),
  sajuJsonB: toSajuJson(b2),
  sajuMasterA: masterA,
  sajuMasterB: masterB,
  surveyProfileA: null,
  surveyProfileB: null,
  locale: "ko",
});

const idx = prepared.userPrompt.indexOf("## dynamics_digest");
console.log("dynamics_digest 포함 여부:", idx !== -1);
console.log(prepared.userPrompt.slice(idx, idx + 700));
console.log("\n전체 userPrompt 길이:", prepared.userPrompt.length);
console.log("systemPrompt 길이:", prepared.systemPrompt.length);
