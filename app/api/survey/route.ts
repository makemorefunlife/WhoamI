import { NextResponse } from "next/server";
import { calculateSaju } from "@fullstackfamily/manseryeok";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { birthDate, birthTime } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { error: "birthDate와 birthTime이 필요합니다." },
        { status: 400 },
      );
    }

    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);

    const saju = calculateSaju(year, month, day, hour, minute);

    const yearPillar = saju?.yearPillar || "";
    const monthPillar = saju?.monthPillar || "";
    const dayPillar = saju?.dayPillar || "";
    const hourPillar = saju?.hourPillar || "";

    let sajuInterpretation = "";

    if (dayPillar.includes("갑") || dayPillar.includes("을")) {
      sajuInterpretation =
        "사주에서는 스스로 자라나고 확장하려는 힘이 있는 편으로 볼 수 있어. 주변 환경의 영향을 많이 받지만, 방향만 잘 잡히면 꾸준히 뻗어나가는 타입에 가까워.";
    } else if (dayPillar.includes("병") || dayPillar.includes("정")) {
      sajuInterpretation =
        "사주에서는 안쪽에 열기와 표현력이 있는 편으로 볼 수 있어. 감정과 에너지가 분명한 편이라, 스스로 납득되는 목표가 있을 때 힘이 잘 살아나는 흐름이야.";
    } else if (dayPillar.includes("무") || dayPillar.includes("기")) {
      sajuInterpretation =
        "사주에서는 중심을 잡고 버티는 힘이 있는 편으로 볼 수 있어. 쉽게 흔들리기보다 내 기준을 지키려는 성향이 있어서, 안정감이 중요한 사람일 수 있어.";
    } else if (dayPillar.includes("경") || dayPillar.includes("신")) {
      sajuInterpretation =
        "사주에서는 판단과 결단의 힘이 비교적 뚜렷한 편으로 볼 수 있어. 필요할 때는 단호하게 정리하는 능력이 있고, 기준이 분명해질수록 강점이 살아나.";
    } else if (dayPillar.includes("임") || dayPillar.includes("계")) {
      sajuInterpretation =
        "사주에서는 흐름을 읽고 유연하게 움직이는 힘이 있는 편으로 볼 수 있어. 한 가지 방식만 고집하기보다 상황에 맞게 조절하는 능력이 장점일 수 있어.";
    } else {
      sajuInterpretation =
        "사주에서는 겉으로 보이는 모습과는 또 다른 결이 안쪽에 있을 수 있어. 지금의 너를 부정하는 게 아니라, 이런 관점도 함께 참고해볼 수 있다는 뜻이야.";
    }

    return NextResponse.json({
      saju,
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
