import { auth, currentUser } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentSelfProfileForReport } from "@/lib/relationship/surveyPatterns";
import { runRomanticSajuDeepAnalysis } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { runWorkColleagueDeepAnalysis } from "@/lib/prompts/relationshipPremium/workColleague";
import { runCohabitationDeepAnalysis } from "@/lib/prompts/relationshipPremium/cohabitation";
import { runFamilyParentChildDeepAnalysis } from "@/lib/prompts/relationshipPremium/familyParentChild";
import { runFriendSocialDeepAnalysis } from "@/lib/prompts/relationshipPremium/friendSocial";
import { resolveFamilyRolesFromViewer } from "@/lib/relationship/familyParent/resolveFamilyRoles";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  getPremiumPayloadForKindLocale,
  hasPremiumCacheForKindLocale,
  parseRelationshipKind,
  type ResultPremiumByKind,
} from "@/lib/relationship/relationshipKind";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { toLegacyShortLocale } from "@/lib/i18n/llmLocale";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import { stripFamilyContextOutputForClient } from "@/lib/relationship/familyParent/stripFamilyContextOutputForClient";
import { stripWorkContextOutputForClient } from "@/lib/relationship/workColleague/stripWorkContextOutputForClient";
import { stripFriendContextOutputForClient } from "@/lib/relationship/friend/stripFriendContextOutputForClient";
import { stripMarriageContextOutputForClient } from "@/lib/relationship/marriage/stripMarriageContextOutputForClient";
import { stripRomanticContextInputForClient } from "@/lib/relationship/romantic/stripRomanticContextInputForClient";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial";
import { relationshipKindUsesDeepPipeline } from "@/lib/relationship/relationshipAnalysisKinds";
import {
  fetchRelationshipReportByIdSafe,
  mergeRelationshipPremiumByKind,
} from "@/lib/relationship/relationshipReportQuery";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import {
  UNKNOWN_BIRTH_FALLBACK,
} from "@/lib/v2/onboarding/birthFallbackPolicy";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";
import {
  getOrBuildPersonCorePair,
  bundlePersonCorePairForPremium,
  personCoreRelationParamsFromBundles,
  PersonCoreError,
} from "@/lib/personCore";
import type {
  RomanticSajuDeepLocale,
  RomanticSajuDeepRunParams,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import {
  assertRelationshipPremiumLlmAccess,
  getRelationshipPremiumAnalysisFailedMessage,
  getRelationshipPremiumSaveFailedMessage,
} from "@/lib/relationship/relationshipPremiumGuard";
import { ensureRelationshipPremiumSlot } from "@/lib/relationship/ensureRelationshipPremiumSlot";
import { persistRomanticPremiumResult } from "@/lib/relationship/persistRomanticPremiumResult";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  enforceRateLimit,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function loadPersonCorePairForPremium(
  reportIdA: string,
  reportIdB: string,
  options?: { force?: boolean },
) {
  try {
    const pair = await getOrBuildPersonCorePair(reportIdA, reportIdB, options);
    const bundles = bundlePersonCorePairForPremium(pair);
    const personCore = personCoreRelationParamsFromBundles(bundles);
    return { bundles, personCore };
  } catch (err) {
    if (err instanceof PersonCoreError) {
      return { error: err.message as string };
    }
    throw err;
  }
}

function parsePremiumLocale(
  bodyLanguage: unknown,
  headerLanguage: string | null,
): Locale {
  return resolveRequestLocale({
    bodyLanguage,
    headerLanguage,
  });
}

function chartBirthTime(report: {
  birth_date: string | null;
  birth_time: string | null;
}): string {
  return resolveBirthTimeForCharts({
    birthTime: report.birth_time,
    birthTimeUnknown: !report.birth_time?.trim(),
  }).chartTime;
}

function chartBirthPlace(place: unknown): string {
  const trimmed = typeof place === "string" ? place.trim() : "";
  return trimmed || UNKNOWN_BIRTH_FALLBACK.place;
}

function reportBirthDate(report: Record<string, unknown>): string {
  return typeof report.birth_date === "string" ? report.birth_date : "";
}

function reportBirthTime(report: Record<string, unknown>): string | null {
  return typeof report.birth_time === "string" ? report.birth_time : null;
}

function reportName(report: Record<string, unknown>): string | null {
  return typeof report.name === "string" ? report.name : null;
}

export async function POST(req: Request) {
  let locale: Locale = DEFAULT_LOCALE;
  try {
    locale = resolveRequestLocale({
      bodyLanguage: null,
      headerLanguage:
        req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: getMessages(locale).errors.unauthorized },
        { status: 401 },
      );
    }

    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";
    const viewerReportId =
      typeof body.viewer_report_id === "string"
        ? body.viewer_report_id.trim()
        : "";

    locale = parsePremiumLocale(
      (body as { language?: unknown }).language ??
        (body as { locale?: unknown }).locale,
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    );

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: getMessages(locale).errors.relationshipIdsRequired },
        { status: 400 },
      );
    }

    const limited = enforceRateLimit("relationship_premium", userId);
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

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { row: rr, error: rrErr } = await fetchRelationshipReportByIdSafe(
      supabase,
      relationshipReportId,
    );

    if (rrErr || !rr) {
      return NextResponse.json(
        { error: getMessages(locale).errors.notFound },
        { status: 404 },
      );
    }

    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );
    if (accessGuard) return accessGuard;

    const slotGuard = await ensureRelationshipPremiumSlot(
      supabase,
      relationshipReportId,
    );
    if (slotGuard) return slotGuard;

    const byKind = (rr.result_premium_by_kind ?? {}) as ResultPremiumByKind;
    const kind = parseRelationshipKind(
      (body as { relationship_kind?: unknown }).relationship_kind,
      parseRelationshipKind(rr.relationship_kind),
    );
    const forceRegenerate =
      (body as { force_regenerate?: unknown }).force_regenerate === true;
    const language = toLegacyShortLocale(locale) as RomanticSajuDeepLocale;

    if (!forceRegenerate && hasPremiumCacheForKindLocale(byKind, kind, locale)) {
      const cached = getPremiumPayloadForKindLocale(byKind, kind, locale);
      const forClient =
        kind === "family"
          ? stripFamilyContextOutputForClient(
              cached as { report?: Record<string, unknown> },
            )
          : kind === "work"
            ? stripWorkContextOutputForClient(
                cached as { report?: Record<string, unknown> },
              )
            : kind === "friendship"
              ? stripFriendContextOutputForClient(
                  cached as { report?: Record<string, unknown> },
                )
              : kind === "cohabitation"
                ? stripMarriageContextOutputForClient(
                    cached as { report?: Record<string, unknown> },
                  )
                : kind === "romantic"
                  ? stripRomanticContextInputForClient(
                      cached as { report?: Record<string, unknown> },
                    )
                  : cached;
      return NextResponse.json({
        relationship_kind: kind,
        locale,
        result_premium: forClient,
      });
    }

    const [fetchA, fetchB, clerkUser] = await Promise.all([
      fetchReportWithBirthCoords(supabase, rr.report_id_a),
      fetchReportWithBirthCoords(supabase, rr.report_id_b),
      userId ? currentUser() : Promise.resolve(null),
    ]);

    const repA = fetchA.report;
    const repB = fetchB.report;

    if (fetchA.error || fetchB.error || !repA || !repB) {
      return NextResponse.json(
        { error: getMessages(locale).errors.relationshipDataMissing },
        { status: 400 },
      );
    }

    const birthOkDeep = (r: typeof repA) =>
      typeof r.birth_date === "string" && r.birth_date.trim().length > 0;

    if (!relationshipKindUsesDeepPipeline(kind)) {
      return NextResponse.json(
        { error: `지원하지 않는 관계 유형: ${kind}` },
        { status: 400 },
      );
    }

    if (!birthOkDeep(repA) || !birthOkDeep(repB)) {
      return NextResponse.json(
        {
          error:
            kind === "romantic"
              ? "양쪽 모두 생년월일이 있어야 연인 심화 분석이 가능합니다."
              : kind === "cohabitation"
                ? "양쪽 모두 생년월일이 있어야 동거·결혼 심화 분석이 가능합니다."
                : kind === "family"
                  ? "양쪽 모두 생년월일이 있어야 가족 Child DNA 분석이 가능합니다."
                  : kind === "friendship"
                    ? "양쪽 모두 생년월일이 있어야 친구 Social DNA 분석이 가능합니다."
                    : "양쪽 모두 생년월일이 있어야 동료 심화 분석이 가능합니다.",
        },
        { status: 400 },
      );
    }

    const labelA = resolveViewerDisplayName({
      reportName: reportName(repA),
      clerkFirstName:
        viewerReportId === rr.report_id_a ? clerkUser?.firstName : undefined,
      clerkFullName:
        viewerReportId === rr.report_id_a ? clerkUser?.fullName : undefined,
      fallback: "나",
    });
    const labelB = resolveViewerDisplayName({
      reportName: reportName(repB),
      clerkFirstName:
        viewerReportId === rr.report_id_b ? clerkUser?.firstName : undefined,
      clerkFullName:
        viewerReportId === rr.report_id_b ? clerkUser?.fullName : undefined,
      fallback: "상대",
    });
    const userCustomMyName =
      viewerReportId === rr.report_id_a ? labelA : labelB;
    const userCustomTargetName =
      viewerReportId === rr.report_id_a ? labelB : labelA;

    const llmAccessGuard = await assertRelationshipPremiumLlmAccess(
      supabase,
      relationshipReportId,
    );
    if (llmAccessGuard) return llmAccessGuard;

    if (kind === "romantic") {
      const [personCoreLoad, surveyProfileA, surveyProfileB] = await Promise.all([
        loadPersonCorePairForPremium(rr.report_id_a, rr.report_id_b, {
          force: forceRegenerate,
        }),
        getCurrentSelfProfileForReport(supabase, rr.report_id_a),
        getCurrentSelfProfileForReport(supabase, rr.report_id_b),
      ]);
      if ("error" in personCoreLoad) {
        return NextResponse.json(
          { error: personCoreLoad.error ?? getMessages(locale).errors.personCoreLoadFailed },
          { status: 400 },
        );
      }
      const { bundles } = personCoreLoad;

      const romanticAnalysisParams: RomanticSajuDeepRunParams = {
        nicknameA: labelA,
        nicknameB: labelB,
        userCustomMyName,
        userCustomTargetName,
        birthA: {
          date: reportBirthDate(repA),
          time: chartBirthTime({
            birth_date: reportBirthDate(repA),
            birth_time: reportBirthTime(repA),
          }),
          place: chartBirthPlace(repA.birth_place),
        },
        birthB: {
          date: reportBirthDate(repB),
          time: chartBirthTime({
            birth_date: reportBirthDate(repB),
            birth_time: reportBirthTime(repB),
          }),
          place: chartBirthPlace(repB.birth_place),
        },
        sajuJsonA: bundles.a.sajuJson,
        sajuJsonB: bundles.b.sajuJson,
        sajuProvenanceA: bundles.a.provenance,
        sajuProvenanceB: bundles.b.provenance,
        sajuMasterA: bundles.a.blueprint.saju_master_json,
        sajuMasterB: bundles.b.blueprint.saju_master_json,
        surveyProfileA,
        surveyProfileB,
        locale: language,
      };

      const romanticPayload = await runRomanticSajuDeepAnalysis(
        openai,
        romanticAnalysisParams,
        { abortSignal: req.signal },
      );

      const persist = await persistRomanticPremiumResult(supabase, {
        relationshipReportId,
        viewerReportId,
        romanticPayload,
        locale,
      });

      if (!persist.ok) {
        return NextResponse.json({ error: persist.userMessage }, { status: 500 });
      }

      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 romanticPayload(romantic_context_input 포함) 유지.
        result_premium: stripRomanticContextInputForClient(romanticPayload),
      });
    }

    if (kind === "work") {
      const personCoreLoad = await loadPersonCorePairForPremium(
        rr.report_id_a,
        rr.report_id_b,
        { force: forceRegenerate },
      );
      if ("error" in personCoreLoad) {
        return NextResponse.json(
          { error: personCoreLoad.error ?? getMessages(locale).errors.personCoreLoadFailed },
          { status: 400 },
        );
      }
      const { bundles, personCore } = personCoreLoad;

      const workPayload = await runWorkColleagueDeepAnalysis(openai, {
        nicknameA: labelA,
        nicknameB: labelB,
        birthA: {
          date: reportBirthDate(repA),
          time: chartBirthTime({
            birth_date: reportBirthDate(repA),
            birth_time: reportBirthTime(repA),
          }),
          place: chartBirthPlace(repA.birth_place),
        },
        birthB: {
          date: reportBirthDate(repB),
          time: chartBirthTime({
            birth_date: reportBirthDate(repB),
            birth_time: reportBirthTime(repB),
          }),
          place: chartBirthPlace(repB.birth_place),
        },
        sajuJsonA: bundles.a.sajuJson,
        sajuJsonB: bundles.b.sajuJson,
        sajuProvenanceA: bundles.a.provenance,
        sajuProvenanceB: bundles.b.provenance,
        psychMasterA: personCore.psychMasterA,
        psychMasterB: personCore.psychMasterB,
        personCoreMeta: personCore.personCoreMeta,
        sajuMasterA: bundles.a.blueprint.saju_master_json,
        sajuMasterB: bundles.b.blueprint.saju_master_json,
        locale,
      });

      const workWithLocale = {
        ...workPayload,
        report: {
          ...workPayload.report,
          meta: {
            ...(workPayload.report?.meta ?? {}),
            locale,
            language: toLegacyShortLocale(locale),
          },
        },
      };
      const { error: upErr } = await mergeRelationshipPremiumByKind(
        supabase,
        relationshipReportId,
        "work",
        workWithLocale,
        { relationshipKind: kind, locale },
      );

      if (upErr) {
        logServerError("relationship/analyze/premium work update:", upErr, "internal_error");
        return NextResponse.json(
          { error: getRelationshipPremiumSaveFailedMessage(locale) },
          { status: 500 },
        );
      }

      if (viewerReportId) {
        await insertRelationshipAnalysisLog(supabase, {
          relationshipReportId,
          viewerReportId,
          relationshipKind: kind,
          analysisLevel: "premium",
          resultFormat: WORK_COLLEAGUE_DEEP_FORMAT,
          payload: workWithLocale,
        });
      }

      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 workWithLocale(context_output 포함) 유지.
        // 클라이언트에는 내부 분류·signals 노출 방지를 위해 사본에서만 제거.
        result_premium: stripWorkContextOutputForClient(workWithLocale),
      });
    }

    if (kind === "cohabitation") {
      const personCoreLoad = await loadPersonCorePairForPremium(
        rr.report_id_a,
        rr.report_id_b,
        { force: forceRegenerate },
      );
      if ("error" in personCoreLoad) {
        return NextResponse.json(
          { error: personCoreLoad.error ?? getMessages(locale).errors.personCoreLoadFailed },
          { status: 400 },
        );
      }
      const { bundles, personCore } = personCoreLoad;

      const cohabitationPayload = await runCohabitationDeepAnalysis(openai, {
        nicknameA: labelA,
        nicknameB: labelB,
        birthA: {
          date: reportBirthDate(repA),
          time: chartBirthTime({
            birth_date: reportBirthDate(repA),
            birth_time: reportBirthTime(repA),
          }),
          place: chartBirthPlace(repA.birth_place),
        },
        birthB: {
          date: reportBirthDate(repB),
          time: chartBirthTime({
            birth_date: reportBirthDate(repB),
            birth_time: reportBirthTime(repB),
          }),
          place: chartBirthPlace(repB.birth_place),
        },
        sajuJsonA: bundles.a.sajuJson,
        sajuJsonB: bundles.b.sajuJson,
        sajuProvenanceA: bundles.a.provenance,
        sajuProvenanceB: bundles.b.provenance,
        psychMasterA: personCore.psychMasterA,
        psychMasterB: personCore.psychMasterB,
        personCoreMeta: personCore.personCoreMeta,
        sajuMasterA: bundles.a.blueprint.saju_master_json,
        sajuMasterB: bundles.b.blueprint.saju_master_json,
        locale,
      });

      const cohabitationWithLocale = {
        ...cohabitationPayload,
        report: {
          ...cohabitationPayload.report,
          meta: {
            ...(cohabitationPayload.report?.meta ?? {}),
            locale,
            language: toLegacyShortLocale(locale),
          },
        },
      };

      const { error: upErr } = await mergeRelationshipPremiumByKind(
        supabase,
        relationshipReportId,
        "cohabitation",
        cohabitationWithLocale,
        { relationshipKind: kind, locale },
      );

      if (upErr) {
        logServerError("relationship/analyze/premium cohabitation update:", upErr, "internal_error");
        return NextResponse.json(
          { error: getRelationshipPremiumSaveFailedMessage(locale) },
          { status: 500 },
        );
      }

      if (viewerReportId) {
        await insertRelationshipAnalysisLog(supabase, {
          relationshipReportId,
          viewerReportId,
          relationshipKind: kind,
          analysisLevel: "premium",
          resultFormat: COHABITATION_DEEP_FORMAT,
          payload: cohabitationWithLocale,
        });
      }

      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 cohabitationWithLocale(context_output 포함) 유지.
        // 클라이언트에는 내부 분류·signals 노출 방지를 위해 사본에서만 제거.
        result_premium: stripMarriageContextOutputForClient(cohabitationWithLocale),
      });
    }

    if (kind === "family") {
      const personCoreLoad = await loadPersonCorePairForPremium(
        rr.report_id_a,
        rr.report_id_b,
        { force: forceRegenerate },
      );
      if ("error" in personCoreLoad) {
        return NextResponse.json(
          { error: personCoreLoad.error ?? getMessages(locale).errors.personCoreLoadFailed },
          { status: 400 },
        );
      }
      const { bundles, personCore } = personCoreLoad;

      const bodyFamily = body as {
        parent_type?: unknown;
        child_is_viewer?: unknown;
      };
      const parentTypeRaw = bodyFamily.parent_type;
      const parentType: FamilyParentRole =
        parentTypeRaw === "father" ? "father" : "mother";
      const childIsViewer = bodyFamily.child_is_viewer === true;

      const roles = resolveFamilyRolesFromViewer({
        viewerReportId: viewerReportId || rr.report_id_a,
        reportIdA: rr.report_id_a,
        reportIdB: rr.report_id_b,
        parentType,
        childIsViewer,
      });

      const familyPayload = await runFamilyParentChildDeepAnalysis(openai, {
        nicknameA: labelA,
        nicknameB: labelB,
        roles,
        parentType,
        childIsViewer,
        birthA: {
          date: reportBirthDate(repA),
          time: chartBirthTime({
            birth_date: reportBirthDate(repA),
            birth_time: reportBirthTime(repA),
          }),
          place: chartBirthPlace(repA.birth_place),
        },
        birthB: {
          date: reportBirthDate(repB),
          time: chartBirthTime({
            birth_date: reportBirthDate(repB),
            birth_time: reportBirthTime(repB),
          }),
          place: chartBirthPlace(repB.birth_place),
        },
        sajuJsonA: bundles.a.sajuJson,
        sajuJsonB: bundles.b.sajuJson,
        sajuProvenanceA: bundles.a.provenance,
        sajuProvenanceB: bundles.b.provenance,
        psychMasterA: personCore.psychMasterA,
        psychMasterB: personCore.psychMasterB,
        personCoreMeta: personCore.personCoreMeta,
        sajuMasterA: bundles.a.blueprint.saju_master_json,
        sajuMasterB: bundles.b.blueprint.saju_master_json,
        locale,
      });

      const { error: upErr } = await mergeRelationshipPremiumByKind(
        supabase,
        relationshipReportId,
        "family",
        {
          ...familyPayload,
          report: {
            ...familyPayload.report,
            meta: {
              ...(familyPayload.report?.meta ?? {}),
              locale,
              language: toLegacyShortLocale(locale),
            },
          },
        },
        { relationshipKind: kind, locale },
      );

      if (upErr) {
        logServerError("relationship/analyze/premium family update:", upErr, "internal_error");
        return NextResponse.json(
          { error: getRelationshipPremiumSaveFailedMessage(locale) },
          { status: 500 },
        );
      }

      if (viewerReportId) {
        await insertRelationshipAnalysisLog(supabase, {
          relationshipReportId,
          viewerReportId,
          relationshipKind: kind,
          analysisLevel: "premium",
          resultFormat: FAMILY_PARENT_CHILD_DEEP_FORMAT,
          payload: familyPayload,
        });
      }

      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 familyPayload(context_output 포함) 유지.
        // 클라이언트에는 내부 분류 코드 노출 방지를 위해 사본에서만 제거.
        result_premium: stripFamilyContextOutputForClient(familyPayload),
      });
    }

    if (kind === "friendship") {
      const personCoreLoad = await loadPersonCorePairForPremium(
        rr.report_id_a,
        rr.report_id_b,
        { force: forceRegenerate },
      );
      if ("error" in personCoreLoad) {
        return NextResponse.json(
          { error: personCoreLoad.error ?? getMessages(locale).errors.personCoreLoadFailed },
          { status: 400 },
        );
      }
      const { bundles, personCore } = personCoreLoad;

      const friendshipPayload = await runFriendSocialDeepAnalysis(openai, {
        nicknameA: labelA,
        nicknameB: labelB,
        birthA: {
          date: reportBirthDate(repA),
          time: chartBirthTime({
            birth_date: reportBirthDate(repA),
            birth_time: reportBirthTime(repA),
          }),
          place: chartBirthPlace(repA.birth_place),
        },
        birthB: {
          date: reportBirthDate(repB),
          time: chartBirthTime({
            birth_date: reportBirthDate(repB),
            birth_time: reportBirthTime(repB),
          }),
          place: chartBirthPlace(repB.birth_place),
        },
        sajuJsonA: bundles.a.sajuJson,
        sajuJsonB: bundles.b.sajuJson,
        sajuProvenanceA: bundles.a.provenance,
        sajuProvenanceB: bundles.b.provenance,
        psychMasterA: personCore.psychMasterA,
        psychMasterB: personCore.psychMasterB,
        personCoreMeta: personCore.personCoreMeta,
        sajuMasterA: bundles.a.blueprint.saju_master_json,
        sajuMasterB: bundles.b.blueprint.saju_master_json,
        locale,
      });

      const { error: upErr } = await mergeRelationshipPremiumByKind(
        supabase,
        relationshipReportId,
        "friendship",
        {
          ...friendshipPayload,
          report: {
            ...friendshipPayload.report,
            meta: {
              ...(friendshipPayload.report?.meta ?? {}),
              locale,
              language: toLegacyShortLocale(locale),
            },
          },
        },
        { relationshipKind: kind, locale },
      );

      if (upErr) {
        logServerError("relationship/analyze/premium friendship update:", upErr, "internal_error");
        return NextResponse.json(
          { error: getRelationshipPremiumSaveFailedMessage(locale) },
          { status: 500 },
        );
      }

      if (viewerReportId) {
        await insertRelationshipAnalysisLog(supabase, {
          relationshipReportId,
          viewerReportId,
          relationshipKind: kind,
          analysisLevel: "premium",
          resultFormat: FRIEND_SOCIAL_DEEP_FORMAT,
          payload: friendshipPayload,
        });
      }

      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 friendshipPayload(context_output 포함) 유지.
        result_premium: stripFriendContextOutputForClient(friendshipPayload),
      });
    }

    return NextResponse.json(
      { error: `지원하지 않는 관계 유형: ${kind}` },
      { status: 400 },
    );
  } catch (e) {
    logServerError("relationship/analyze/premium:", e, "internal_error");
    return NextResponse.json(
      { error: getRelationshipPremiumAnalysisFailedMessage(locale) },
      { status: 500 },
    );
  }
}
