import { currentUser } from "@clerk/nextjs/server";
import { otherMarketWithCredit } from "@/lib/credits/otherMarket";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { effectiveViewerReportId, withProfileBirth } from "@/lib/account/profileGroup";
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
  type RelationshipKind,
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
  updateRelationshipReportSafe,
} from "@/lib/relationship/relationshipReportQuery";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import {
  UNKNOWN_BIRTH_FALLBACK,
} from "@/lib/v2/onboarding/birthFallbackPolicy";
import { resolveRelationshipPairLabels } from "@/lib/relationship/resolveRelationshipPairLabels";
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
import { isRomanticV4ReportEnabled } from "@/lib/relationship/romantic/prototypeV4/romanticV4ReportFlag";
import { isRomanticV4NarrativeLlmEnabled } from "@/lib/relationship/romantic/prototypeV4/romanticV4NarrativeLlmFlag";
import { buildRomanticV4ProductionInput } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/buildRomanticV4ProductionInput";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { applyRomanticV4FinalNarrativeArchitecture } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/applyRomanticV4FinalNarrativeArchitecture";
import {
  attachRomanticV4Block,
  ROMANTIC_REPORT_SCHEMA_VERSION,
  ROMANTIC_ANALYSIS_ENGINE_VERSION,
  type RomanticV4PersistedBlock,
} from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";
import { applyHourEvidenceCapToComparisonTable } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4HourEvidence";
import {
  getRelationshipPremiumAnalysisFailedMessage,
  getRelationshipPremiumSaveFailedMessage,
} from "@/lib/relationship/relationshipPremiumGuard";
import { persistRomanticPremiumResult } from "@/lib/relationship/persistRomanticPremiumResult";
import { buildInputSnapshot, loadReportInputFacts } from "@/lib/report/inputSnapshot";
import {
  decidePremiumPost,
  loadPremiumAccess,
  saveOwnedRelationshipPremium,
} from "@/lib/relationship/premiumAccess";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  acquireRelationshipPremiumGenerationLock,
  releaseRelationshipPremiumGenerationLock,
  stillOwnsRelationshipPremiumGenerationLock,
} from "@/lib/relationship/relationshipPremiumGenerationLock";
import {
  reserveRelationshipCredit,
  consumeRelationshipCredit,
  releaseRelationshipCredit,
} from "@/lib/credits/creditEngine";
import {
  enforceRateLimit,
  releaseRateLimitSlot,
} from "@/lib/security/rateLimit";


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

function reportClerkUserId(report: Record<string, unknown>): string | null {
  return typeof report.clerk_user_id === "string" ? report.clerk_user_id : null;
}

function reportType(report: Record<string, unknown>): string | null {
  return typeof report.report_type === "string" ? report.report_type : null;
}

/**
 * Who is generating (2026-10-11). A member pays with their own relationship
 * credit; a guest single-Relationship purchase uses its order once
 * (lib/payment/guestRelationship.ts). Everything else -- read-before-
 * generate, per-creator save, locks, engines -- is the same code.
 */
export type PremiumRequester = {
  /** Owner of the saved report: Clerk user id, or "guest_order:<order id>". */
  ownerKey: string;
  rateLimitKey: string;
  assertViewer: (
    supabase: SupabaseClient,
    viewerReportId: string,
    reportIdA: string,
    reportIdB: string,
    locale: Locale,
  ) => Promise<NextResponse | null>;
  loadClerkUser: () => Promise<Awaited<ReturnType<typeof currentUser>> | null>;
  reserve: (
    supabase: SupabaseClient,
    p: {
      relationshipReportId: string;
      kind: RelationshipKind;
      locale: Locale;
      generationLockId: string;
      generationRequestId: string;
    },
  ) => Promise<{ ok: boolean }>;
  consume: (supabase: SupabaseClient, generationRequestId: string) => Promise<void>;
  release: (supabase: SupabaseClient, generationRequestId: string) => Promise<void>;
};

export function memberPremiumRequester(userId: string): PremiumRequester {
  return {
    ownerKey: userId,
    rateLimitKey: userId,
    assertViewer: (supabase, viewerReportId, a, b, locale) =>
      assertOwnedViewerParticipantAccess(supabase, userId, viewerReportId, a, b, locale),
    loadClerkUser: () => currentUser(),
    reserve: (supabase, p) => reserveRelationshipCredit(supabase, { clerkUserId: userId, ...p }),
    consume: (supabase, id) => consumeRelationshipCredit(supabase, id),
    release: (supabase, id) => releaseRelationshipCredit(supabase, id),
  };
}

