import { calculateSaju } from "@fullstackfamily/manseryeok";
import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import type { ChartContext } from "@/lib/saju/chartContext";
import { chartEnergyProfile } from "@/lib/saju/marriageAnalysis";
import { branchPairKey, isGuimun, isWonjin } from "@/lib/saju/workPairRiskSignals";
import { getBranch, toBranchCode } from "@/lib/saju/mapping";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import {
  profileTenGods,
  type TenGodCounts,
} from "./marriageTenGodAnalysis";

/** 수면 예민도 — 날카로운 리듬·감각 과부하 지지 */
const NEEDLE_SENSITIVE_BRANCHES = new Set(["ja", "o", "myo", "yu"]);

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
};

function hasBranchRelation(
  type: "branch_clash" | "branch_punishment",
  a: string,
  b: string,
): boolean {
  const key = branchPairKey(a, b);
  return (REF_RELATION_RULES as unknown as RelationRuleRow[]).some(
    (r) =>
      r.relation_type === type && branchPairKey(r.code_a, r.code_b) === key,
  );
}

function getCalendarYearBranch(calendarYear: number): string {
  const saju = calculateSaju(calendarYear, 6, 15, 12, 0) as {
    yearPillar: string;
  };
  return toBranchCode(getBranch(saju.yearPillar));
}

export type HomeRiskWeatherLevel = "sunny" | "cloudy" | "storm";

export type HomeRiskYearForecast = {
  year: number;
  year_label: string;
  icon: "☀️" | "☁️" | "⛈️";
  level: HomeRiskWeatherLevel;
  weather_label: string;
  advisory: string | null;
  severity_score: number;
};

export type ThreeYearHomeRiskForecast = {
  years: HomeRiskYearForecast[];
  summary_line: string;
  max_severity: number;
  storm_year_count: number;
};

type YearHit = {
  severity: number;
  kinds: Set<string>;
};

function scanYearBranchVsPalace(
  yearBranch: string,
  palaceBranch: string,
  palaceLabel: string,
): YearHit | null {
  if (!palaceBranch) return null;
  const kinds = new Set<string>();
  let severity = 0;

  if (hasBranchRelation("branch_clash", yearBranch, palaceBranch)) {
    kinds.add("clash");
    severity += palaceLabel === "day" ? 4 : 3;
  }
  if (hasBranchRelation("branch_punishment", yearBranch, palaceBranch)) {
    kinds.add("punishment");
    severity += palaceLabel === "day" ? 3 : 2;
  }
  if (isWonjin(yearBranch, palaceBranch)) {
    kinds.add("grudge");
    severity += 2;
  }

  if (!kinds.size) return null;
  return { severity, kinds };
}

function scoreYearForCouple(
  yearBranch: string,
  chartA: ChartContext,
  chartB: ChartContext,
): YearHit {
  const merged: YearHit = { severity: 0, kinds: new Set() };

  for (const chart of [chartA, chartB]) {
    for (const [branch, label] of [
      [chart.dayBranchCode, "day"],
      [chart.hourBranchCode, "hour"],
    ] as const) {
      const hit = scanYearBranchVsPalace(yearBranch, branch, label);
      if (!hit) continue;
      merged.severity += hit.severity;
      for (const k of hit.kinds) merged.kinds.add(k);
    }
  }

  return merged;
}

function levelFromSeverity(severity: number): HomeRiskWeatherLevel {
  if (severity >= 6) return "storm";
  if (severity >= 2) return "cloudy";
  return "sunny";
}

function weatherCopy(level: HomeRiskWeatherLevel): {
  icon: HomeRiskYearForecast["icon"];
  weather_label: string;
  advisory: string | null;
} {
  if (level === "storm") {
    return {
      icon: "⛈️",
      weather_label: "폭풍우 경보",
      advisory: sanitizeHomeLifeText(
        "이 시기에는 현실적 압박으로 서로 날이 서기 쉬우니 부부 여행이나 휴식 루틴을 미리 계획하세요.",
      ),
    };
  }
  if (level === "cloudy") {
    return {
      icon: "☁️",
      weather_label: "흐림",
      advisory: sanitizeHomeLifeText(
        "작은 오해가 쌓이기 쉬운 해예요. 주 1회 '집 안 기분 체크인'과 가벼운 데이트 밤을 캘린더에 박아 두세요.",
      ),
    };
  }
  return {
    icon: "☀️",
    weather_label: "맑음",
    advisory: null,
  };
}

const YEAR_LABELS = ["올해", "내년", "내후년"] as const;

