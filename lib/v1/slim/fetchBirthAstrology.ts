import { calculateChart, type Sign } from "celestine";
import OpenAI from "openai";
import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { extractAstrologyTextForIntegrated } from "@/lib/report/astrologyIntegratedText";
import type { AstrologyCoordSource } from "@/lib/report/resolveAstrologyCoordinates";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";

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

function signToKorean(sign: Sign | undefined): string {
  if (sign === undefined) return "알 수 없음";
  return zodiacIndexToKorean[sign as number] ?? "알 수 없음";
}

const ASTROLOGY_SYSTEM_PROMPT = `당신은 20년 경력의 점성학 전문가입니다.
점성학 용어를 일상어로 풀어서 설명합니다.
"운명", "절대적" 같은 표현은 쓰지 않습니다.
사용자가 스스로를 이해하는 데 도움을 주는 것이 목적입니다.`;

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
}): Promise<BirthAstrologyResult> {
  const birthPlace = input.birthPlace?.trim() ?? "";
  if (!birthPlace) {
    return {
      text: "(출생 지역이 없어 점성 차트를 계산하지 않았습니다. 태어난 지역을 입력해 주세요.)",
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
      text: "(출생 정보로 점성 차트를 구성하지 못했습니다.)",
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
    sun: signToKorean(chart.planets[0]?.sign),
    moon: signToKorean(chart.planets[1]?.sign),
    mercury: signToKorean(chart.planets[2]?.sign),
    venus: signToKorean(chart.planets[3]?.sign),
    mars: signToKorean(chart.planets[4]?.sign),
    jupiter: signToKorean(chart.planets[5]?.sign),
    saturn: signToKorean(chart.planets[6]?.sign),
  };
  const rising = signToKorean(chart.angles.ascendant?.sign);
  const houseCusps = chart.houses.cusps ?? [];
  const houses = houseCusps.slice(0, 12).map((cusp) => ({
    house: cusp.house,
    sign: signToKorean(cusp.sign),
  }));

  const placeLabel =
    coords.matchedPlace ??
    coords.birthPlaceNormalized ??
    body.birthPlace ??
    (coords.source === "default_seoul" ? "서울(기본)" : null);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const fallback = extractAstrologyTextForIntegrated({
      raw: { sun: planets.sun, moon: planets.moon, rising },
    });
    return {
      text:
        fallback ?? "(점성 해석 LLM 없음 — 태양·달·라이징만 계산됨)",
      coord_source: coords.source,
      birth_place_used: placeLabel,
    };
  }

  const openai = new OpenAI({ apiKey });
  const userPrompt = `
사용자 정보:
- 생년: ${body.year}년 ${body.month}월 ${body.day}일
- 출생시각: ${body.hour}:${String(body.minute).padStart(2, "0")}
- 출생장소: ${placeLabel || "미입력(서울 좌표 기본값)"}

점성학 데이터:
- 태양: ${planets.sun}
- 달: ${planets.moon}
- 라이징: ${rising}
- 수성: ${planets.mercury}
- 금성: ${planets.venus}
- 화성: ${planets.mars}
- 목성: ${planets.jupiter}
- 토성: ${planets.saturn}
- 하우스: ${houses.map((h) => `${h.house}번: ${h.sign}`).join(", ")}

위 데이터를 바탕으로 점성학 해석을 한국어로 작성해주세요. 일상어로 풀어쓰고, 1500자 내외로 핵심만 정리해주세요.`;

  try {
    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ASTROLOGY_SYSTEM_PROMPT },
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
    console.warn("fetchBirthAstrologyText LLM:", e);
  }

  const fallback = extractAstrologyTextForIntegrated({
    raw: { sun: planets.sun, moon: planets.moon, rising },
  });
  return {
    text: fallback ?? "(점성 해석을 생성하지 못했습니다.)",
    coord_source: coords.source,
    birth_place_used: placeLabel,
  };
}
