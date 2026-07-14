import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";

export const runtime = "nodejs";

/** 로그인 + 본인 report(A 또는 B) 소유 시에만 관계 행 생성/재사용 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const reportIdA =
      typeof body.reportIdA === "string" ? body.reportIdA.trim() : "";
    const reportIdB =
      typeof body.reportIdB === "string" ? body.reportIdB.trim() : "";

    if (!reportIdA || !reportIdB) {
      return NextResponse.json(
        { error: "reportIdA와 reportIdB가 필요합니다." },
        { status: 400 },
      );
    }
    if (reportIdA === reportIdB) {
      return NextResponse.json(
        { error: "서로 다른 리포트여야 합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const accessA = await assertOwnedReportAccess(supabase, reportIdA, userId);
    const accessB = await assertOwnedReportAccess(supabase, reportIdB, userId);
    if (accessA.error && accessB.error) {
      // Prefer the non-404 error if one side is merely missing.
      if (accessA.error.status !== 404) return accessA.error;
      return accessB.error;
    }

    const { relationshipReportId, created } = await ensureRelationshipReport(
      supabase,
      reportIdA,
      reportIdB,
    );

    return NextResponse.json({
      success: true,
      relationship_report_id: relationshipReportId,
      created,
    });
  } catch (e) {
    logServerError("relationship/create:", e, "internal_error");
    return NextResponse.json(
      { error: "관계 레코드를 만들지 못했습니다." },
      { status: 500 },
    );
  }
}