export function buildThreeYearHomeRiskForecast(
  chartA: ChartContext,
  chartB: ChartContext,
  referenceYear: number = new Date().getFullYear(),
): ThreeYearHomeRiskForecast {
  const years: HomeRiskYearForecast[] = [];

  for (let i = 0; i < 3; i++) {
    const year = referenceYear + i;
    const yearBranch = getCalendarYearBranch(year);
    const hit = scoreYearForCouple(yearBranch, chartA, chartB);
    const level = levelFromSeverity(hit.severity);
    const copy = weatherCopy(level);

    years.push({
      year,
      year_label: YEAR_LABELS[i]!,
      icon: copy.icon,
      level,
      weather_label: copy.weather_label,
      advisory: copy.advisory,
      severity_score: hit.severity,
    });
  }

  const maxSeverity = Math.max(...years.map((y) => y.severity_score));
  const stormYearCount = years.filter((y) => y.level === "storm").length;

  const parts = years.map(
    (y) => `${y.icon} [${y.year_label}]: ${y.weather_label}`,
  );
  const summary_line = sanitizeHomeLifeText(parts.join(" | "));

  return {
    years,
    summary_line,
    max_severity: maxSeverity,
    storm_year_count: stormYearCount,
  };
}

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

export type ConflictCommunicationSection = {
  title: string;
  pattern_label: string;
  narrative: string;
  emotional_neglect_risk: string;
  explosive_nickname: string;
  stonewall_nickname: string;
};

function communicationArchetype(counts: TenGodCounts): {
  explosive: number;
  stonewall: number;
} {
  const p = profileTenGods(counts);
  return {
    explosive: p.food * 2 + (p.food >= 2 ? 2 : 0),
    stonewall: p.seal + p.officer + (p.seal + p.officer >= 3 ? 2 : 0),
  };
}

export function buildConflictCommunicationSection(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
}): ConflictCommunicationSection {
  const { nicknameA, nicknameB, countsA, countsB } = params;
  const archA = communicationArchetype(countsA);
  const archB = communicationArchetype(countsB);

  const explosiveIsA = archA.explosive > archB.explosive;
  const stonewallIsA = archA.stonewall > archB.stonewall;

  const explosiveNick = explosiveIsA ? nicknameA : nicknameB;
  const stonewallNick = stonewallIsA ? nicknameA : nicknameB;

  const samePersonExplodesAndWalls =
    explosiveNick === stonewallNick &&
    Math.abs(archA.explosive - archB.explosive) < 2 &&
    Math.abs(archA.stonewall - archB.stonewall) < 2;

  let pattern_label: string;
  let narrative: string;
  let emotional_neglect_risk: string;

  if (samePersonExplodesAndWalls) {
    pattern_label = "폭발 후 냉각형 (Burst-then-Shutdown)";
    narrative = sanitizeHomeLifeText(
      `${explosiveNick}는 감정이 올라오면 말로 쏟아낸 뒤, 스스로 문을 닫아 버리는 패턴이 강합니다. ` +
        `상대는 '방금 전까지 뭐였지?' 하며 추적하다 지칩니다.`,
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      "폭발 직후엔 해결이 된 것 같지만, 상대 입장에선 정서적 방임이 이어집니다. '지금은 쉬고 30분 뒤 이어가자'는 재접속 약속이 필수예요.",
    );
  } else if (explosiveNick !== stonewallNick) {
    pattern_label = "폭발형 × 벽창호 (Pursue–Withdraw)";
    narrative = sanitizeHomeLifeText(
      `${explosiveNick}는 서운함을 즉시 풀고 싶어 말을 쏟아내는 폭발형이고, ` +
        `${stonewallNick}는 감정이 커지면 입을 닫는 벽창호(Stonewalling)형입니다. ` +
        `한 명이 쫓을수록 다른 한 명은 문을 더 단단히 닫는 악순환 구조예요.`,
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      "추격하는 쪽은 '나를 무시한다'고 느끼고, 물러서는 쪽은 '숨 쉴 틈이 없다'고 느낍니다. 싸움이 길어질수록 둘 다 정서적으로 방치된 기분이 듭니다. 타임아웃 20분 + '돌아올 시간' 약속만이 이 루프를 끊습니다.",
    );
  } else {
    pattern_label = "완만한 조율형 (Slow Harmonizers)";
    narrative = sanitizeHomeLifeText(
      "둘 다 극단적 폭발·침묵 쪽으로 치우치지 않아, 갈등이 길게 끌기보다는 대화로 풀릴 여지가 큽니다. 다만 '괜찮아'로 넘기면 미해결 감정이 쌓일 수 있어요.",
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      "표면은 평화인데 속은 쌓이는 패턴을 조심하세요. 주 1회 '불편한 것 하나만' 꺼내는 루틴이 정서적 방임을 막습니다.",
    );
  }

  return {
    title: "🗣️ 갈등 소통 스타일 (Conflict Communication Dynamic)",
    pattern_label,
    narrative,
    emotional_neglect_risk,
    explosive_nickname: explosiveNick,
    stonewall_nickname: stonewallNick,
  };
}
