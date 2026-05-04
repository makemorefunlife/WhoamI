import { NextResponse } from "next/server";
import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromOutboundInvites,
  mergeRelationshipRowsFromInboundInvites,
  type RelationshipReportRow,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { formatResultBasicForIntegratedContext } from "@/lib/relationship/formatResultBasicForIntegratedContext";
import { hasCompletePerspectives } from "@/lib/relationship/normalizeRelationshipPerspectives";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

const LOG = "[relationship/generate]";

function pickBestRelationshipRow(
  rows: RelationshipReportRow[],
  viewerReportId: string,
): RelationshipReportRow | null {
  if (rows.length === 0) return null;

  if (viewerReportId) {
    const withText = rows.filter(
      (r) =>
        formatResultBasicForIntegratedContext(r.result_basic, viewerReportId) !=
        null,
    );
    if (withText.length > 0) return withText[0]!;
  }

  const complete = rows.find((r) =>
    hasCompletePerspectives(r.result_basic, r.report_id_a, r.report_id_b),
  );
  if (complete) return complete;

  return rows[0] ?? null;
}

function resolveIntegratedRelationshipText(
  row: RelationshipReportRow,
  viewerReportId: string,
): string | null {
  if (viewerReportId) {
    const direct = formatResultBasicForIntegratedContext(
      row.result_basic,
      viewerReportId,
    );
    if (direct) return direct;
  }
  return (
    formatResultBasicForIntegratedContext(
      row.result_basic,
      row.report_id_a,
    ) ||
    formatResultBasicForIntegratedContext(
      row.result_basic,
      row.report_id_b,
    )
  );
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.error(LOG, "400: JSON 파싱 실패 (본문이 비었거나 JSON이 아님)");
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

    console.info(LOG, "요청 키:", {
      hasReportId: Boolean(reportId),
      hasInviteToken: Boolean(inviteToken),
    });

    if (!reportId && !inviteToken) {
      console.error(
        LOG,
        "400: reportId도 inviteToken도 없음. 클라이언트가 잘못된 본문을 보냈을 수 있음.",
      );
      return NextResponse.json(
        { error: "reportId 또는 inviteToken이 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error(LOG, "500: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 없음");
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    let rows: RelationshipReportRow[] = [];
    let inviteRow: {
      status: string;
      from_report_id: string | null;
      accepted_report_id: string | null;
    } | null = null;

    if (reportId) {
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
      console.info(LOG, "reportId 조회 결과", {
        reportId,
        rowCount: rows.length,
        ids: rows.map((r) => r.id),
      });
    }

    if (inviteToken) {
      const { data: invite, error: invErr } = await supabase
        .from("invites")
        .select(
          "id, status, invite_token, relationship_report_id, from_report_id, accepted_report_id",
        )
        .eq("invite_token", inviteToken)
        .maybeSingle();

      if (invErr) {
        console.error(LOG, "초대 조회 오류:", invErr.message, invErr.code);
      }

      if (invite) {
        inviteRow = {
          status: String(invite.status ?? ""),
          from_report_id: (invite.from_report_id as string | null) ?? null,
          accepted_report_id:
            (invite.accepted_report_id as string | null) ?? null,
        };
      }

      console.info(LOG, "inviteToken 조회", {
        found: Boolean(invite),
        status: invite?.status ?? null,
        relationship_report_id: invite?.relationship_report_id ?? null,
      });

      if (!invite) {
        console.warn(LOG, "초대 행 없음 (토큰 불일치 또는 삭제됨)");
      } else if (invite.status !== "complete") {
        console.warn(
          LOG,
          "초대 미완료 상태라 예전엔 400을 냈음. 이제 200 + relationship null.",
          { status: invite.status },
        );
      } else {
        const rrId = invite.relationship_report_id as string | null | undefined;
        if (rrId) {
          const { data: rr, error: rrErr } = await supabase
            .from("relationship_reports")
            .select(
              "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium",
            )
            .eq("id", rrId)
            .maybeSingle();

          if (rrErr) {
            console.error(LOG, "relationship_reports 조회 오류:", rrErr.message);
          } else if (rr) {
            const seen = new Set(rows.map((r) => r.id));
            if (!seen.has(rr.id)) {
              rows.push(rr as RelationshipReportRow);
              console.info(LOG, "초대에 연결된 relationship_reports 행 병합", {
                id: rr.id,
              });
            }
          }
        } else {
          console.warn(
            LOG,
            "초대는 complete인데 relationship_report_id가 비어 있음",
            { inviteId: invite.id },
          );
        }
      }
    }

    let viewerReportId = reportId;
    if (!viewerReportId && inviteRow) {
      viewerReportId =
        inviteRow.accepted_report_id?.trim() ||
        inviteRow.from_report_id?.trim() ||
        "";
    }

    const chosen =
      rows.length > 0
        ? pickBestRelationshipRow(rows, viewerReportId)
        : null;

    if (!chosen) {
      console.info(LOG, "통합용 관계 행 없음", {
        viewerReportId: viewerReportId || "(없음)",
        rowCount: rows.length,
      });
      return NextResponse.json({ relationship: null });
    }

    let text = resolveIntegratedRelationshipText(chosen, viewerReportId);

    if (!text && chosen.id) {
      try {
        const repairUrl = new URL(
          "/api/relationship/analyze/basic",
          new URL(req.url).origin,
        );
        const br = await fetch(repairUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ relationship_report_id: chosen.id }),
        });
        if (br.ok) {
          const { data: rrFresh, error: frErr } = await supabase
            .from("relationship_reports")
            .select(
              "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium",
            )
            .eq("id", chosen.id)
            .maybeSingle();
          if (!frErr && rrFresh) {
            text = resolveIntegratedRelationshipText(
              rrFresh as RelationshipReportRow,
              viewerReportId,
            );
          }
        } else {
          const errBody = await br.text().catch(() => "");
          console.warn(LOG, "기본 분석 보강(analyze/basic) 비정상 응답", {
            status: br.status,
            bodyPreview: errBody.slice(0, 200),
          });
        }
      } catch (e) {
        console.warn(LOG, "기본 분석 보강 호출 예외:", e);
      }
    }

    if (!text) {
      console.info(LOG, "선택한 행에 result_basic 시점 데이터 없음", {
        relationship_report_id: chosen.id,
        report_id_a: chosen.report_id_a,
        report_id_b: chosen.report_id_b,
        viewerReportId: viewerReportId || "(없음)",
        complete: hasCompletePerspectives(
          chosen.result_basic,
          chosen.report_id_a,
          chosen.report_id_b,
        ),
      });
      return NextResponse.json({ relationship: null });
    }

    console.info(LOG, "통합 리포트용 관계 맥락 생성 완료", {
      relationship_report_id: chosen.id,
      charLength: text.length,
    });

    return NextResponse.json({ relationship: text });
  } catch (err) {
    console.error(LOG, "예외:", err);
    return NextResponse.json(
      { error: "관계 분석 조회 실패" },
      { status: 500 },
    );
  }
}
