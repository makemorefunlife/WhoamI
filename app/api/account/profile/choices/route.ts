import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { mainReportIdFor } from "@/lib/account/profileGroup";
import {
  chooseBirthFromGrouped,
  chooseSurveyFromGrouped,
  loadProfileChoices,
} from "@/lib/account/profileChoices";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { invalidatePersonCoreBlueprint } from "@/lib/personCore";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * GET ?reportId=  -- the signed-in owner's main report and the DIFFERENT saved
 * birth details / surveys held by its grouped reports (lib/account/
 * profileChoices.ts). Empty options = nothing to decide.
 * POST { reportId, field: "birth" | "survey", sourceReportId } -- the owner
 * picks one. Previous values are kept (birth history / survey rows).
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
    if (!UUID.test(reportId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const mainReportId = await mainReportIdFor(supabase, reportId);
    const choices = await loadProfileChoices(supabase, { clerkUserId: userId, mainReportId });
    if (!choices) return NextResponse.json({ choices: null }, { headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ choices }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logServerError("account/profile/choices GET", e, "internal_error");
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ result: "unauthorized" }, { status: 401 });
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
    const sourceReportId = typeof body.sourceReportId === "string" ? body.sourceReportId.trim() : "";
    const field = body.field === "birth" || body.field === "survey" ? body.field : null;
    if (!UUID.test(reportId) || !UUID.test(sourceReportId) || !field) {
      return NextResponse.json({ result: "invalid_request" }, { status: 400 });
    }
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const mainReportId = await mainReportIdFor(supabase, reportId);
    const params = { clerkUserId: userId, mainReportId, sourceReportId };
    const result =
      field === "birth"
        ? await chooseBirthFromGrouped(supabase, params)
        : await chooseSurveyFromGrouped(supabase, params);
    if (result === "chosen") {
      // Same derived-cache refresh as a normal save. Saved reports stay as made.
      if (field === "birth") {
        await deleteReportAnalysis(supabase, mainReportId, "astrology");
        await deleteReportAnalysis(supabase, mainReportId, "integrated");
      }
      await invalidatePersonCoreBlueprint(mainReportId, supabase);
    }
    const status = result === "not_allowed" ? 403 : result === "error" ? 500 : 200;
    return NextResponse.json({ result }, { status });
  } catch (e) {
    logServerError("account/profile/choices POST", e, "internal_error");
    return NextResponse.json({ result: "error" }, { status: 500 });
  }
}
