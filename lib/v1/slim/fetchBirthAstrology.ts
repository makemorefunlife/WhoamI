import { calculateChart, type Sign } from "celestine";
import { logServerError } from "@/lib/security/safeLog";
import OpenAI from "openai";
import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { extractAstrologyTextForIntegrated } from "@/lib/report/astrologyIntegratedText";
import type { AstrologyCoordSource } from "@/lib/report/resolveAstrologyCoordinates";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { buildLlmOutputLocaleInstruction } from "@/lib/i18n/llmLocale";

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

const ASTROLOGY_SYSTEM_RULES = `You are an astrology expert with 20 years of experience.
Explain astrological terms in everyday language.
Avoid words like "destiny" or "absolute."
Your goal is to help the reader understand themselves better.`;

function getAstrologySystemPrompt(locale: Locale): string {
  return `${ASTROLOGY_SYSTEM_RULES}

${buildLlmOutputLocaleInstruction(locale)}`;
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
    mercury: signToLabel(chart.planets[2]?.sign, locale),
    venus: signToLabel(chart.planets[3]?.sign, locale),
    mars: signToLabel(chart.planets[4]?.sign, locale),
    jupiter: signToLabel(chart.planets[5]?.sign, locale),
    saturn: signToLabel(chart.planets[6]?.sign, locale),
  };
  const rising = signToLabel(chart.angles.ascendant?.sign, locale);
  const houseCusps = chart.houses.cusps ?? [];
  const houses = houseCusps.slice(0, 12).map((cusp) => ({
    house: cusp.house,
    sign: signToLabel(cusp.sign, locale),
  }));

  const placeLabel =
    coords.matchedPlace ??
    coords.birthPlaceNormalized ??
    body.birthPlace ??
    (coords.source === "default_san_francisco"
      ? "San Francisco, CA (default)"
      : null);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const fallback = extractAstrologyTextForIntegrated({
      raw: { sun: planets.sun, moon: planets.moon, rising },
    });
    return {
      text:
        fallback ??
        (locale === "ko-KR"
          ? "(점성 해석 LLM 없음 — 태양·달·라이징만 계산됨)"
          : "(No astrology LLM available — only Sun, Moon, and Rising were calculated.)"),
      coord_source: coords.source,
      birth_place_used: placeLabel,
    };
  }

  const openai = new OpenAI({ apiKey });
  const defaultPlaceLabel =
    locale === "ko-KR"
      ? "미입력(샌프란시스코 좌표 기본값)"
      : "Not provided (defaulting to San Francisco coordinates)";
  const userPrompt = `
User info:
- Birth date: ${body.year}-${body.month}-${body.day}
- Birth time: ${body.hour}:${String(body.minute).padStart(2, "0")}
- Birth place: ${placeLabel || defaultPlaceLabel}

Astrology data:
- Sun: ${planets.sun}
- Moon: ${planets.moon}
- Rising: ${rising}
- Mercury: ${planets.mercury}
- Venus: ${planets.venus}
- Mars: ${planets.mars}
- Jupiter: ${planets.jupiter}
- Saturn: ${planets.saturn}
- Houses: ${houses.map((h) => `House ${h.house}: ${h.sign}`).join(", ")}

Based on the data above, write an astrology interpretation. Use everyday language and keep it to roughly 1500 characters, hitting only the key points.`;

  try {
    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getAstrologySystemPrompt(locale) },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });
    const interpretation = llmResponse.choices[0].message.content?.trim();
    if (interpretation) {
      return {
        text: interpretation,
        coord_source: coords.source,
        birth_place_used: placeLabel,
      };
    }
  } catch (e) {
    logServerError("fetchBirthAstrologyText LLM:", e, "internal_error");
  }

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
