import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { mergeBirthCoordinateFields, updateReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { answersIndicateCompleteSurvey } from "@/lib/report/surveyCompletion";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

type SubmitBody = {
  reportId?: string;
  answers?: Record<string, string>;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

/**
 * 설문 제출 — service role로 survey_responses 저장·reports 소유 연결
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as SubmitBody;
    const reportId =
      typeof body.reportId === "string" ? body.reportId.trim() : "";
    const answers = body.answers;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }
    if (!answersIndicateCompleteSurvey(answers)) {
      return NextResponse.json(
        { error: "설문 응답이 완전하지 않습니다." },
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

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, clerk_user_id")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr) {
      return NextResponse.json({ error: repErr.message }, { status: 500 });
    }
    if (!report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const ownerId = (report as { clerk_user_id?: string | null }).clerk_user_id;
    if (ownerId != null && ownerId !== userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (ownerId == null) {
      const { error: linkErr } = await supabase
        .from("reports")
        .update({ clerk_user_id: userId })
        .eq("id", reportId)
        .is("clerk_user_id", null);
      if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }
    }

    const { error: delErr } = await supabase
      .from("survey_responses")
      .delete()
      .eq("report_id", reportId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const { error: insErr } = await supabase.from("survey_responses").insert([
      {
        report_id: reportId,
        answers,
      },
    ]);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const reportPatch: Record<string, string | number | null> = {};
    if (typeof body.birthDate === "string" && body.birthDate.trim()) {
      reportPatch.birth_date = body.birthDate.trim();
    }
    if (typeof body.birthTime === "string" && body.birthTime.trim()) {
      reportPatch.birth_time = body.birthTime.trim();
    }
    if (typeof body.birthPlace === "string" && body.birthPlace.trim()) {
      reportPatch.birth_place = body.birthPlace.trim();
    }

    if (Object.keys(reportPatch).length > 0) {
      const patchWithCoords = mergeBirthCoordinateFields(
        reportPatch,
        typeof reportPatch.birth_place === "string"
          ? reportPatch.birth_place
          : null,
      );
      const { error: upErr } = await updateReportPatchSafely(
        supabase,
        reportId,
        patchWithCoords,
      );
      if (upErr) {
        console.error("survey/submit report patch:", upErr);
      } else if (
        reportPatch.birth_date ||
        reportPatch.birth_time ||
        reportPatch.birth_place
      ) {
        await deleteReportAnalysis(supabase, reportId, "astrology");
      }
    }

    return NextResponse.json({
      ok: true,
      reportId,
      surveyCompleted: true,
    });
  } catch (e) {
    console.error("survey/submit:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}
