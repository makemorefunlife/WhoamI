import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";
import { getOrBuildPersonCorePair } from "@/lib/personCore/services/getOrBuildPersonCore";
import { composeFreeRelationshipPreview } from "@/lib/relationship/map/composeFreeRelationshipPreview";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";

export const runtime = "nodejs";

/**
 * Birth-data-first FREE relationship preview -- the 6-item result for the
 * invite/manual flow, computed purely from both people's Day Master (via
 * the existing 10-role Relationship Map SSOT), never from survey/psych
 * data. Mirrors app/api/relationship/analyze/basic/route.ts's access-check
 * shape (relationship_reports lookup -> assertOwnedViewerParticipantAccess)
 * but is otherwise a completely separate, read-only, non-LLM endpoint --
 * this is intentionally NOT the survey-based "basic" analysis.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim() ?? "";
    const viewerReportId = sp.get("viewerReportId")?.trim() ?? "";
    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr) {
      logServerError("relationship/map/free-preview", rrErr, "relationship_lookup_failed");
      return NextResponse.json({ error: messages.errors.serviceUnavailable }, { status: 503 });
    }
    if (!rr?.id) {
      return NextResponse.json({ error: messages.errors.notFound }, { status: 404 });
    }

    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      locale,
    );
    if (accessGuard) return accessGuard;

    const otherReportId =
      viewerReportId === rr.report_id_a ? rr.report_id_b : rr.report_id_a;

    let personViewer;
    let personOther;
    try {
      const pair = await getOrBuildPersonCorePair(viewerReportId, otherReportId);
      personViewer = viewerReportId === rr.report_id_a ? pair.personA : pair.personB;
      personOther = viewerReportId === rr.report_id_a ? pair.personB : pair.personA;
    } catch (e) {
      // Most common cause: one side hasn't entered birth data yet -- not an
      // error, just "not ready yet" for this free preview.
      return NextResponse.json(
        { ready: false, reason: "birth_data_incomplete" },
        { status: 200 },
      );
    }

    const clerkUser = await currentUser();
    const [{ data: repViewer }, { data: repOther }] = await Promise.all([
      supabase
        .from("reports")
        .select("id, name, clerk_user_id, report_type")
        .eq("id", viewerReportId)
        .maybeSingle(),
      supabase
        .from("reports")
        .select("id, name, clerk_user_id, report_type")
        .eq("id", otherReportId)
        .maybeSingle(),
    ]);

    const viewerName = resolveViewerDisplayName({
      reportName: repViewer?.name,
      clerkFirstName: clerkUser?.firstName,
      clerkFullName: clerkUser?.fullName,
      fallback: locale === "ko-KR" ? "나" : "Me",
    });
    // repOther?.name (reports.name) is only ever populated for
    // partner_manual contacts (manually-typed people with no Clerk
    // account) -- for any real Clerk-connected friend it is null, so it
    // must never be the only source checked here. Mirrors
    // app/api/relationship/detail/route.ts's partnerName resolution.
    const otherIsManual = repOther?.report_type === "partner_manual";
    const otherClerkNameById = otherIsManual
      ? {}
      : await resolveClerkDisplayNamesByUserId([repOther?.clerk_user_id]);
    const otherName = resolvePartnerDisplayName(
      repOther?.name,
      repOther?.clerk_user_id ? otherClerkNameById[repOther.clerk_user_id] : undefined,
      undefined,
      messages.report.partnerFallbackLabel,
    );

    const viewerDayMaster = personViewer.saju_master_json.stem_focus.day_stem_code;
    const otherDayMaster = personOther.saju_master_json.stem_focus.day_stem_code;

    const preview = composeFreeRelationshipPreview({
      viewerDayMaster,
      otherDayMaster,
      viewerName,
      otherName,
    });

    // Never expose the neutral-psych fallback as a real personality read --
    // this flag only tells the UI which badge to show (birth-only vs
    // survey-calibrated). See mapPsychMasterJson.ts's survey_source.
    const viewerSurveyCompleted = personViewer.psych_master_json?.survey_source === "v2_10q";
    const otherSurveyCompleted = personOther.psych_master_json?.survey_source === "v2_10q";

    return NextResponse.json({
      ready: true,
      viewerName,
      otherName,
      viewerSurveyCompleted,
      otherSurveyCompleted,
      preview,
    });
  } catch (e) {
    logServerError("relationship/map/free-preview", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
