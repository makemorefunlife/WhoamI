import { auth, currentUser } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import {
  getPremiumPerspectiveForKind,
  getRomanticSajuDeepReport,
  getWorkColleagueDeepReport,
  getCohabitationDeepReport,
  getFamilyParentDeepReport,
  getFriendSocialDeepReport,
  hasPremiumCacheForKind,
  hasPremiumCacheForKindLocale,
  isRelationshipFavorite,
  parseRelationshipKind,
  RELATIONSHIP_KINDS,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
  type ResultPremiumByKind,
} from "@/lib/relationship/relationshipKind";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getResultBasicLocale } from "@/lib/relationship/resultBasicLocale";
import { getViewerPerspectiveSlice } from "@/lib/relationship/normalizeRelationshipPerspectives";
import { fetchRelationshipReportByIdSafe } from "@/lib/relationship/relationshipReportQuery";
import { isBirthPlaceFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";
import { parseRomanticDeepViewModel } from "@/lib/relationship/detail/parseRomanticDeepViewModel";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import { omitWorkContextOutputFromReport } from "@/lib/relationship/workColleague/stripWorkContextOutputForClient";
import { omitFamilyContextOutputFromReport } from "@/lib/relationship/familyParent/stripFamilyContextOutputForClient";
import { omitFriendContextOutputFromReport } from "@/lib/relationship/friend/stripFriendContextOutputForClient";
import { omitMarriageContextOutputFromReport } from "@/lib/relationship/marriage/stripMarriageContextOutputForClient";
import { omitRomanticContextInputFromReport } from "@/lib/relationship/romantic/stripRomanticContextInputForClient";
import { isRomanticV4ReportEnabled } from "@/lib/relationship/romantic/prototypeV4/romanticV4ReportFlag";
import { readRomanticV4Block } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";

export const runtime = "nodejs";

/** 단일 관계 분석 행 + 현재 보는 사람 시점의 perspective 슬라이스 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();

    const kindParam = sp.get("relationshipKind")?.trim();
    const relationshipKind = parseRelationshipKind(kindParam);
    const locale = resolveRequestLocale({
      bodyLanguage: sp.get("language") ?? sp.get("locale"),
      headerLanguage:
        req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

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

    const { userId } = await auth();
    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );
    if (accessGuard) return accessGuard;

    const partnerId =
      rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;

    const [{ data: repA }, { data: repB }] = await Promise.all([
      supabase
        .from("reports")
        .select("name,birth_time,birth_place")
        .eq("id", rr.report_id_a)
        .maybeSingle(),
      supabase
        .from("reports")
        .select("name,birth_time,birth_place")
        .eq("id", rr.report_id_b)
        .maybeSingle(),
    ]);

    const viewer =
      viewerReportId === rr.report_id_a ? repA : repB;
    const partner =
      viewerReportId === rr.report_id_a ? repB : repA;

    const basic = rr.result_basic as {
      perspectives?: Record<string, Record<string, unknown>>;
    } | null;

    const perspectiveBasic = getViewerPerspectiveSlice(
      basic?.perspectives ?? null,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      { partnerReportName: partner?.name },
    );
    const storedKind = parseRelationshipKind(rr.relationship_kind);
    const activeKind = kindParam ? relationshipKind : storedKind;

    const byKind = (rr.result_premium_by_kind ?? {}) as ResultPremiumByKind;

    const perspectivePremium = getPremiumPerspectiveForKind(
      byKind,
      activeKind,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      { partnerReportName: partner?.name },
    );

    const romanticDeepRaw =
      activeKind === "romantic"
        ? getRomanticSajuDeepReport(byKind, locale)
        : null;
    const romanticDeepReport = romanticDeepRaw
      ? parseRomanticDeepViewModel(
          omitRomanticContextInputFromReport(romanticDeepRaw),
        )
      : null;

    // Romantic V4: response-presence is the flag signal for the client (see
    // romanticV4ReportFlag.ts) — the field is only included when the server
    // flag is on AND a persisted V4 block actually exists for this locale.
    const romanticDeepReportV4 =
      activeKind === "romantic" && isRomanticV4ReportEnabled()
        ? readRomanticV4Block(byKind as unknown as Record<string, unknown>, locale)?.payload ?? null
        : null;

    const workColleagueDeepRaw =
      activeKind === "work"
        ? getWorkColleagueDeepReport(byKind, locale)
        : null;
    const workColleagueDeepReport = workColleagueDeepRaw
      ? omitWorkContextOutputFromReport(workColleagueDeepRaw)
      : null;

    const cohabitationDeepRaw =
      activeKind === "cohabitation"
        ? getCohabitationDeepReport(byKind, locale)
        : null;
    const cohabitationDeepReport = cohabitationDeepRaw
      ? omitMarriageContextOutputFromReport(cohabitationDeepRaw)
      : null;

    const familyDeepRaw =
      activeKind === "family"
        ? getFamilyParentDeepReport(byKind, locale)
        : null;
    const familyDeepReport = familyDeepRaw
      ? omitFamilyContextOutputFromReport(familyDeepRaw)
      : null;

    const friendshipDeepRaw =
      activeKind === "friendship"
        ? getFriendSocialDeepReport(byKind, locale)
        : null;
    const friendshipDeepReport = friendshipDeepRaw
      ? omitFriendContextOutputFromReport(friendshipDeepRaw)
      : null;

    const favorited = await isRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
    );

    const clerkUser = userId ? await currentUser() : null;
    const viewerIsReportA = viewerReportId === rr.report_id_a;
    const viewerName = resolveViewerDisplayName({
      reportName: viewer?.name,
      clerkFirstName: clerkUser?.firstName,
      clerkFullName: clerkUser?.fullName,
    });
    const partnerName = resolvePartnerDisplayName(
      partner?.name,
      undefined,
      "친구",
    );
    const personAName = repA?.name?.trim() || "";
    const personBName = repB?.name?.trim() || "";

    const responseBody: Record<string, unknown> = {
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
      romantic_deep_report_v4: romanticDeepReportV4,
      work_colleague_deep_report: workColleagueDeepReport,
      cohabitation_deep_report: cohabitationDeepReport,
      family_deep_report: familyDeepReport,
      friendship_deep_report: friendshipDeepReport,
      /** Same completion rule as analyze cache / hub — kind-scoped by_kind. */
      premium_ready: hasPremiumCacheForKindLocale(
        byKind,
        activeKind,
        locale,
      ),
      premium_kinds_ready: RELATIONSHIP_KINDS.filter((k) =>
        hasPremiumCacheForKind(byKind, k),
      ),
      locale,
      /** Locale the stored result_basic was generated in; null = unknown/legacy row. */
      basic_locale: getResultBasicLocale(rr.result_basic),
      is_favorite: favorited,
    };

    return NextResponse.json(responseBody);
  } catch (e) {
    logServerError("relationship/detail:", e, "internal_error");
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
