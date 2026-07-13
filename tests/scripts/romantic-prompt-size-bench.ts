/**
 * 연인 심화 프롬프트 입력 크기 비교 (레거시 장문 vs domain_signals digest)
 * 실행: npx tsx tests/scripts/romantic-prompt-size-bench.ts
 */
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";
import {
  formatPersonSajuBlock,
  formatPairSajuBlock,
} from "@/lib/saju/formatRomanticSajuInput";
import {
  buildRomanticPairSignalsDigest,
  buildRomanticPersonSignalsDigest,
} from "@/lib/relationship/romanticSajuPromptDigest";
import { analyzePairSaju, sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

function toSajuJson(
  bundle: ReturnType<typeof calculateSajuBundle>,
): SajuDataForIntegrated {
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

const b1 = calculateSajuBundle({
  birthDate: birthA.date,
  birthTime: birthA.time,
});
const b2 = calculateSajuBundle({
  birthDate: birthB.date,
  birthTime: birthB.time,
});

const sajuJsonA = toSajuJson(b1);
const sajuJsonB = toSajuJson(b2);
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
const pair = analyzePairSaju(
  sajuJsonToPillars(b1.saju),
  sajuJsonToPillars(b2.saju),
);

const oldA = formatPersonSajuBlock({
  nickname: "A",
  birthDate: birthA.date,
  birthTime: birthA.time,
  birthPlace: birthA.place,
  sajuJson: sajuJsonA,
});
const oldB = formatPersonSajuBlock({
  nickname: "B",
  birthDate: birthB.date,
  birthTime: birthB.time,
  birthPlace: birthB.place,
  sajuJson: sajuJsonB,
});
const oldPair = formatPairSajuBlock(sajuJsonA, sajuJsonB, "A", "B", pair);

const newA = buildRomanticPersonSignalsDigest({
  nickname: "A",
  birthDate: birthA.date,
  birthTime: birthA.time,
  birthPlace: birthA.place,
  master: masterA,
});
const newB = buildRomanticPersonSignalsDigest({
  nickname: "B",
  birthDate: birthB.date,
  birthTime: birthB.time,
  birthPlace: birthB.place,
  master: masterB,
});
const newPair = buildRomanticPairSignalsDigest({
  labelA: "A",
  labelB: "B",
  pairAnalysis: pair,
});

const oldTotal = oldA.length + oldB.length + oldPair.length;
const newTotal = newA.length + newB.length + newPair.length;

console.log(
  JSON.stringify(
    {
      old_chars: {
        personA: oldA.length,
        personB: oldB.length,
        pair: oldPair.length,
        total: oldTotal,
      },
      new_chars: {
        personA: newA.length,
        personB: newB.length,
        pair: newPair.length,
        total: newTotal,
      },
      reduction_pct: Math.round((1 - newTotal / oldTotal) * 100),
      approx_token_old: Math.ceil(oldTotal / 3.5),
      approx_token_new: Math.ceil(newTotal / 3.5),
      llm_calls_before: 2,
      llm_calls_after: 1,
    },
    null,
    2,
  ),
);
