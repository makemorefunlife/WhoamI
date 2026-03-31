import { NextResponse } from "next/server";
import { calculateSaju } from "@fullstackfamily/manseryeok";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { birthDate, birthTime, reportId } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { error: "birthDate 또는 birthTime이 없습니다." },
        { status: 400 },
      );
    }

    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);

    const saju = calculateSaju(year, month, day, hour, minute);

    let sajuInterpretation = "";

    if (saju.dayPillar?.includes("갑") || saju.dayPillar?.includes("을")) {
      sajuInterpretation =
        "사주에서는 스스로 자라나고 넓어지려는 힘이 있는 편으로 볼 수 있어. 환경의 영향을 받으면서도 방향이 잡히면 꾸준히 뻗어가는 타입에 가까워.";
    } else if (
      saju.dayPillar?.includes("병") ||
      saju.dayPillar?.includes("정")
    ) {
      sajuInterpretation =
        "사주에서는 안쪽에 열기와 표현력이 있는 편으로 볼 수 있어. 마음이 움직이는 이유가 분명할수록 에너지가 잘 살아나는 흐름이야.";
    } else if (
      saju.dayPillar?.includes("무") ||
      saju.dayPillar?.includes("기")
    ) {
      sajuInterpretation =
        "사주에서는 중심을 잡고 버티는 힘이 있는 편으로 볼 수 있어. 쉽게 흔들리기보다 내 기준을 지키려는 안정감이 강점일 수 있어.";
    } else if (
      saju.dayPillar?.includes("경") ||
      saju.dayPillar?.includes("신")
    ) {
      sajuInterpretation =
        "사주에서는 판단력과 결단력이 비교적 또렷한 편으로 볼 수 있어. 기준이 분명해질수록 강점이 선명하게 드러나는 타입일 수 있어.";
    } else if (
      saju.dayPillar?.includes("임") ||
      saju.dayPillar?.includes("계")
    ) {
      sajuInterpretation =
        "사주에서는 흐름을 읽고 유연하게 움직이는 힘이 있는 편으로 볼 수 있어. 상황에 맞게 조절하는 능력이 장점으로 작용할 수 있어.";
    } else {
      sajuInterpretation =
        "사주에서는 지금 보이는 모습과는 또 다른 결이 안쪽에 있을 수도 있어. 지금의 너를 부정하는 게 아니라, 이런 관점도 함께 참고해볼 수 있다는 뜻이야.";
    }

    if (reportId) {
      await supabase.from("saju_charts").insert({
        report_id: reportId,
        year_pillar: saju.yearPillar,
        month_pillar: saju.monthPillar,
        day_pillar: saju.dayPillar,
        hour_pillar: saju.hourPillar,
      });
    }

    return NextResponse.json({
      saju: {
        yearPillar: saju.yearPillar,
        monthPillar: saju.monthPillar,
        dayPillar: saju.dayPillar,
        hourPillar: saju.hourPillar,
      },
      sajuInterpretation,
    });
  } catch (error) {
    console.error("만세력 API 에러:", error);

    return NextResponse.json(
      { error: "만세력 계산 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
