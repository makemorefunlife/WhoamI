import { NextResponse } from "next/server";
import { relationshipPremiumPreviewEnabled } from "@/lib/relationship/premiumPreview";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/** 결제·웹훅 이후 관계 심화 분석 슬롯 열기 (analysis_type → premium) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";

    if (!relationshipReportId) {
      return NextResponse.json(
        { error: "relationship_report_id가 필요합니다." },
        { status: 400 },
      );
    }

    const secret =
      typeof body.secret === "string" ? body.secret.trim() : "";
    const expected = process.env.RELATIONSHIP_UPGRADE_SECRET;
    const previewBypass =
      relationshipPremiumPreviewEnabled() && body.preview === true;
    if (expected && secret !== expected && !previewBypass) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    const { data, error } = await supabase
      .from("relationship_reports")
      .update({
        analysis_type: "premium",
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipReportId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, relationship_report_id: data.id });
  } catch (e) {
    console.error("relationship/upgrade:", e);
    return NextResponse.json({ error: "업그레이드 실패" }, { status: 500 });
  }
}