export async function handleRelationshipPremium(req: Request, requester: PremiumRequester) {
  let locale: Locale = DEFAULT_LOCALE;
  try {
    locale = resolveRequestLocale({
      bodyLanguage: null,
      headerLanguage:
        req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });

    const userId = requester.ownerKey;

    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";
    let viewerReportId =
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

    // The screen passes the account's main report; a relationship that sits
    // on a grouped report of the same account is opened as that report.
    viewerReportId = await effectiveViewerReportId(supabase, viewerReportId, rr.report_id_a, rr.report_id_b);

    const accessGuard = await requester.assertViewer(
      supabase,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      locale,
    );
    if (accessGuard) return accessGuard;

    // Entitlement gate: the credit reservation below (reserveRelationshipCredit)
    // is now the sole real gate on premium generation -- it's already
    // lot-aware and enforces a real balance once CREDIT_ENFORCEMENT is on.
    // (ensureRelationshipPremiumSlot / assertRelationshipPremiumLlmAccess used
    // to gate on relationship_reports.analysis_type via a separate
    // PREMIUM_PAYWALL flag that nothing ever set from a real purchase --
    // see /api/relationship/upgrade, which has zero callers -- so removing
    // both call sites here fixes the "viewable without entitlement" bug
    // without inventing a second, parallel entitlement system. analysis_type
    // is now set to "premium" as a side effect of a successful reservation
    // below, purely so the UI's status badge and this cache-first check
    // above reflect real paid state.)

    const byKind = (rr.result_premium_by_kind ?? {}) as ResultPremiumByKind;
    const kind = parseRelationshipKind(
      (body as { relationship_kind?: unknown }).relationship_kind,
      parseRelationshipKind(rr.relationship_kind),
    );
    const forceRegenerate =
      (body as { force_regenerate?: unknown }).force_regenerate === true;
    const language = toLegacyShortLocale(locale) as RomanticSajuDeepLocale;

    // Read-before-generate against what THIS viewer may read (premiumAccess.ts):
    //   - own report for this kind+language -> returned, no charge;
    //   - otherwise (unless the user explicitly asked to create their own)
    //     an actively shared report of the partner, then the legacy row ->
    //     returned, no charge;
    //   - a partner report that is NOT shared to the viewer is never
    //     returned and never reused: the viewer generates their own.
    // The ONLY ways to start a real (charged) generation when something is
    // readable are an explicit force_regenerate (user-confirmed "새로
    // 분석하기", replaces + archives the viewer's own copy) or create_own.
    const partnerReportId =
      rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;
    const { access: premiumAccess, ok: premiumAccessOk } = await loadPremiumAccess(supabase, {
      relationshipReportId,
      viewerReportId,
      partnerReportId,
      viewerClerkUserId: userId,
      locale,
      legacyByKind: byKind,
      withPayload: true,
    });
    if (!premiumAccessOk) {
      return NextResponse.json(
        { error: getMessages(locale).errors.generic },
        { status: 503 },
      );
    }
    const kindAccess = premiumAccess[kind];
    const createOwn = (body as { create_own?: unknown }).create_own === true;
    const decision = decidePremiumPost(kindAccess, { forceRegenerate, createOwn });
    const existing = "serve" in decision
      ? { source: decision.serve, payload: decision.payload }
      : null;
    if (existing) {
      const cached = existing.payload;
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
        premium_source: existing.source,
        generated: false,
      });
    }
    const saveReason: "first_generation" | "user_regenerate" =
      "generate" in decision ? decision.generate : "first_generation";
    // Which inputs this generation uses (both people, fingerprint only).
    const [factsA, factsB] = await Promise.all([
      loadReportInputFacts(supabase, rr.report_id_a),
      loadReportInputFacts(supabase, rr.report_id_b),
    ]);
    const inputSnapshot = factsA && factsB ? buildInputSnapshot([factsA, factsB]) : null;

    /** Saves the result as the VIEWER's own report (never the legacy row, never the partner's). */
    const saveMine = async (payload: unknown) => {
      const { error } = await saveOwnedRelationshipPremium(supabase, {
        relationshipReportId,
        ownerReportId: viewerReportId,
        ownerClerkUserId: userId,
        kind,
        locale,
        payload,
        reason: saveReason,
        inputSnapshot,
      });
      if (!error) {
        // Unchanged side effect of the old merge: remember the last kind.
        await updateRelationshipReportSafe(supabase, relationshipReportId, {
          relationship_kind: kind,
        });
      }
      return { error };
    };

    const [fetchA, fetchB, clerkUser] = await Promise.all([
      fetchReportWithBirthCoords(supabase, rr.report_id_a, "clerk_user_id, report_type"),
      fetchReportWithBirthCoords(supabase, rr.report_id_b, "clerk_user_id, report_type"),
      requester.loadClerkUser(),
    ]);

    // Grouped self report -> the main report's saved birth details
    // (decision 3: new analyses use the account's current own info).
    const repA = fetchA.report ? await withProfileBirth(supabase, fetchA.report) : null;
    const repB = fetchB.report ? await withProfileBirth(supabase, fetchB.report) : null;

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

    // Canonical names -- identical rule to the report page and the Basic
    // prompt (lib/relationship/relationshipPersonNames.ts): my account
    // nickname for me; my override (manual person) or their own account
    // nickname for them; localized fallback only when neither exists. The
    // prompt receives exactly the names the page shows.
    const toRow = (r: Record<string, unknown>) => ({
      name: reportName(r),
      report_type: reportType(r),
      clerk_user_id: reportClerkUserId(r),
    });
    const { labelA, labelB } = await resolveRelationshipPairLabels({
      viewerReportId,
      reportIdA: rr.report_id_a,
      reportIdB: rr.report_id_b,
      repA: toRow(repA),
      repB: toRow(repB),
      viewerClerkUser: clerkUser,
      locale,
    });
    const userCustomMyName =
      viewerReportId === rr.report_id_a ? labelA : labelB;
    const userCustomTargetName =
      viewerReportId === rr.report_id_a ? labelB : labelA;

    // Fresh per-attempt id — NOT the lock row's own id, which a stale-lock
    // steal reuses for a new owner (see relationshipPremiumGenerationLock.ts).
    // This is the sole idempotency key for the credit reservation below, and
    // the fencing token checked again right before persisting the result.
    const generationRequestId = crypto.randomUUID();

    // Single in-flight slot per (relationship, kind, locale) — acquired
    // once here, before the kind dispatch below, so a duplicate concurrent
    // request (double-click, two tabs, two participants) never reaches
    // OpenAI at all, and never consumes a rate-limit slot for an attempt
    // that was rejected before it started. A different kind or locale for
    // the same relationship acquires its own independent lock.
    const lockAcquire = await acquireRelationshipPremiumGenerationLock(supabase, {
      relationshipReportId,
      kind,
      locale,
      requestedByReportId: viewerReportId,
      generationRequestId,
    });
    if (!lockAcquire.ok) {
      return NextResponse.json(
        {
          error: getMessages(locale).errors.generationInProgress,
          in_progress: lockAcquire.reason === "in_progress",
        },
        { status: lockAcquire.reason === "in_progress" ? 409 : 503 },
      );
    }
    const generationLockId = lockAcquire.lockId;

    // One relationship credit per new-generation attempt (initial generation
    // or an explicit user-confirmed "regenerate"), charged to the Clerk user
    // who actually made this request — never the other participant.
    // Always writes to credit_ledger; only actually touches the real
    // balance / rejects on insufficient funds when credit enforcement is on
    // (see creditEnforcementPolicy.ts) — during beta this always succeeds
    // and simply records what would have been charged.
    const creditReserve = await requester.reserve(supabase, {
      relationshipReportId,
      kind,
      locale,
      generationLockId,
      generationRequestId,
    });
    if (!creditReserve.ok) {
      await releaseRelationshipPremiumGenerationLock(
        supabase,
        generationLockId,
        generationRequestId,
      );
      // Never spends the other site's credit; only says where it can be used.
      const availableOn = await otherMarketWithCredit(supabase, requester.ownerKey, "relationship", locale);
      return NextResponse.json(
        { error: getMessages(locale).errors.insufficientCredit, available_on: availableOn },
        { status: 402 },
      );
    }

    // Credit reservation above just confirmed a real, paid entitlement
    // (once CREDIT_ENFORCEMENT is on) for this relationship report --
    // record that on the row so the UI's premium badge/status reflects
    // reality and a concurrent second request's cache-first check sees it
    // immediately. Best-effort: this must never block a paying user's own
    // generation -- the real entitlement gate is the reservation above,
    // not this status flag.
    if (rr.analysis_type !== "premium") {
      const { error: markPremiumErr } = await updateRelationshipReportSafe(
        supabase,
        relationshipReportId,
        { analysis_type: "premium", updated_at: new Date().toISOString() },
      );
      if (markPremiumErr) {
        logServerError(
          "relationship/analyze/premium mark_premium:",
          markPremiumErr,
          "internal_error",
        );
      }
    }

    // Consumed only once we're actually about to call the model — mirrors
    // analyze/basic/route.ts's "consume only when about to call the model"
    // placement, so validation/ownership/paywall failures above never cost
    // a slot.
    const limited = await enforceRateLimit("relationship_premium", requester.rateLimitKey);
    if (!limited.ok) {
      await requester.release(supabase, generationRequestId);
      await releaseRelationshipPremiumGenerationLock(
        supabase,
        generationLockId,
        generationRequestId,
      );
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

    /**
     * Fencing check — call right after the (possibly long) LLM call
     * completes, before persisting its result. If this lock has since been
     * stolen (this request ran past the stale cutoff), some other request
     * now owns it and this result must be discarded, not saved — the
     * stealer already released this request's credit reservation as part
     * of its own steal (see acquireRelationshipPremiumGenerationLock), so
     * this only needs to stop the write, not clean up credit again.
     */
    async function stillOwnsLock(): Promise<boolean> {
      return stillOwnsRelationshipPremiumGenerationLock(
        supabase!,
        generationLockId,
        generationRequestId,
      );
    }

    let generationSucceeded = false;
    try {

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

      // Romantic V4: additive, best-effort. A failure here must never affect
      // the V1 response above — it's caught and logged, not rethrown, and
      // simply results in no `.v4` block being attached this run.
      if (isRomanticV4ReportEnabled()) {
        try {
          const v4Input = buildRomanticV4ProductionInput({
            personA: {
              reportId: rr.report_id_a,
              name: labelA,
              birthDate: reportBirthDate(repA),
              birthTime: reportBirthTime(repA),
              birthTimeUnknown: !reportBirthTime(repA)?.trim(),
              surveyProfile: surveyProfileA,
              sajuMaster: bundles.a.blueprint.saju_master_json,
            },
            personB: {
              reportId: rr.report_id_b,
              name: labelB,
              birthDate: reportBirthDate(repB),
              birthTime: reportBirthTime(repB),
              birthTimeUnknown: !reportBirthTime(repB)?.trim(),
              surveyProfile: surveyProfileB,
              sajuMaster: bundles.b.blueprint.saju_master_json,
            },
            locale,
          });

          const v4PayloadRaw = buildRomanticV4PrototypePayload("complete", locale, {
            surveyInput: v4Input.surveyInput,
            pairSajuInput: v4Input.pairSajuInput,
            precomputed: v4Input.precomputed,
          });

          // Final Narrative Architecture: additive, best-effort, same
          // failure discipline as the deterministic V4 block above — a
          // failure here (or the flag being off) leaves v4PayloadRaw's
          // fully deterministic canonicalReport.sections untouched.
          // Exactly 2 LLM calls when it runs: Narrative Editor + Expert
          // Saju Discovery. See romanticFinalNarrativeArchitecture.ts.
          const v4PayloadNarrated = isRomanticV4NarrativeLlmEnabled()
            ? await applyRomanticV4FinalNarrativeArchitecture(v4PayloadRaw, {
                openai,
                locale,
                pairSajuInput: v4Input.pairSajuInput,
                surveyInput: v4Input.surveyInput,
                precomputed: v4Input.precomputed,
                abortSignal: req.signal,
              })
            : v4PayloadRaw;

          const v4Payload = applyHourEvidenceCapToComparisonTable(
            v4PayloadNarrated,
            v4Input.birthHourEvidence,
          );

          const v4Block: RomanticV4PersistedBlock = {
            schemaVersion: "romantic_canonical_report_v1",
            reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION,
            analysisEngineVersion: ROMANTIC_ANALYSIS_ENGINE_VERSION,
            payload: v4Payload,
            birthHourDisclosure: v4Input.birthHourEvidence.disclosureCode,
            generatedAt: new Date().toISOString(),
          };
          attachRomanticV4Block(romanticPayload, v4Block);
        } catch (err) {
          logServerError("romantic_v4_production_compute_failed", err);
          // Structured diagnostic context so an operator can tell which
          // reports are silently falling back to V2/legacy without needing
          // to reproduce the failure — no v4 block gets attached below
          // (romanticPayload persists unchanged), so this is purely
          // observability, not a control-flow change.
          logServerEvent("romantic_v4_production_compute_failed", "v4_unavailable_this_generation", {
            relationshipReportId,
            locale,
            narrativeLlmEnabled: isRomanticV4NarrativeLlmEnabled(),
            errorName: err instanceof Error ? err.name : typeof err,
          });
        }
      }

      if (!(await stillOwnsLock())) {
        return NextResponse.json(
          { error: getMessages(locale).errors.generationInProgress },
          { status: 409 },
        );
      }

      const persist = await persistRomanticPremiumResult(supabase, {
        relationshipReportId,
        viewerReportId,
        ownerClerkUserId: userId,
        romanticPayload,
        locale,
        reason: saveReason,
        inputSnapshot,
      });

      if (!persist.ok) {
        return NextResponse.json({ error: persist.userMessage }, { status: 500 });
      }

      await requester.consume(supabase, generationRequestId);
      generationSucceeded = true;
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
      if (!(await stillOwnsLock())) {
        return NextResponse.json(
          { error: getMessages(locale).errors.generationInProgress },
          { status: 409 },
        );
      }

      const { error: upErr } = await saveMine(workWithLocale);

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

      await requester.consume(supabase, generationRequestId);
      generationSucceeded = true;
      return NextResponse.json({
        relationship_kind: kind,
        locale,
        // DB·분석 로그는 workWithLocale(context_output 포함) 유지.
        // 클라이언트에는 내부 분류·signals 노출 방지를 위해 사본에서만 제거.
        result_premium: stripWorkContextOutputForClient(workWithLocale),
      });
    }

    // Product domain "Marriage" — persisted/API kind is "cohabitation"
    // (see MARRIAGE_PRODUCT_KIND in lib/relationship/relationshipKind.ts).
    // There is no kind === "marriage" anywhere; do not add one without a
    // deliberate migration decision.
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

      if (!(await stillOwnsLock())) {
        return NextResponse.json(
          { error: getMessages(locale).errors.generationInProgress },
          { status: 409 },
        );
      }

      const { error: upErr } = await saveMine(cohabitationWithLocale);

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

      await requester.consume(supabase, generationRequestId);
      generationSucceeded = true;
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

      if (!(await stillOwnsLock())) {
        return NextResponse.json(
          { error: getMessages(locale).errors.generationInProgress },
          { status: 409 },
        );
      }

      const { error: upErr } = await saveMine({
          ...familyPayload,
          report: {
            ...familyPayload.report,
            meta: {
              ...(familyPayload.report?.meta ?? {}),
              locale,
              language: toLegacyShortLocale(locale),
            },
          },
        });

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

      await requester.consume(supabase, generationRequestId);
      generationSucceeded = true;
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

      if (!(await stillOwnsLock())) {
        return NextResponse.json(
          { error: getMessages(locale).errors.generationInProgress },
          { status: 409 },
        );
      }

      const { error: upErr } = await saveMine({
          ...friendshipPayload,
          report: {
            ...friendshipPayload.report,
            meta: {
              ...(friendshipPayload.report?.meta ?? {}),
              locale,
              language: toLegacyShortLocale(locale),
            },
          },
        });

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

      await requester.consume(supabase, generationRequestId);
      generationSucceeded = true;
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
    } finally {
      // Refund the rate-limit slot and the credit reservation for any exit
      // that isn't a genuine success (thrown exception, an explicit failure
      // return above, or this request having lost the lock to a steal —
      // stillOwnsLock() already returned false in that case, so
      // generationSucceeded stays false and this correctly releases too;
      // it's a safe no-op if the stealer's own acquire already released it).
      // Mirrors analyze/basic/route.ts's refund-on-failure discipline.
      // Lock release always runs, success or failure, and only actually
      // deletes the row if we still own it (id + current_request_id both
      // match) — never removes a newer owner's lock.
      if (!generationSucceeded) {
        await requester.release(supabase, generationRequestId);
        await releaseRateLimitSlot("relationship_premium", requester.rateLimitKey);
      }
      await releaseRelationshipPremiumGenerationLock(
        supabase,
        generationLockId,
        generationRequestId,
      );
    }
  } catch (e) {
    logServerError("relationship/analyze/premium:", e, "internal_error");
    return NextResponse.json(
      { error: getRelationshipPremiumAnalysisFailedMessage(locale) },
      { status: 500 },
    );
  }
}
