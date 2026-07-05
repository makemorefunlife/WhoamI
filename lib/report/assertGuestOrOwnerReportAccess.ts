import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ReportOwnerRow = {
  id: string;
  clerk_user_id?: string | null;
};

/**
 * reports 행 접근 — 게스트 리포트(clerk_user_id null)는 reportId만 알면 허용.
 * 로그인 사용자는 소유권 일치 또는 미할당 리포트 claim.
 */
export async function assertGuestOrOwnerReportAccess(
  supabase: SupabaseClient,
  reportId: string,
  userId: string | null,
): Promise<
  | { report: ReportOwnerRow; error?: undefined }
  | { report?: undefined; error: NextResponse }
> {
  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select("id, clerk_user_id")
    .eq("id", reportId)
    .maybeSingle();

  if (repErr) {
    return {
      error: NextResponse.json({ error: repErr.message }, { status: 500 }),
    };
  }
  if (!report?.id) {
    return {
      error: NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      ),
    };
  }

  const ownerId = (report as ReportOwnerRow).clerk_user_id;

  if (ownerId != null) {
    if (!userId) {
      return {
        error: NextResponse.json(
          { error: "이 리포트는 로그인이 필요합니다." },
          { status: 401 },
        ),
      };
    }
    if (ownerId !== userId) {
      return {
        error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }),
      };
    }
    return { report: report as ReportOwnerRow };
  }

  if (userId) {
    await supabase
      .from("reports")
      .update({ clerk_user_id: userId })
      .eq("id", reportId)
      .is("clerk_user_id", null);
  }

  return { report: report as ReportOwnerRow };
}
