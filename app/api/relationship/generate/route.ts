import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function generateRelationship(surveyA: any, surveyB: any) {
  let result = "";

  if (surveyA.q1 === surveyB.q1) {
    result += "둘은 에너지 방식이 비슷해서 편안한 관계일 수 있어. ";
  } else {
    result += "에너지 방식이 달라서 서로를 보완하거나 충돌할 수 있어. ";
  }

  if (surveyA.q5 === surveyB.q5) {
    result += "비슷한 강점을 가지고 있어서 서로 이해가 빠를 수 있어.";
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const { inviteToken } = await req.json();

    const { data: invite } = await supabase
      .from("invites")
      .select("*")
      .eq("invite_token", inviteToken)
      .single();

    if (!invite || invite.status !== "complete") {
      return NextResponse.json({ error: "연결 안됨" }, { status: 400 });
    }

    // 이미 결과 있으면 그대로 반환
    if (invite.relationship_result) {
      return NextResponse.json({
        relationship: invite.relationship_result,
      });
    }

    const reportA = invite.from_report_id;
    const reportB = invite.accepted_report_id;

    const { data: surveyA } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("report_id", reportA)
      .single();

    const { data: surveyB } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("report_id", reportB)
      .single();

    const result = generateRelationship(surveyA, surveyB);

    // 🔥 저장
    await supabase
      .from("invites")
      .update({ relationship_result: result })
      .eq("invite_token", inviteToken);

    return NextResponse.json({
      relationship: result,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "관계 분석 실패" }, { status: 500 });
  }
}
