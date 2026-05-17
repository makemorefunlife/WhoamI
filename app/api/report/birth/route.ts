import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { mergeBirthCoordinateFields, updateReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

type BirthBody = {
  reportId?: string;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

/** reports 생년월일·시간·장소 저장 (service role, 소유권 검증) */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as BirthBody;
    const reportId =
      typeof body.reportId === "string" ? body.reportId.trim() : "";
    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
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
      await supabase
        .from("reports")
        .update({ clerk_user_id: userId })
        .eq("id", reportId)
        .is("clerk_user_id", null);
    }

    const birthPlace =
      typeof body.birthPlace === "string" && body.birthPlace.trim()
        ? body.birthPlace.trim()
        : null;

    const patch = mergeBirthCoordinateFields(
      {
        birth_date:
          typeof body.birthDate === "string" && body.birthDate.trim()
            ? body.birthDate.trim()
            : null,
        birth_time:
          typeof body.birthTime === "string" && body.birthTime.trim()
            ? body.birthTime.trim()
            : null,
        birth_place: birthPlace,
      },
      birthPlace,
    );

    const { error: upErr } = await updateReportPatchSafely(
      supabase,
      reportId,
      patch,
    );

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await deleteReportAnalysis(supabase, reportId, "astrology");

    return NextResponse.json({ ok: true, ...patch });
  } catch (e) {
    console.error("report/birth:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}
