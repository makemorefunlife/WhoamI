// app/api/astrology/route.ts
import { NextResponse } from "next/server";
import { calculateChart, type Sign } from "celestine";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// 숫자 인덱스 → 한글 별자리 매핑
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

// 점성학 해석을 위한 프롬프트
const ASTROLOGY_SYSTEM_PROMPT = `당신은 20년 경력의 점성학 전문가입니다.
점성학 용어를 일상어로 풀어서 설명합니다.
"운명", "절대적" 같은 표현은 쓰지 않습니다.
사용자가 스스로를 이해하는 데 도움을 주는 것이 목적입니다.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let {
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezone,
      latitude,
      longitude,
      birthPlace,
      gender,
    } = body;

    if (!year || !month || !day || !latitude || !longitude) {
      return NextResponse.json(
        { error: "year, month, day, latitude, longitude는 필수입니다." },
        { status: 400 }
      );
    }

    hour = hour ?? 12;
    minute = minute ?? 0;
    second = second ?? 0;
    timezone = timezone ?? 9;

    // 1. 천체 위치 계산
    const chart = calculateChart({
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezone,
      latitude,
      longitude,
    });

    

    // 2. 행성 정보 추출 (calculateChart의 planets 순서: Sun, Moon, … 고정)
    const planets = {
      sun: signToKorean(chart.planets[0]?.sign),
      moon: signToKorean(chart.planets[1]?.sign),
      mercury: signToKorean(chart.planets[2]?.sign),
      venus: signToKorean(chart.planets[3]?.sign),
      mars: signToKorean(chart.planets[4]?.sign),
      jupiter: signToKorean(chart.planets[5]?.sign),
      saturn: signToKorean(chart.planets[6]?.sign),
    };

    // 3. 라이징(ASC) 추출
    const rising = signToKorean(chart.angles.ascendant?.sign);

    // 4. 하우스 — chart.houses는 배열이 아니라 { cusps: ChartHouseCusp[] } (Celestine ChartHouses)
    const houseCusps = chart.houses.cusps ?? [];
    const houses = houseCusps.slice(0, 12).map((cusp) => ({
      house: cusp.house,
      sign: signToKorean(cusp.sign),
    }));

    // 5. LLM 호출해서 해석 생성 (사주 PDF 수준으로)
    const userPrompt = `
사용자 정보:
- 생년: ${year}년 ${month}월 ${day}일
- 출생시각: ${hour}:${minute}
- 출생장소: ${birthPlace || "정보 없음"}
- 성별: ${gender || "정보 없음"}

점성학 데이터:
- 태양 (의식, 자아): ${planets.sun}
- 달 (감정, 무의식): ${planets.moon}
- 라이징 (첫인상): ${rising}
- 수성 (사고, 소통): ${planets.mercury}
- 금성 (사랑, 가치관): ${planets.venus}
- 화성 (행동, 욕망): ${planets.mars}
- 목성 (확장, 운): ${planets.jupiter}
- 토성 (책임, 한계): ${planets.saturn}
- 하우스 (삶의 영역): ${houses.map(h => `${h.house}번 하우스: ${h.sign}`).join(", ")}

위 데이터를 바탕으로 아래 형식에 맞춰 점성학 해석을 작성해주세요.

[출력 형식]
### 1. 한 줄로 요약하는 당신의 에너지
(자연/사물/동물에 비유)

### 2. 당신의 4대 요소 구성
- 지배 요소:
- 부족한 요소:
- 이 조합이 만드는 특성:

### 3. 행성별로 보는 당신의 7가지 얼굴
**태양** (2-3줄)
**달** (2-3줄)
**라이징** (2-3줄)
**수성** (2-3줄)
**금성** (2-3줄)
**화성** (2-3줄)

### 4. 당신의 강점 3가지
1.
2.
3.

### 5. 당신의 약점 3가지
1.
2.
3.

### 6. 당신의 에너지 사이클
- 에너지가 충전될 때:
- 에너지가 소진될 때:
- 회복 방법:

### 7. 실전 팁: 이런 상황에서는 이렇게
**상황1. 상대방이 나에게 감정을 쏟아낼 때**
- 자연스러운 반응:
- 추천하는 반응:

**상황2. 내가 힘든데 아무도 모를 때**
- 자연스러운 반응:
- 추천하는 반응:

**상황3. 상대방이 나를 무시하거나 무관심할 때**
- 자연스러운 반응:
- 추천하는 반응:

### 8. 오늘부터 할 수 있는 1가지

### 9. 마무리 한마디
`;

    let interpretation: string | null = null;
    let llmError: string | undefined;

    if (!openai) {
      llmError = "OPENAI_API_KEY가 설정되지 않아 해석(LLM)은 건너뜁니다.";
    } else {
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
        interpretation = llmResponse.choices[0].message.content ?? null;
      } catch (llmErr) {
        console.error("Astrology LLM error:", llmErr);
        llmError =
          llmErr instanceof Error ? llmErr.message : "LLM 호출 실패";
      }
    }

    const raw = {
      sun: planets.sun,
      moon: planets.moon,
      rising,
      mercury: planets.mercury,
      venus: planets.venus,
      mars: planets.mars,
      jupiter: planets.jupiter,
      saturn: planets.saturn,
      houses,
    };

    // 차트(Celestine)는 성공했을 때만 도달. 해석은 없어도 200 + raw 로 확인 가능.
    return NextResponse.json({
      success: true,
      chartOk: true,
      interpretation,
      ...(llmError ? { llmError } : {}),
      raw,
    });
  } catch (error) {
    console.error("Astrology API error:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      {
        success: false,
        error: "점성학 차트 계산 중 오류가 발생했습니다.",
        detail:
          process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
