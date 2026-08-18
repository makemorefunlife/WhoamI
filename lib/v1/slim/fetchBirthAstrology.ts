import { calculateChart, type Sign } from "celestine";
import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { extractAstrologyTextForIntegrated } from "@/lib/report/astrologyIntegratedText";
import type { AstrologyCoordSource } from "@/lib/report/resolveAstrologyCoordinates";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";

const zodiacIndexToKorean: Record<number, string> = {
  0: "양자리",
  1: "황소자리",
  2: "쌍둥이자리",
  3: "게자리",
  4: "사자자리",
  5: "처녀자리",
  6: "천칭자리",
  7: "전갈자리",
  8: "사수자리",
  9: "염소자리",
  10: "물병자리",
  11: "물고기자리",
};

const zodiacIndexToEnglish: Record<number, string> = {
  0: "Aries",
  1: "Taurus",
  2: "Gemini",
  3: "Cancer",
  4: "Leo",
  5: "Virgo",
  6: "Libra",
  7: "Scorpio",
  8: "Sagittarius",
  9: "Capricorn",
  10: "Aquarius",
  11: "Pisces",
};

function signToLabel(sign: Sign | undefined, locale: Locale): string {
  if (sign === undefined) return locale === "ko-KR" ? "알 수 없음" : "Unknown";
  const map = locale === "ko-KR" ? zodiacIndexToKorean : zodiacIndexToEnglish;
  return map[sign as number] ?? (locale === "ko-KR" ? "알 수 없음" : "Unknown");
}

export type BirthAstrologyResult = {
  text: string;
  coord_source: AstrologyCoordSource | "unknown";
  birth_place_used: string | null;
};

export async function fetchBirthAstrologyText(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  birthPlace?: string | null;
  locale?: Locale | string;
}): Promise<BirthAstrologyResult> {
  const locale = normalizeLocale(input.locale);
  const birthPlace = input.birthPlace?.trim() ?? "";
  if (!birthPlace) {
    return {
      text:
        locale === "ko-KR"
          ? "(출생 지역이 없어 점성 차트를 계산하지 않았습니다. 태어난 지역을 입력해 주세요.)"
          : "(No astrology chart was calculated because a birth place is missing. Please add your birth place.)",
      coord_source: "unknown",
      birth_place_used: null,
    };
  }

  const { chartTime, birthTimeUnknown } = resolveBirthTimeForCharts(input);
  const reportLike: Record<string, unknown> = {
    birth_date: input.birthDate,
    birth_time: birthTimeUnknown ? null : chartTime,
    birth_place: birthPlace,
  };

  let body;
  let coords;
  try {
    const built = buildAstrologyApiRequestFromReport(reportLike);
    body = built.body;
    coords = built.coords;
  } catch {
    return {
      text:
        locale === "ko-KR"
          ? "(출생 정보로 점성 차트를 구성하지 못했습니다.)"
          : "(We couldn't build an astrology chart from this birth info.)",
      coord_source: "unknown",
      birth_place_used: null,
    };
  }

  const chart = calculateChart({
    year: body.year,
    month: body.month,
    day: body.day,
    hour: body.hour,
    minute: body.minute,
    second: 0,
    timezone: body.timezone,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  const planets = {
    sun: signToLabel(chart.planets[0]?.sign, locale),
    moon: signToLabel(chart.planets[1]?.sign, locale),
  };
  const rising = signToLabel(chart.angles.ascendant?.sign, locale);

  const placeLabel =
    coords.matchedPlace ??
    coords.birthPlaceNormalized ??
    body.birthPlace ??
    (coords.source === "default_san_francisco"
      ? "San Francisco, CA (default)"
      : null);

  // Personal-analysis timeout investigation — this used to make its own
  // gpt-4o-mini call here (~15-25s) to turn the chart facts into prose,
  // BEFORE the two-call Part A -> Part B structured chain could even start
  // (runSlimIntegratedReport awaits buildBirthEnergyContext, which awaits
  // this, ahead of the Promise.all). That made every generation a 3-deep
  // sequential LLM chain, which is what pushed a fresh generation past the
  // route's maxDuration in production. Below is exactly the fallback text
  // this function already used whenever the LLM call was unavailable or
  // failed (extractAstrologyTextForIntegrated + buildAstrologyContextForLlm)
  // — a previously-proven, already-shipped code path — now used
  // unconditionally instead of as an emergency fallback, since Part A/B and
  // runIntegratedPremiumLlm already treat this as one evidence block among
  // several to synthesize themselves, not a finished paragraph to reuse
  // verbatim. Houses are intentionally left out here, matching what that
  // existing fallback path already provided.
  const fallback = extractAstrologyTextForIntegrated({
    raw: { sun: planets.sun, moon: planets.moon, rising },
  });
  return {
    text:
      fallback ??
      (locale === "ko-KR"
        ? "(점성 해석을 생성하지 못했습니다.)"
        : "(We couldn't generate an astrology interpretation.)"),
    coord_source: coords.source,
    birth_place_used: placeLabel,
  };
}
