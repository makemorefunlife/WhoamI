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
import { diagnoseReportCreateError } from "@/lib/security/pgErrorDiagnostics";
import {
  extractSafeErrorShape,
  formatSafeErrorShape,
} from "@/lib/security/errorShape";

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

    const limited = await enforceRateLimit("report_create", userId);
    if (!limited.ok) {
      console.error(
        "[save-diag]",
        "route=POST /api/report/create",
        "branch=rate_limit",
        `status=${limited.status}`,
        `code=${limited.code ?? "none"}`,
        `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
      );
      return rateLimitResponse(limited);
    }

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

    const insertPayload = {
      name: null,
      clerk_user_id: userId,
      birth_date: null,
      birth_time: null,
      birth_place: null,
      report_type: "self",
      entitlement: "free",
    };

    const { data, error } = await supabase
      .from("reports")
      .insert([insertPayload])
      .select("id")
      .single();

    if (error || !data?.id) {
      // Bounded: pg code + a strictly-whitelisted (alnum/underscore, <=64
      // char) constraint/column identifier only. Field NAMES only, never
      // values. Never error.message/details/hint, never row data.
      const diag = diagnoseReportCreateError(error);
      const status = 503;
      console.error(
        "[save-diag]",
        "route=POST /api/report/create",
        "branch=insert_failed",
        `status=${status}`,
        `code=${diag.responseCode}`,
        `pg=${diag.pgCode}`,
        `category=${diag.category}`,
        `constraint=${diag.constraint ?? "none"}`,
        `column=${diag.column ?? "none"}`,
        `fields=${Object.keys(insertPayload).join(",")}`,
        `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
      );
      if (diag.category === "unknown_db_error") {
        // Structural-only fallback when pg code / regex classification
        // couldn't place the error: property names + short scalar
        // code/status fields, never message/details/hint.
        console.error(
          "[error-shape]",
          "context=report/create.insert",
          ...formatSafeErrorShape(extractSafeErrorShape(error)),
          `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
        );
      }
      logServerError("report/create.insert", error, diag.responseCode);
      return NextResponse.json(
        {
          error: "temporarily unavailable",
          code: diag.responseCode,
        },
        { status },
      );
    }

    return NextResponse.json({ id: data.id, reused: false });
  } catch (e) {
    console.error(
      "[save-diag]",
      "route=POST /api/report/create",
      "branch=exception",
      "status=503",
      "code=report_create_exception",
      `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
    );
    logServerError("report/create", e);
    return NextResponse.json(
      {
        error: "temporarily unavailable",
        code: "report_create_exception",
      },
      { status: 503 },
    );
  }
}
