import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isPremiumPaywallEnabled } from "@/lib/product/premiumAccessPolicy";
import { updateRelationshipReportSafe } from "@/lib/relationship/relationshipReportQuery";

const PAYWALL_MESSAGE =
  "심화 분석은 결제·업그레이드 후에 실행할 수 있습니다.";

/** analysis_type → premium. MVP(페이월 off)에서는 basic도 자동 승격. */
export async function ensureRelationshipPremiumSlot(
  supabase: SupabaseClient,
  relationshipReportId: string,
): Promise<NextResponse | null> {
  const id = relationshipReportId.trim();
  if (!id) {
    return NextResponse.json(
      { error: "relationship_report_id가 필요합니다." },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabase
    .from("relationship_reports")
    .select("analysis_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { error: "관계 분석을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (row.analysis_type === "premium") {
    return null;
  }

  if (isPremiumPaywallEnabled()) {
    return NextResponse.json({ error: PAYWALL_MESSAGE }, { status: 403 });
  }

  const { error: upErr } = await updateRelationshipReportSafe(supabase, id, {
    analysis_type: "premium",
    updated_at: new Date().toISOString(),
  });

  if (upErr) {
    return NextResponse.json(
      { error: "심화 분석 준비에 실패했습니다." },
      { status: 503 },
    );
  }

  return null;
}
