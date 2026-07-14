import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/security/rateLimit";
import {
  readJsonBodyLimited,
  stripClientTrustFields,
} from "@/lib/security/requestValidation";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Create a self report for the signed-in Clerk user.
 * Client entitlement / report_type fields are ignored. Idempotent: reuses unfinished owned report.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    // Ignore client report_type / entitlement — always insert self.
    stripClientTrustFields(
      (parsed.body && typeof parsed.body === "object"
        ? parsed.body
        : {}) as Record<string, unknown>,
    );

    const limited = enforceRateLimit("report_create", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    // Idempotency: prefer newest owned report without completed survey.
    const { data: ownedRows } = await supabase
      .from("reports")
      .select("id, created_at")
      .eq("clerk_user_id", userId)
      .neq("report_type", "partner_manual")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const row of ownedRows ?? []) {
      const id = typeof row.id === "string" ? row.id : "";
      if (!id) continue;
      const done = await isV2SurveyCompleteForReport(supabase, id);
      if (!done) {
        return NextResponse.json({ id, reused: true });
      }
    }

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          name: null,
          clerk_user_id: userId,
          birth_date: null,
          birth_time: null,
          birth_place: null,
          report_type: "self",
          entitlement: "free",
        },
      ])
      .select("id")
      .single();

    if (error || !data?.id) {
      logServerError("report/create.insert", error);
      return NextResponse.json(
        { error: "temporarily unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json({ id: data.id, reused: false });
  } catch (e) {
    logServerError("report/create", e);
    return NextResponse.json(
      { error: "temporarily unavailable" },
      { status: 503 },
    );
  }
}
