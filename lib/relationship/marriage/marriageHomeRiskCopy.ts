import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import type { HomeRiskWeatherLevel, HomeRiskYearForecast } from "./marriageHomeRiskForecast";

export function homeRiskWeatherCopy(level: HomeRiskWeatherLevel): {
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
