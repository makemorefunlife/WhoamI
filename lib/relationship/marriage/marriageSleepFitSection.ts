import type { ChartContext } from "@/lib/saju/chartContext";
import { chartEnergyProfile } from "@/lib/saju/marriageAnalysis";
import { branchPairKey, isGuimun, isWonjin } from "@/lib/saju/workPairRiskSignals";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";

const NEEDLE_SENSITIVE_BRANCHES = new Set(["ja", "o", "myo", "yu"]);

function sleepSensitivityScore(chart: ChartContext): number {
  let score = 0;
  const anchors = [chart.dayBranchCode, chart.hourBranchCode];

  for (const anchor of anchors) {
    if (!anchor) continue;
    for (const br of chart.branchCodes) {
      if (br === anchor) continue;
      if (isGuimun(anchor, br)) score += 3;
      if (isWonjin(anchor, br)) score += 2;
    }
    if (NEEDLE_SENSITIVE_BRANCHES.has(anchor)) score += 2;
  }

  return score;
}

export type SleepFitSection = {
  title: string;
  narrative: string;
  prescription: string;
  sensor_nickname: string | null;
  easy_sleeper_nickname: string | null;
};

export function buildSleepFitSection(params: {
  nicknameA: string;
  nicknameB: string;
  chartA: ChartContext;
  chartB: ChartContext;
}): SleepFitSection {
  const { nicknameA, nicknameB, chartA, chartB } = params;
  const sensA = sleepSensitivityScore(chartA);
  const sensB = sleepSensitivityScore(chartB);
  const energyA = chartEnergyProfile(chartA);
  const energyB = chartEnergyProfile(chartB);

  const tempContrast =
    (energyA.temperature === "cold" && energyB.temperature === "hot") ||
    (energyA.temperature === "hot" && energyB.temperature === "cold");

  const sensorIsA = sensA > sensB + 1;
  const sensorIsB = sensB > sensA + 1;
  const sensorNickname = sensorIsA
    ? nicknameA
    : sensorIsB
      ? nicknameB
      : sensA >= 4 && sensB >= 4
        ? null
        : sensA >= sensB
          ? nicknameA
          : nicknameB;
  const easyNickname =
    sensorIsA ? nicknameB : sensorIsB ? nicknameA : null;

  let narrative: string;
  let prescription: string;

  if (sensorNickname && easyNickname && Math.abs(sensA - sensB) >= 2) {
    narrative = sanitizeHomeLifeText(
      `${sensorNickname}는 바스락거리는 소리·빛·체온 차이에도 쉽게 깨는 센서형이고, ` +
        `${easyNickname}는 무던하게 잠드는 스타일입니다. ` +
        `한 침대에서 리듬을 맞추려 애쓰다 보면 둘 다 피로만 쌓입니다.`,
    );
    prescription = sanitizeHomeLifeText(
      "침실 조도를 낮추고, 침대를 분리하거나 매트리스를 독립형으로 쓰는 것이 두 사람의 수면 건강을 지키는 지름직한 처방입니다.",
    );
  } else if (sensA >= 4 && sensB >= 4) {
    narrative = sanitizeHomeLifeText(
      "둘 다 예민한 수면 타입이라 작은 소음·빛에도 깨기 쉽습니다. 서로의 피로가 곧 갈등 연료가 됩니다.",
    );
    prescription = sanitizeHomeLifeText(
      "침실은 완전 암막·백색소음·취침 1시간 전 스크린 오프를 커플 룰로 박아 두세요. 가능하면 매트리스 독립형을 검토하세요.",
    );
  } else if (tempContrast) {
    narrative = sanitizeHomeLifeText(
      "한 명은 시원한 공기·얇은 이불을, 다른 한 명은 따뜻한 실내·두꺼운 이불을 원하는 대비형 리듬입니다. 체온과 호흡 템포가 맞지 않으면 밤마다 미세한 불편이 쌓입니다.",
    );
    prescription = sanitizeHomeLifeText(
      "실내 온도는 20°C 전후로 맞추고, 이불은 각자 선택. 베개 높이·매트리스 강도도 '우리 것'이 아니라 '내 것'으로 나누세요.",
    );
  } else {
    narrative = sanitizeHomeLifeText(
      "수면 예민도는 비슷한 편이라 기본 리듬은 맞습니다. 다만 스트레스가 쌓이는 주에는 한 명이라도 깊은 잠이 깨지면 둘 다 다음 날 예민해집니다.",
    );
    prescription = sanitizeHomeLifeText(
      "취침 30분 전 대화·폰은 침실 밖으로. 피곤한 날은 '오늘은 조용 모드'만 말해 주는 신호를 정해 두세요.",
    );
  }

  return {
    title: "🛏️ 우리의 수면 주파수 (Sleep Fit)",
    narrative,
    prescription,
    sensor_nickname: sensorNickname,
    easy_sleeper_nickname: easyNickname,
  };
}
