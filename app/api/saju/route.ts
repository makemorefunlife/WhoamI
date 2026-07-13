// app/api/saju/route.ts



import { NextResponse } from "next/server";

import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";



export async function POST(req: Request) {

  try {

    const body = await req.json();

    const { birthDate, birthTime, birthTimeUnknown } = body;



    if (!birthDate) {

      return NextResponse.json(

        { error: "birthDate가 없습니다." },

        { status: 400 },

      );

    }



    const bundle = calculateSajuBundle({

      birthDate,

      birthTime,

      birthTimeUnknown: birthTimeUnknown === true || !birthTime?.trim(),

    });



    return NextResponse.json(toV1SajuApiPayload(bundle));

  } catch (error) {

    console.error("API 에러:", error);

    return NextResponse.json(

      { error: "사주 계산 중 오류가 발생했습니다." },

      { status: 500 },

    );

  }

}

