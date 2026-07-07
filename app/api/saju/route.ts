// app/api/saju/route.ts



import { NextResponse } from "next/server";

import { analyzeRelations } from "@/lib/saju/analyzeRelations";

import { analyzeShinsal } from "@/lib/saju/analyzeShinsal";

import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";



export async function POST(req: Request) {

  try {

    const body = await req.json();

    const { birthDate, birthTime, reportId, birthTimeUnknown } = body;



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



    if (reportId) {

      const supabase = createServerSupabaseClient();

      if (supabase) {

        await supabase.from("saju_charts").insert({

          report_id: reportId,

          year_pillar: bundle.saju.yearPillar,

          month_pillar: bundle.saju.monthPillar,

          day_pillar: bundle.saju.dayPillar,

          hour_pillar: bundle.saju.hourPillar,

        });

      }

    }



    return NextResponse.json(toV1SajuApiPayload(bundle));

  } catch (error) {

    console.error("API 에러:", error);

    return NextResponse.json(

      { error: "사주 계산 중 오류가 발생했습니다." },

      { status: 500 },

    );

  }

}

