import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { isPremiumPaywallEnabled } from "@/lib/product/premiumAccessPolicy";
import {
  assertRelationshipViewerParticipant,
  assertViewerReportUpgradeAccess,
} from "@/lib/relationship/relationshipPremiumGuard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const UPGRADE_GUARD_MESSAGES = {
  missing: "invalid request",
  forbidden: "forbidden",
} as const;

/** 결제·웹훅 이후 관계 심화 분석 슬롯 열기 (analysis_type → premium) */
export async function POST(req: Request) {
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

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const secret =
      typeof body.secret === "string" ? body.secret.trim() : "";
    const expected = process.env.RELATIONSHIP_UPGRADE_SECRET?.trim() ?? "";
    const paywallBypass = !isPremiumPaywallEnabled();

    if (!paywallBypass) {
      if (!expected) {
        console.info("[relationship/upgrade] secret_missing");
        return NextResponse.json(
          { error: "upgrade temporarily unavailable" },
          { status: 503 },
        );
      }
      if (secret !== expected) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b, analysis_type")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr) {
      console.info("[relationship/upgrade] relationship_lookup_failed");
      return NextResponse.json(
        { error: "upgrade temporarily unavailable" },
        { status: 503 },
      );
    }
    if (!rr?.id) {
      return NextResponse.json(
        { error: "relationship report not found" },
        { status: 404 },
      );
    }

    const { userId } = await auth();
    const viewerGuard = await assertViewerReportUpgradeAccess(
      supabase,
      viewerReportId,
      userId,
    );
    if (viewerGuard) return viewerGuard;

    const participantGuard = assertRelationshipViewerParticipant(
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      UPGRADE_GUARD_MESSAGES,
    );
    if (participantGuard) return participantGuard;

    const limited = enforceRateLimit("upgrade", userId);
    if (!limited.ok) {
      return NextResponse.json(
        { error: limited.error },
        {
          status: limited.status,
          headers: limited.retryAfterSec
            ? { "Retry-After": String(limited.retryAfterSec) }
            : undefined,
        },
      );
    }

    if (rr.analysis_type === "premium") {
      return NextResponse.json({
        ok: true,
        relationship_report_id: rr.id,
      });
    }

    const { data, error } = await supabase
      .from("relationship_reports")
      .update({
        analysis_type: "premium",
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipReportId)
      .eq("analysis_type", "basic")
      .select("id")
      .maybeSingle();

    if (error) {
      console.info("[relationship/upgrade] update_failed");
      return NextResponse.json(
        { error: "upgrade temporarily unavailable" },
        { status: 503 },
      );
    }
    if (!data?.id) {
      const { data: current } = await supabase
        .from("relationship_reports")
        .select("id, analysis_type")
        .eq("id", relationshipReportId)
        .maybeSingle();
      if (current?.analysis_type === "premium" && current.id) {
        return NextResponse.json({
          ok: true,
          relationship_report_id: current.id,
        });
      }
      return NextResponse.json(
        { error: "relationship report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, relationship_report_id: data.id });
  } catch (e) {
    console.error("relationship/upgrade: unexpected");
    return NextResponse.json(
      { error: "upgrade temporarily unavailable" },
      { status: 503 },
    );
  }
}
