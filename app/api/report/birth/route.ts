import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { mergeBirthCoordinateFields, updateReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

type BirthBody = {
  reportId?: string;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  birthTimeUnknown?: boolean;
};

/** reports 출생 조회 — 게스트 리포트도 reportId로 조회 가능 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
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
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const { report, error } = await fetchReportWithBirthCoords(supabase, reportId);
    if (error || !report) {
      return NextResponse.json(
        { error: error?.message ?? "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      birth_date: report.birth_date ?? null,
      birth_time: report.birth_time ?? null,
      birth_place: report.birth_place ?? null,
    });
  } catch (e) {
    console.error("report/birth GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}

/** reports 생년월일·시간·장소 저장 — 로그인 없이 게스트 리포트도 저장 가능 */
export async function POST(req: Request) {
  try {
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
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const birthTimeUnknown = body.birthTimeUnknown === true;
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
          birthTimeUnknown
            ? null
            : typeof body.birthTime === "string" && body.birthTime.trim()
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

/** 출생 정보 초기화 */
export async function DELETE(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
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
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const { error: upErr } = await updateReportPatchSafely(supabase, reportId, {
      birth_date: null,
      birth_time: null,
      birth_place: null,
      birth_latitude: null,
      birth_longitude: null,
      birth_timezone: null,
    });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await deleteReportAnalysis(supabase, reportId, "astrology");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("report/birth DELETE:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "초기화 실패" },
      { status: 500 },
    );
  }
}
