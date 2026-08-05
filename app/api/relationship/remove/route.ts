import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";

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
      const mapped = mapRpcError(rpcErr.message);
      if (mapped.status >= 500) {
        logServerError("relationship/remove:", rpcErr, "rpc_failed");
      }
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("relationship/remove:", e, "internal_error");
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}
