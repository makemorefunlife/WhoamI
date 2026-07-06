import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { CurrentSelfProfile, SurveyAnswersInput } from "@/lib/v2/survey/types";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";

export const runtime = "nodejs";

function parseAnswers(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const stringAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") stringAnswers[k] = v;
  }
  if (obj.survey_source === "v2_10q" && obj.v2_profile) {
    return stringAnswers;
  }
  return isSurveyV2AnswersComplete(stringAnswers) ? stringAnswers : null;
}

function profileFromRow(answers: Record<string, unknown>): CurrentSelfProfile | null {
  const embedded = answers.v2_profile;
  if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
    return embedded as CurrentSelfProfile;
  }
  const stringAnswers = parseAnswers(answers);
  if (!stringAnswers) return null;
  return scoreSurveyAnswers(stringAnswers as SurveyAnswersInput);
}

/** GET ?reportId= — 저장된 v2 설문 조회 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
    if (!reportId) {
      return NextResponse.json({ error: "reportId가 필요합니다." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(supabase, reportId, userId);
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("survey_responses")
      .select("answers")
      .eq("report_id", reportId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data?.answers) {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    let answers: unknown = data.answers;
    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch {
        return NextResponse.json({ ok: true, hasSurvey: false });
      }
    }
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    const record = answers as Record<string, unknown>;
    const profile = profileFromRow(record);
    if (!profile) {
      return NextResponse.json({ ok: true, hasSurvey: false });
    }

    const stringAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(record)) {
      if (/^q\d+$/.test(k) && typeof v === "string") stringAnswers[k] = v;
    }

    return NextResponse.json({
      ok: true,
      hasSurvey: true,
      answers: stringAnswers,
      profile,
    });
  } catch (e) {
    console.error("v2/survey GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}

/** POST — v2 설문 저장 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      reportId?: string;
      answers?: Record<string, string>;
      profile?: CurrentSelfProfile;
    };
    const reportId = body.reportId?.trim() ?? "";
    const answers = body.answers;
    const profile = body.profile;

    if (!reportId || !answers || !profile) {
      return NextResponse.json(
        { error: "reportId, answers, profile가 필요합니다." },
        { status: 400 },
      );
    }
    if (!isSurveyV2AnswersComplete(answers)) {
      return NextResponse.json(
        { error: "설문이 완료되지 않았습니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(supabase, reportId, userId);
    if (access.error) return access.error;

    const payload = {
      ...answers,
      survey_source: "v2_10q",
      v2_profile: profile,
    };

    const { error } = await supabase.from("survey_responses").insert({
      report_id: reportId,
      answers: payload,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("v2/survey POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}

/** DELETE ?reportId= — 설문 다시하기 */
export async function DELETE(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
    if (!reportId) {
      return NextResponse.json({ error: "reportId가 필요합니다." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(supabase, reportId, userId);
    if (access.error) return access.error;

    const { error } = await supabase
      .from("survey_responses")
      .delete()
      .eq("report_id", reportId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("v2/survey DELETE:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
