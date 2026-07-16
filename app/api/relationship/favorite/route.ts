import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import {
  isRelationshipFavorite,
  setRelationshipFavorite,
} from "@/lib/relationship/analysisLog";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

function routeLocale(req: Request) {
  return resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
}

export async function GET(req: Request) {
  const locale = routeLocale(req);
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: messages.errors.relationshipIdsRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr } = await supabase
      .from("relationship_reports")
      .select("report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (!rr) {
      return NextResponse.json(
        { error: messages.errors.notFound },
        { status: 404 },
      );
    }

    const { userId } = await auth();
    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      locale,
    );
    if (accessGuard) return accessGuard;

    const favorited = await isRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
    );

    return NextResponse.json({ favorited });
  } catch (e) {
    console.error("relationship/favorite GET: unexpected");
    return NextResponse.json({ error: messages.hub.loadFailed }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const locale = routeLocale(req);
  const messages = getMessages(locale);
  try {
    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";
    const viewerReportId =
      typeof body.viewer_report_id === "string"
        ? body.viewer_report_id.trim()
        : "";
    const favorited = body.favorited === true;

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: messages.errors.relationshipIdsRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr } = await supabase
      .from("relationship_reports")
      .select("report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (!rr) {
      return NextResponse.json(
        { error: messages.errors.notFound },
        { status: 404 },
      );
    }

    const { userId } = await auth();
    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      locale,
    );
    if (accessGuard) return accessGuard;

    const ok = await setRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
      favorited,
    );

    if (!ok) {
      return NextResponse.json({ error: messages.hub.favoriteSaveFailed }, { status: 500 });
    }

    return NextResponse.json({ favorited });
  } catch (e) {
    console.error("relationship/favorite POST: unexpected");
    return NextResponse.json({ error: messages.hub.favoriteSaveFailed }, { status: 500 });
  }
}
