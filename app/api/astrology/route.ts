// app/api/astrology/route.ts
import { NextResponse } from "next/server";
import { calculateChart } from "celestine";

// 한글 별자리 매핑
const zodiacMap: Record<string, string> = {
  Aries: "양자리",
  Taurus: "황소자리",
  Gemini: "쌍둥이자리",
  Cancer: "게자리",
  Leo: "사자자리",
  Virgo: "처녀자리",
  Libra: "천칭자리",
  Scorpio: "전갈자리",
  Sagittarius: "사수자리",
  Capricorn: "염소자리",
  Aquarius: "물병자리",
  Pisces: "물고기자리",
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

    // 필수 값 확인
    if (!year || !month || !day || !latitude || !longitude) {
      return NextResponse.json(
        { error: "year, month, day, latitude, longitude는 필수입니다." },
        { status: 400 },
      );
    }

    // 기본값 설정
    hour = hour ?? 12;
    minute = minute ?? 0;
    second = second ?? 0;
    timezone = timezone ?? 9; // 기본 KST

    // Celestine으로 차트 계산
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

    // 태양, 달, 라이징 추출
    const sunSignEn = chart.planets[0]?.sign || "";
    const moonSignEn = chart.planets[1]?.sign || "";
    const risingSignEn = chart.angles.ascendant?.sign || "";

    const sun = zodiacMap[sunSignEn] || sunSignEn;
    const moon = zodiacMap[moonSignEn] || moonSignEn;
    const rising = zodiacMap[risingSignEn] || risingSignEn;

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
