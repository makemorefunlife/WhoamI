import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import type { HomeRiskWeatherLevel, HomeRiskYearForecast } from "./marriageHomeRiskForecast";

export function homeRiskWeatherCopy(
  level: HomeRiskWeatherLevel,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): {
  icon: HomeRiskYearForecast["icon"];
  weather_label: string;
  advisory: string | null;
} {
  if (level === "storm") {
    return {
      icon: "⛈️",
      weather_label: pick(locale, "Storm Warning", "폭풍우 경보"),
      advisory: sanitizeHomeLifeText(
        pick(
          locale,
          "This period makes it easy to get on edge with each other from real-world pressure, so plan a couple's trip or a rest routine ahead of time.",
          "이 시기에는 현실적 압박으로 서로 날이 서기 쉬우니 부부 여행이나 휴식 루틴을 미리 계획하세요.",
        ),
      ),
    };
  }
  if (level === "cloudy") {
    return {
      icon: "☁️",
      weather_label: pick(locale, "Cloudy", "흐림"),
      advisory: sanitizeHomeLifeText(
        pick(
          locale,
          "A year where small misunderstandings can easily build up. Pin a weekly 'household mood check-in' and a light date night into the calendar.",
          "작은 오해가 쌓이기 쉬운 해예요. 주 1회 '집 안 기분 체크인'과 가벼운 데이트 밤을 캘린더에 박아 두세요.",
        ),
      ),
    };
  }
  return {
    icon: "☀️",
    weather_label: pick(locale, "Sunny", "맑음"),
    advisory: null,
  };
}
