import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { GUEST_INVITE_COOKIE, resolveGuestParticipant } from "@/lib/invite/guestInvite";
import { getOrBuildPersonCorePair } from "@/lib/personCore/services/getOrBuildPersonCore";
import { composeFreeRelationshipPreview } from "@/lib/relationship/map/composeFreeRelationshipPreview";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";

export const runtime = "nodejs";

/**
 * GET — the FREE relationship result for a guest participant (same shape as
 * /api/relationship/map/free-preview). Session cookie only; birth-only Day
 * Master preview, no LLM, nothing paid.
 */
export async function GET() {
  try {
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const p = await resolveGuestParticipant(supabase, (await cookies()).get(GUEST_INVITE_COOKIE)?.value);
    if (!p?.report_id || !p.inviter_report_id) return NextResponse.json({ error: "not_found" }, { status: 404 });
    let pair;
    try {
      pair = await getOrBuildPersonCorePair(p.report_id, p.inviter_report_id);
    } catch {
      return NextResponse.json({ ready: false, reason: "birth_data_incomplete" });
    }
    const [{ data: me }, { data: other }] = await Promise.all([
      supabase.from("reports").select("name").eq("id", p.report_id).maybeSingle(),
      supabase.from("reports").select("name, clerk_user_id").eq("id", p.inviter_report_id).maybeSingle(),
    ]);
    const byId = await resolveClerkDisplayNamesByUserId([other?.clerk_user_id ?? null]);
    const otherName = (other?.clerk_user_id ? byId[other.clerk_user_id] : null) ?? other?.name ?? "";
    const viewerName = me?.name ?? "";
    const preview = composeFreeRelationshipPreview({
      viewerDayMaster: pair.personA.saju_master_json.stem_focus.day_stem_code,
      otherDayMaster: pair.personB.saju_master_json.stem_focus.day_stem_code,
      viewerName,
      otherName,
    });
    return NextResponse.json({
      ready: true,
      viewerName,
      otherName,
      viewerSurveyCompleted: pair.personA.psych_master_json?.survey_source === "v2_10q",
      otherSurveyCompleted: pair.personB.psych_master_json?.survey_source === "v2_10q",
      preview,
    });
  } catch (e) {
    logServerError("invite/guest/preview", e, "internal_error");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
