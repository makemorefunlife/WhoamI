import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getPremiumPerspectiveForKind,
  getRomanticSajuDeepReport,
  getWorkColleagueDeepReport,
  getCohabitationDeepReport,
  getFamilyParentDeepReport,
  getFriendSocialDeepReport,
  isRelationshipFavorite,
  parseRelationshipKind,
  RELATIONSHIP_KINDS,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import { getViewerPerspectiveSlice } from "@/lib/relationship/normalizeRelationshipPerspectives";
import { fetchRelationshipReportByIdSafe } from "@/lib/relationship/relationshipReportQuery";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isBirthPlaceFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";

export const runtime = "nodejs";

/** 단일 관계 분석 행 + 현재 보는 사람 시점의 perspective 슬라이스 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();

    const kindParam = sp.get("relationshipKind")?.trim();
    const relationshipKind = parseRelationshipKind(kindParam);

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
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

    const { row: rr, error } = await fetchRelationshipReportByIdSafe(
      supabase,
      relationshipReportId,
    );

    if (error || !rr) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (
      rr.report_id_a !== viewerReportId &&
      rr.report_id_b !== viewerReportId
    ) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const partnerId =
      rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;

    const [{ data: partner }, { data: viewer }, { data: repA }, { data: repB }] =
      await Promise.all([
      supabase
        .from("reports")
        .select("name,birth_time,birth_place")
        .eq("id", partnerId)
        .maybeSingle(),
      supabase
        .from("reports")
        .select("name,birth_time,birth_place")
        .eq("id", viewerReportId)
        .maybeSingle(),
      supabase.from("reports").select("name").eq("id", rr.report_id_a).maybeSingle(),
      supabase.from("reports").select("name").eq("id", rr.report_id_b).maybeSingle(),
    ]);

    const basic = rr.result_basic as {
      perspectives?: Record<string, Record<string, unknown>>;
    } | null;

    const perspectiveBasic = getViewerPerspectiveSlice(
      basic?.perspectives ?? null,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );
    const storedKind = parseRelationshipKind(rr.relationship_kind);
    const activeKind = kindParam ? relationshipKind : storedKind;

    const byKind = (rr.result_premium_by_kind ?? {}) as Record<
      RelationshipKind,
      { perspectives?: Record<string, unknown> } | undefined
    >;

    const perspectivePremium = getPremiumPerspectiveForKind(
      byKind,
      rr.result_premium,
      activeKind,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );

    const romanticDeepReport =
      activeKind === "romantic"
        ? getRomanticSajuDeepReport(byKind, rr.result_premium)
        : null;

    const workColleagueDeepReport =
      activeKind === "work"
        ? getWorkColleagueDeepReport(byKind, rr.result_premium)
        : null;

    const cohabitationDeepReport =
      activeKind === "cohabitation"
        ? getCohabitationDeepReport(byKind, rr.result_premium)
        : null;

    const familyDeepReport =
      activeKind === "family"
        ? getFamilyParentDeepReport(byKind, rr.result_premium)
        : null;

    const friendshipDeepReport =
      activeKind === "friendship"
        ? getFriendSocialDeepReport(byKind, rr.result_premium)
        : null;

    const favorited = await isRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
    );

    const { userId } = await auth();
    const clerkUser = userId ? await currentUser() : null;
    const viewerIsReportA = viewerReportId === rr.report_id_a;
    const personAName = repA?.name?.trim() || "나";
    const personBName = repB?.name?.trim() || "상대";
    const viewerName = resolveViewerDisplayName({
      reportName: viewer?.name,
      clerkFirstName: clerkUser?.firstName,
      clerkFullName: clerkUser?.fullName,
    });
    const partnerName = partner?.name?.trim() || "상대";

    return NextResponse.json({
      relationship_report_id: rr.id,
      report_id_a: rr.report_id_a,
      report_id_b: rr.report_id_b,
      viewer_is_report_a: viewerIsReportA,
      analysis_type: rr.analysis_type,
      relationship_kind: activeKind,
      relationship_kinds: RELATIONSHIP_KINDS,
      relationship_kind_labels: RELATIONSHIP_KIND_LABELS,
      viewer_report_id: viewerReportId,
      partner_report_id: partnerId,
      viewer_name: viewerName,
      partner_name: partnerName,
      my_name: viewerName,
      display_partner_name: partnerName,
      viewer_birth_time_unknown: !viewer?.birth_time?.trim(),
      partner_birth_time_unknown: !partner?.birth_time?.trim(),
      viewer_birth_place_unknown: isBirthPlaceFallback(viewer?.birth_place),
      partner_birth_place_unknown: isBirthPlaceFallback(partner?.birth_place),
      person_a_name: personAName,
      person_b_name: personBName,
      perspective_basic: perspectiveBasic,
      perspective_premium: perspectivePremium,
      romantic_deep_report: romanticDeepReport,
      work_colleague_deep_report: workColleagueDeepReport,
      cohabitation_deep_report: cohabitationDeepReport,
      family_deep_report: familyDeepReport,
      friendship_deep_report: friendshipDeepReport,
      is_favorite: favorited,
      raw_basic: rr.result_basic,
      raw_premium: rr.result_premium,
      raw_premium_by_kind: rr.result_premium_by_kind,
    });
  } catch (e) {
    console.error("relationship/detail:", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
