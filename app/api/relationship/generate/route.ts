import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromOutboundInvites,
  mergeRelationshipRowsFromInboundInvites,
  type RelationshipReportRow,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { resolveIntegratedRelationshipText } from "@/lib/relationship/resolveIntegratedRelationshipText";

export const runtime = "nodejs";

const LOG = "[relationship/generate]";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "요청 본문이 올바른 JSON이 아닙니다." },
        { status: 400 },
      );
    }

    const reportId =
      typeof (body as { reportId?: unknown }).reportId === "string"
        ? (body as { reportId: string }).reportId.trim()
        : "";
    const inviteToken =
      typeof (body as { inviteToken?: unknown }).inviteToken === "string"
        ? (body as { inviteToken: string }).inviteToken.trim()
        : "";

    if (!reportId && !inviteToken) {
      return NextResponse.json(
        { error: "reportId 또는 inviteToken이 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    if (reportId && !inviteToken) {
      const access = await assertOwnedReportAccess(supabase, reportId, userId);
      if (access.error) return access.error;
      const text = await resolveIntegratedRelationshipText(reportId);
      return NextResponse.json({ relationship: text });
    }

    let rows: RelationshipReportRow[] = [];
    let viewerReportId = reportId;

    if (reportId) {
      const access = await assertOwnedReportAccess(supabase, reportId, userId);
      if (access.error) return access.error;

      rows = await fetchRelationshipReportRowsForReportId(supabase, reportId);
      rows = await mergeRelationshipRowsFromOutboundInvites(
        supabase,
        reportId,
        rows,
      );
      rows = await mergeRelationshipRowsFromInboundInvites(
        supabase,
        reportId,
        rows,
      );
    }

    if (inviteToken) {
      const { data: invite } = await supabase
        .from("invites")
        .select(
          "id, status, relationship_report_id, from_report_id, accepted_report_id",
        )
        .eq("invite_token", inviteToken)
        .maybeSingle();

      if (invite?.status === "complete" && invite.relationship_report_id) {
        const { data: rr } = await supabase
          .from("relationship_reports")
          .select(
            "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium_by_kind, relationship_kind",
          )
          .eq("id", invite.relationship_report_id)
          .maybeSingle();
        if (rr) {
          const seen = new Set(rows.map((r) => r.id));
          if (!seen.has(rr.id)) rows.push(rr as RelationshipReportRow);
        }
      }

      if (!viewerReportId && invite) {
        viewerReportId =
          String(invite.accepted_report_id ?? "").trim() ||
          String(invite.from_report_id ?? "").trim();
      }
    }

    if (viewerReportId) {
      const access = await assertOwnedReportAccess(
        supabase,
        viewerReportId,
        userId,
      );
      if (access.error) return access.error;

      const text = await resolveIntegratedRelationshipText(viewerReportId);
      if (text) {
        return NextResponse.json({ relationship: text });
      }
    }

    return NextResponse.json({ relationship: null });
  } catch (err) {
    console.error(LOG, "예외:", err);
    return NextResponse.json(
      { error: "관계 분석 조회 실패" },
      { status: 500 },
    );
  }
}
