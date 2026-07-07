import { calculateSaju } from "@fullstackfamily/manseryeok";
import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import type { ChartContext } from "@/lib/saju/chartContext";
import { branchPairKey, isWonjin } from "@/lib/saju/workPairRiskSignals";
import { getBranch, toBranchCode } from "@/lib/saju/mapping";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { homeRiskWeatherCopy } from "./marriageHomeRiskCopy";

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
    const copy = homeRiskWeatherCopy(level);

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

  return {
    years,
    summary_line: sanitizeHomeLifeText(parts.join(" | ")),
    max_severity: maxSeverity,
    storm_year_count: stormYearCount,
  };
}
