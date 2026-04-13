// app/api/astrology/route.ts
import { NextResponse } from "next/server";
import { calculateChart } from "celestine";

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
    } = body;

    if (!year || !month || !day || !latitude || !longitude) {
      return NextResponse.json(
        { error: "year, month, day, latitude, longitude는 필수입니다." },
        { status: 400 },
      );
    }

    hour = hour ?? 12;
    minute = minute ?? 0;
    second = second ?? 0;
    timezone = timezone ?? 9;

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

    // 🔥 숫자 인덱스로 받아서 매핑
    const sunIndex = chart.planets[0]?.sign;
    const moonIndex = chart.planets[1]?.sign;
    const risingIndex = chart.angles.ascendant?.sign;

    const sun = zodiacIndexToKorean[sunIndex] || "알 수 없음";
    const moon = zodiacIndexToKorean[moonIndex] || "알 수 없음";
    const rising = zodiacIndexToKorean[risingIndex] || "알 수 없음";

    return NextResponse.json({
      success: true,
      sun,
      moon,
      rising,
      raw: {
        sunLongitude: chart.planets[0]?.longitude,
        moonLongitude: chart.planets[1]?.longitude,
        risingLongitude: chart.angles.ascendant?.longitude,
      },
    });
  } catch (error) {
    console.error("Astrology API error:", error);
    return NextResponse.json(
      { error: "점성학 계산 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
