import { NextResponse } from "next/server";
import {
  fetchRelationshipReportRowsForHub,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { isRelationshipPremiumComplete } from "@/lib/relationship/isRelationshipPremiumComplete";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { fetchFavoriteRelationshipIds } from "@/lib/relationship/analysisLog";
import { parseRelationshipKind } from "@/lib/relationship/relationshipKind";

export const runtime = "nodejs";

function isBasicComplete(resultBasic: unknown): boolean {
  const basic = resultBasic as { perspectives?: unknown } | null;
  return (
    basic != null &&
    typeof basic === "object" &&
    basic.perspectives != null &&
    typeof basic.perspectives === "object"
  );
}

export type HubRowKind =
  | "outbound_waiting"
  | "relationship_outbound"
  | "relationship_inbound"
  | "relationship_manual"
  | "relationship_other";

/** YYYY-MM-DD */
function dateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const s = String(iso).trim();
  if (s.length >= 10) return s.slice(0, 10);
  return null;
}

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const reportId = sp.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const limitRaw = sp.get("limit");
    const limit =
      limitRaw != null && limitRaw !== ""
        ? Math.min(50, Math.max(1, Number.parseInt(limitRaw, 10) || 3))
        : undefined;
    const formatSimple = sp.get("format") === "simple";
    const scope = sp.get("scope")?.trim() ?? "all";
    const favoritesOnly = sp.get("favoritesOnly") === "true";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    const [favoriteIds, rows, openInvitesResult] = await Promise.all([
      fetchFavoriteRelationshipIds(supabase, reportId),
      fetchRelationshipReportRowsForHub(supabase, reportId),
      supabase
        .from("invites")
        .select("id, invite_token, status, relationship_report_id, created_at")
        .eq("from_report_id", reportId)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ]);

    const { data: openInvites, error: invErr } = openInvitesResult;

    rows.sort((a, b) => b.id.localeCompare(a.id));

    const rrIds = rows.map((r) => r.id);
    const inviteByRrId = new Map<
      string,
      { from_report_id: string; accepted_report_id: string | null }
    >();

    if (rrIds.length > 0) {
      const { data: invRows, error: invBatchErr } = await supabase
        .from("invites")
        .select("relationship_report_id, from_report_id, accepted_report_id")
        .in("relationship_report_id", rrIds);

      if (!invBatchErr && invRows) {
        for (const ir of invRows) {
          const rid = ir.relationship_report_id as string | undefined;
          if (rid)
            inviteByRrId.set(rid, {
              from_report_id: ir.from_report_id as string,
              accepted_report_id: (ir.accepted_report_id as string) ?? null,
            });
        }
      }
    }

    if (invErr) {
      console.error("relationship/list invites:", invErr);
      return NextResponse.json(
        { error: invErr.message },
        { status: 500 },
      );
    }

    const partnerIds = rows.map((r) =>
      r.report_id_a === reportId ? r.report_id_b : r.report_id_a,
    );
    const uniquePartners = [...new Set(partnerIds)];

    const { data: names } =
      uniquePartners.length > 0
        ? await supabase
            .from("reports")
            .select("id, name, report_type")
            .in("id", uniquePartners)
        : { data: [] as { id: string; name: string | null; report_type: string | null }[] };

    const nameById = Object.fromEntries(
      (names ?? []).map((n) => [n.id, n.name?.trim() || "탐사자"]),
    );
    const typeById = Object.fromEntries(
      (names ?? []).map((n) => [n.id, n.report_type ?? ""]),
    );

    const relationships: {
      list_key: string;
      row_kind: HubRowKind;
      pipeline_title: string;
      relationship_report_id: string | null;
      partner_name: string;
      partner_report_id: string | null;
      analysis_type: "basic" | "premium" | null;
      status: "completed" | "pending";
      last_viewed: string | null;
      invite_token: string | null;
      outbound_invite_id: string | null;
      status_hint: string | null;
      is_favorite: boolean;
      relationship_kind: string;
    }[] = [];

    for (const inv of openInvites ?? []) {
      if (inv.relationship_report_id) continue;
      relationships.push({
        list_key: `open-${inv.id}`,
        row_kind: "outbound_waiting",
        pipeline_title: "상대방 정보 요청 전송됨",
        relationship_report_id: null,
        partner_name: "상대방",
        partner_report_id: null,
        analysis_type: null,
        status: "pending",
        last_viewed: dateOnly(inv.created_at),
        invite_token: inv.invite_token ?? null,
        outbound_invite_id: inv.id,
        status_hint: null,
        is_favorite: false,
        relationship_kind: "friendship",
      });
    }

    for (const r of rows) {
      const partnerId =
        r.report_id_a === reportId ? r.report_id_b : r.report_id_a;
      const partnerName = nameById[partnerId] ?? "상대";
      const at = r.analysis_type as string;
      const analysisType: "basic" | "premium" | null =
        at === "premium" || at === "basic" ? at : null;

      const basicDone = isBasicComplete(r.result_basic);
      const premiumDone = isRelationshipPremiumComplete(
        at,
        r.result_premium,
        r.result_premium_by_kind,
        r.relationship_kind,
      );
      const completed = basicDone && (at !== "premium" || premiumDone);

      const inv = inviteByRrId.get(r.id);

      let row_kind: HubRowKind = "relationship_other";
      let pipeline_title = "관계 분석";
      if (typeById[partnerId] === "partner_manual") {
        row_kind = "relationship_manual";
        pipeline_title = `${partnerName}님과의 관계 (직접 입력)`;
      } else if (inv) {
        if (inv.from_report_id === reportId) {
          row_kind = "relationship_outbound";
          pipeline_title = completed
            ? `보낸 초대 · ${partnerName}님과의 관계`
            : `보낸 초대 · ${partnerName}님 (분석 준비 중)`;
        } else if (inv.accepted_report_id === reportId) {
          row_kind = "relationship_inbound";
          pipeline_title = completed
            ? `받은 초대 · ${partnerName}님과의 관계`
            : `받은 초대 · ${partnerName}님 (분석 준비 중)`;
        }
      } else {
        pipeline_title = `${partnerName}님과의 관계`;
      }

      let status_hint: string | null = null;
      if (completed) {
        status_hint = "지금 입장에서 관계 요약을 볼 수 있어요.";
      } else {
        status_hint =
          "기본 관계 분석을 만드는 중이에요. 잠시 후 다시 열어보세요.";
      }

      relationships.push({
        list_key: `rr-${r.id}`,
        row_kind,
        pipeline_title,
        relationship_report_id: r.id,
        partner_name: partnerName,
        partner_report_id: partnerId,
        analysis_type: analysisType,
        status: completed ? "completed" : "pending",
        last_viewed: null,
        invite_token: null,
        outbound_invite_id: null,
        status_hint,
        is_favorite: favoriteIds.has(r.id),
        relationship_kind: parseRelationshipKind(r.relationship_kind),
      });
    }

    if (favoritesOnly) {
      const favOnly = relationships.filter(
        (r) =>
          r.relationship_report_id != null &&
          favoriteIds.has(r.relationship_report_id),
      );
      relationships.length = 0;
      relationships.push(...favOnly);
    }

    const completedRows = relationships.filter(
      (r) => r.relationship_report_id != null && r.status === "completed",
    );
    const completed_total = completedRows.length;

    let out = relationships;
    if (scope === "completed") {
      out = completedRows;
    }
    if (limit != null) {
      out = out.slice(0, limit);
    }

    type SimpleRow = {
      list_key: string;
      partner_name: string;
      status: "completed" | "pending";
      relationship_report_id: string | null;
    };

    const relationshipsOut: typeof relationships | SimpleRow[] = formatSimple
      ? (out as typeof relationships).map((r) => ({
          list_key: r.list_key,
          partner_name: r.partner_name,
          status: r.status,
          relationship_report_id: r.relationship_report_id,
        }))
      : out;

    const waiting_total = relationships.filter(
      (r) => r.row_kind === "outbound_waiting",
    ).length;

    return NextResponse.json({
      relationships: relationshipsOut,
      meta: {
        completed_total,
        waiting_total,
        favorites_total: favoriteIds.size,
      },
    });
  } catch (e) {
    console.error("relationship/list:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}
