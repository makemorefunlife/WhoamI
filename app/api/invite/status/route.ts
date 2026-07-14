import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { requireUuid } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Whether this report already created an invite — owner only.
 * Response must not include invitee/host PII or full tokens.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const idCheck = requireUuid(
      new URL(req.url).searchParams.get("reportId"),
      "reportId",
    );
    if (!idCheck.ok) return idCheck.response;

    const supabase = createRouteSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ used: false, error: "server_config" });
    }
    const access = await assertOwnedReportAccess(
      supabase,
      idCheck.value,
      userId,
    );
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("invites")
      .select("id")
      .eq("from_report_id", idCheck.value)
      .limit(1);

    if (error) {
      logServerError("invite/status", error);
      return NextResponse.json({ used: false });
    }

    return NextResponse.json({ used: (data?.length ?? 0) > 0 });
  } catch (e) {
    logServerError("invite/status", e);
    return NextResponse.json({ used: false });
  }
}
