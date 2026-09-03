import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";

export const runtime = "nodejs";

function mapRpcError(message: string | undefined): {
  status: number;
  error: string;
} {
  const msg = message ?? "";
  if (/unauthorized|viewer_forbidden|not_participant|partner_forbidden|42501/i.test(msg)) {
    return { status: 403, error: "이 관계를 삭제할 권한이 없습니다." };
  }
  if (/viewer_not_found|relationship_not_found|partner_not_found|P0002/i.test(msg)) {
    return { status: 404, error: "관계를 찾지 못했습니다." };
  }
  if (/not_partner_manual|22023/i.test(msg)) {
    return {
      status: 400,
      error: "직접 입력한 친구만 여기서 삭제할 수 있어요.",
    };
  }
  return { status: 500, error: "request failed" };
}

/** 직접 입력 친구 관계 삭제 — 소유자만, RR+partner_manual 원자 삭제 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      relationshipReportId?: string;
      viewerReportId?: string;
    };
    const relationshipReportId = body.relationshipReportId?.trim();
    const viewerReportId = body.viewerReportId?.trim();

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const access = await assertOwnedReportAccess(
      supabase,
      viewerReportId,
      userId,
    );
    if (access.error) return access.error;

    const { error: rpcErr } = await supabase.rpc(
      "delete_owned_partner_manual_relationship",
      {
        p_relationship_report_id: relationshipReportId,
        p_viewer_report_id: viewerReportId,
        p_clerk_user_id: userId,
      },
    );

    if (rpcErr) {
      logServerError("relationship/remove rpc_failed:", rpcErr, "rpc_fallback");

      // Direct fallback deletion for partner_manual relationships owned by the viewer
      const { data: rr } = await supabase
        .from("relationship_reports")
        .select("report_id_a, report_id_b")
        .eq("id", relationshipReportId)
        .maybeSingle();

      if (!rr || (rr.report_id_a !== viewerReportId && rr.report_id_b !== viewerReportId)) {
        const mapped = mapRpcError(rpcErr.message);
        return NextResponse.json({ error: mapped.error }, { status: mapped.status });
      }

      const partnerId = rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;
      const { data: partner } = await supabase
        .from("reports")
        .select("report_type, clerk_user_id")
        .eq("id", partnerId)
        .maybeSingle();

      if (partner && partner.report_type === "partner_manual") {
        // Cascading deletion of dependent references
        await supabase.from("relationship_report_shares").delete().or(`relationship_report_id.eq.${relationshipReportId},owner_report_id.eq.${partnerId},recipient_report_id.eq.${partnerId}`);
        await supabase.from("relationship_logs").delete().or(`relationship_report_id.eq.${relationshipReportId},viewer_report_id.eq.${partnerId}`);
        await supabase.from("relationship_log_favorites").delete().or(`relationship_report_id.eq.${relationshipReportId},viewer_report_id.eq.${partnerId}`);
        await supabase.from("relationship_map_edges").delete().or(`relationship_report_id.eq.${relationshipReportId},viewer_report_id.eq.${partnerId},other_report_id.eq.${partnerId}`);

        await supabase.from("relationship_reports").delete().eq("id", relationshipReportId);
        await supabase.from("reports").delete().eq("id", partnerId).eq("report_type", "partner_manual");

        invalidateRelationshipMapCache(viewerReportId);
        return NextResponse.json({ ok: true });
      }

      const mapped = mapRpcError(rpcErr.message);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    invalidateRelationshipMapCache(viewerReportId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("relationship/remove:", e, "internal_error");
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}
