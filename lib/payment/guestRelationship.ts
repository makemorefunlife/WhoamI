import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import type { Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { isGuestUseOrderRow, isGuestRelationshipPlan } from "@/lib/payment/tossCatalog";
import { maskEmail } from "@/lib/payment/guestCheckout";
import { rpcText } from "@/lib/payment/guestAccess";
import { logServerError } from "@/lib/security/safeLog";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import type { PremiumRequester } from "@/lib/relationship/premiumGenerationHandler";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { stripFamilyContextOutputForClient } from "@/lib/relationship/familyParent/stripFamilyContextOutputForClient";
import { stripWorkContextOutputForClient } from "@/lib/relationship/workColleague/stripWorkContextOutputForClient";
import { stripFriendContextOutputForClient } from "@/lib/relationship/friend/stripFriendContextOutputForClient";
import { stripMarriageContextOutputForClient } from "@/lib/relationship/marriage/stripMarriageContextOutputForClient";
import { stripRomanticContextInputForClient } from "@/lib/relationship/romantic/stripRomanticContextInputForClient";
import {
  insertReportPatchSafely,
  mergeBirthCoordinateFields,
  updateReportPatchSafely,
} from "@/lib/report/applyBirthCoordinatePatch";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { mergePremiumKindLocale } from "@/lib/relationship/premiumByKind";
import { isRomanticV4ReportEnabled } from "@/lib/relationship/romantic/prototypeV4/romanticV4ReportFlag";
import { resolveRomanticV4ForResponse } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";

/**
 * Guest (no-account) use of a single Relationship purchase (2026-10-11,
 * migration 20261011140000). Reuses the guest Personal pieces: purchase
 * verification + guest access session (the order id always comes from the
 * verified session, never from the request), the order's single-use
 * reserve / used columns, and save-to-account by verified purchase email.
 *
 * Flow: verify purchase -> my info + the other person's info (with the
 * notice / consent for entering someone else's info) -> explicit generate ->
 * result. Both people are stored as reports rows (report_type
 * 'guest_purchase', owner key "guest_order:<order id>") so the SAME
 * relationship engine and per-creator report table are used unchanged.
 *
 * Period: generating, re-viewing and temporary storage end 12 months after
 * the purchase (approved_at). Guests cannot create invite links.
 */

export const GUEST_RELATIONSHIP_KINDS: RelationshipKind[] = ["romantic", "cohabitation", "friendship", "work", "family"];
export const PARTNER_CONSENT_VERSION = "2026-10-11";

export function guestOrderOwnerKey(orderId: string): string {
  return `guest_order:${orderId}`;
}

type OrderRow = {
  order_id: string;
  plan_id: string;
  status: string;
  guest_email: string | null;
  clerk_user_id: string | null;
  approved_at: string | null;
  locale: string | null;
  guest_use_status: string | null;
  guest_use_enabled?: boolean | null;
  is_test?: boolean | null;
};

type GuestRelOrderRow = {
  order_id: string;
  locale: string;
  self_report_id: string | null;
  partner_report_id: string | null;
  relationship_report_id: string | null;
  kind: string | null;
  partner_consent: Record<string, unknown> | null;
  family_options: { parent_type?: string; child_is_viewer?: boolean } | null;
  expires_at: string;
  generated_at: string | null;
  migrated_at: string | null;
  purged_at: string | null;
};

type PersonInput = {
  name: string | null;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown: boolean;
};

export type GuestRelationshipState = {
  status: "needs_input" | "ready" | "generating" | "generated" | "saved" | "expired" | "linked" | "not_available";
  product: "relationship";
  isTest: boolean;
  planId: string;
  locale: Locale;
  surveyRequired: boolean;
  /** Purchase + 12 months: generating, re-viewing and storage all end here. */
  expiresAt: string | null;
  input: {
    me: PersonInput & { hasSurvey: boolean };
    partner: PersonInput;
    kind: RelationshipKind | null;
    familyOptions: { parentType: "mother" | "father"; childIsViewer: boolean } | null;
    consented: boolean;
  } | null;
  result: {
    kind: RelationshipKind;
    payload: unknown;
    generatedAt: string | null;
    /** Romantic only: same v4 view the member page gets (when switched on). */
    romanticV4: unknown;
    romanticV4Enabled: boolean;
    /** Whether "me" is side A of the stored pair (names in the report follow A/B). */
    viewerIsReportA: boolean;
  } | null;
  savedRelationshipId: string | null;
  /** After saving: the account profile the relationship now belongs to. */
  savedReportId: string | null;
  maskedEmail: string | null;
  /** Full purchase email -- only for the verified session holder, to prefill Clerk. */
  email: string | null;
};

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

function parseKind(v: unknown): RelationshipKind | null {
  return typeof v === "string" && (GUEST_RELATIONSHIP_KINDS as string[]).includes(v) ? (v as RelationshipKind) : null;
}

/** Same client-side stripping as the member route (no internal prompt context). */
export function stripGuestPremiumForClient(kind: RelationshipKind, payload: unknown): unknown {
  const p = payload as { report?: Record<string, unknown> };
  switch (kind) {
    case "family":
      return stripFamilyContextOutputForClient(p);
    case "work":
      return stripWorkContextOutputForClient(p);
    case "friendship":
      return stripFriendContextOutputForClient(p);
    case "cohabitation":
      return stripMarriageContextOutputForClient(p);
    case "romantic":
      return stripRomanticContextInputForClient(p);
    default:
      return payload;
  }
}

async function readOrder(supabase: SupabaseClient, orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("toss_payment_orders")
    .select("order_id, plan_id, status, guest_email, clerk_user_id, approved_at, locale, guest_use_status, guest_use_enabled, is_test")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    logServerError("guestRelationship", error, "order_read_failed");
    return null;
  }
  return (data as OrderRow | null) ?? null;
}

async function readGuestRow(supabase: SupabaseClient, orderId: string): Promise<GuestRelOrderRow | null> {
  const { data, error } = await supabase.from("guest_relationship_orders").select("*").eq("order_id", orderId).maybeSingle();
  if (error) logServerError("guestRelationship", error, "row_read_failed");
  return (data as GuestRelOrderRow | null) ?? null;
}

type ReportRow = {
  id: string;
  name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
};

function toPersonInput(r: ReportRow | undefined, unknownPlace: string): PersonInput | null {
  if (!r?.birth_date) return null;
  const placeUnknown = !r.birth_place || r.birth_place === unknownPlace;
  return {
    name: r.name,
    birthDate: r.birth_date,
    birthTime: r.birth_time,
    birthTimeUnknown: !r.birth_time,
    birthPlace: placeUnknown ? null : r.birth_place,
    birthPlaceUnknown: placeUnknown,
  };
}

export async function loadGuestRelationshipState(
  supabase: SupabaseClient,
  orderId: string,
): Promise<GuestRelationshipState | null> {
  const order = await readOrder(supabase, orderId);
  if (!order) return null;
  const g = await readGuestRow(supabase, orderId);
  const locale: Locale = (g?.locale ?? order.locale) === "en-US" ? "en-US" : "ko-KR";
  const expiresAt = order.approved_at ? addMonths(order.approved_at, 12) : null;
  const expired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now()) || Boolean(g?.purged_at);
  const kind = parseKind(g?.kind);

  let status: GuestRelationshipState["status"];
  if (!isGuestRelationshipPlan(order.plan_id) || !isGuestUseOrderRow(order) || !order.guest_email) status = "not_available";
  else if (g?.migrated_at) status = "saved";
  else if (order.clerk_user_id) status = "linked";
  else if (order.status !== "paid") status = "not_available";
  else if (expired) status = "expired";
  else if (order.guest_use_status === "used") status = "generated";
  else if (order.guest_use_status === "reserved") status = "generating";
  else if (g?.relationship_report_id && kind && g.partner_consent) status = "ready";
  else status = "needs_input";

  let input: GuestRelationshipState["input"] = null;
  if (g?.self_report_id && g.partner_report_id && status !== "saved" && status !== "expired" && status !== "not_available") {
    const { data: reps } = await supabase
      .from("reports")
      .select("id, name, birth_date, birth_time, birth_place")
      .in("id", [g.self_report_id, g.partner_report_id]);
    const rows = (reps ?? []) as ReportRow[];
    const unknownPlace = getUnknownBirthFallback(locale).place;
    const me = toPersonInput(rows.find((r) => r.id === g.self_report_id), unknownPlace);
    const partner = toPersonInput(rows.find((r) => r.id === g.partner_report_id), unknownPlace);
    if (me && partner) {
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("report_id", g.self_report_id);
      const fam = g.family_options;
      input = {
        me: { ...me, hasSurvey: (count ?? 0) > 0 },
        partner,
        kind,
        familyOptions:
          kind === "family" && fam
            ? { parentType: fam.parent_type === "father" ? "father" : "mother", childIsViewer: fam.child_is_viewer === true }
            : null,
        consented: Boolean(g.partner_consent),
      };
    }
  }

  let result: GuestRelationshipState["result"] = null;
  if (status === "generated" && g?.relationship_report_id && g.self_report_id && kind) {
    const { data: prem } = await supabase
      .from("relationship_premium_reports")
      .select("payload, updated_at")
      .eq("relationship_report_id", g.relationship_report_id)
      .eq("owner_report_id", g.self_report_id)
      .eq("owner_clerk_user_id", guestOrderOwnerKey(orderId))
      .eq("kind", kind)
      .eq("locale", locale)
      .maybeSingle();
    const { data: pair } = await supabase
      .from("relationship_reports")
      .select("report_id_a")
      .eq("id", g.relationship_report_id)
      .maybeSingle();
    if (prem?.payload) {
      const v4Enabled = kind === "romantic" && isRomanticV4ReportEnabled();
      result = {
        kind,
        payload: stripGuestPremiumForClient(kind, prem.payload),
        generatedAt: g.generated_at ?? (prem.updated_at as string | null),
        romanticV4: v4Enabled
          ? resolveRomanticV4ForResponse(
              mergePremiumKindLocale({}, kind, locale, prem.payload as never) as unknown as Record<string, unknown>,
              locale,
            )
          : null,
        romanticV4Enabled: v4Enabled,
        viewerIsReportA: (pair as { report_id_a?: string } | null)?.report_id_a === g.self_report_id,
      };
    }
  }

  return {
    status,
    product: "relationship",
    isTest: order.is_test === true,
    planId: order.plan_id,
    locale,
    surveyRequired: isPsychSurveyRequired(locale),
    expiresAt,
    input,
    result,
    savedRelationshipId: status === "saved" ? (g?.relationship_report_id ?? null) : null,
    savedReportId: status === "saved" ? (g?.self_report_id ?? null) : null,
    maskedEmail: order.guest_email ? maskEmail(order.guest_email) : null,
    email: status === "saved" ? null : order.guest_email,
  };
}

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parsePerson(raw: unknown, requireName: boolean): PersonInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, 40) : "";
  if (requireName && !name) return null;
  const birthDate = typeof r.birthDate === "string" ? r.birthDate.trim() : "";
  if (!BIRTH_RE.test(birthDate) || Number.isNaN(Date.parse(`${birthDate}T00:00:00Z`))) return null;
  const birthTimeUnknown = r.birthTimeUnknown === true;
  const birthTime = typeof r.birthTime === "string" ? r.birthTime.trim() : "";
  if (!birthTimeUnknown && !TIME_RE.test(birthTime)) return null;
  const birthPlaceUnknown = r.birthPlaceUnknown === true;
  const birthPlace = typeof r.birthPlace === "string" ? r.birthPlace.trim().slice(0, 200) : "";
  if (!birthPlaceUnknown && !birthPlace) return null;
  return {
    name: name || null,
    birthDate,
    birthTime: birthTimeUnknown ? null : birthTime,
    birthTimeUnknown,
    birthPlace: birthPlaceUnknown ? null : birthPlace,
    birthPlaceUnknown,
  };
}

export type GuestRelationshipInputBody = {
  me?: unknown;
  partner?: unknown;
  kind?: unknown;
  familyParentType?: unknown;
  familyChildIsViewer?: unknown;
  /** Required: the notice / consent for entering the other person's info. */
  partnerConsent?: unknown;
  surveyAnswers?: unknown;
  keepSurvey?: unknown;
};

export type GuestRelationshipInputResult =
  | { ok: true }
  | { ok: false; code: "invalid_input" | "consent_required" | "survey_required" | "locked" | "expired" | "claimed" | "not_eligible" | "error" };

function reportPatch(p: PersonInput, orderId: string, locale: Locale) {
  const place = p.birthPlaceUnknown ? getUnknownBirthFallback(locale).place : p.birthPlace;
  return mergeBirthCoordinateFields(
    {
      name: p.name,
      birth_date: p.birthDate,
      birth_time: p.birthTimeUnknown ? null : p.birthTime,
      birth_place: place,
    },
    place,
    locale,
  ) as Record<string, unknown> & { report_type?: string; clerk_user_id?: string; entitlement?: string };
}

/**
 * Stores / replaces both people's info before generation. After a generation
 * (or while one is reserved) nothing can be changed -- the report stays
 * tied to the info it was made with.
 */
export async function saveGuestRelationshipInput(
  supabase: SupabaseClient,
  orderId: string,
  locale: Locale,
  body: GuestRelationshipInputBody,
): Promise<GuestRelationshipInputResult> {
  const me = parsePerson(body.me, false);
  const partner = parsePerson(body.partner, true);
  const kind = parseKind(body.kind);
  if (!me || !partner || !kind) return { ok: false, code: "invalid_input" };
  if (body.partnerConsent !== true) return { ok: false, code: "consent_required" };

  let survey: SurveyAnswersInput | null = null;
  const keepSurvey = body.keepSurvey === true;
  if (body.surveyAnswers && typeof body.surveyAnswers === "object" && !Array.isArray(body.surveyAnswers)) {
    if (JSON.stringify(body.surveyAnswers).length > 20_000) return { ok: false, code: "invalid_input" };
    if (!isSurveyV2AnswersComplete(body.surveyAnswers as Record<string, string>)) return { ok: false, code: "invalid_input" };
    survey = body.surveyAnswers as SurveyAnswersInput;
  }

  const { data: prep, error: prepErr } = await supabase.rpc("prepare_guest_relationship_input", {
    p_order_id: orderId,
    p_locale: locale,
  });
  if (prepErr) {
    logServerError("guestRelationship", prepErr, "prepare_failed");
    return { ok: false, code: "error" };
  }
  const prepared = rpcText(prep);
  if (prepared !== "ok") {
    const code = prepared === "locked" || prepared === "expired" || prepared === "claimed" ? prepared : "not_eligible";
    return { ok: false, code };
  }

  const g = await readGuestRow(supabase, orderId);
  if (!g) return { ok: false, code: "error" };
  const rowLocale: Locale = g.locale === "en-US" ? "en-US" : "ko-KR";

  if (isPsychSurveyRequired(rowLocale) && !survey) {
    let stored = false;
    if (keepSurvey && g.self_report_id) {
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("report_id", g.self_report_id);
      stored = (count ?? 0) > 0;
    }
    if (!stored) return { ok: false, code: "survey_required" };
  }

  const owner = guestOrderOwnerKey(orderId);
  const created: string[] = [];
  try {
    let selfId = g.self_report_id;
    let partnerId = g.partner_report_id;
    for (const [person, current, assign] of [
      [me, selfId, (id: string) => (selfId = id)],
      [partner, partnerId, (id: string) => (partnerId = id)],
    ] as const) {
      const patch = reportPatch(person, orderId, rowLocale);
      if (current) {
        const { error } = await updateReportPatchSafely(supabase, current, patch);
        if (error) throw error;
      } else {
        const { data, error } = await insertReportPatchSafely(supabase, {
          ...patch,
          report_type: "guest_purchase",
          entitlement: "free",
          // Never a Clerk id: no member route ever treats this row as owned.
          clerk_user_id: owner,
        });
        if (error || !data?.id) throw error ?? new Error("guest report not created");
        created.push(data.id);
        assign(data.id);
      }
    }
    if (!selfId || !partnerId) throw new Error("guest reports missing");

    if (survey) {
      const profile = scoreSurveyAnswers(survey);
      const { error } = await supabase.from("survey_responses").insert({
        report_id: selfId,
        answers: { ...survey, v2_profile: profile, survey_source: "v2_10q" },
      });
      if (error) throw error;
    } else if (!keepSurvey && g.self_report_id) {
      // "Continue without the survey" before generation: temporary guest
      // answers only (never an account's data).
      await supabase.from("survey_responses").delete().eq("report_id", selfId);
    }

    let relationshipReportId = g.relationship_report_id;
    if (!relationshipReportId) {
      const ensured = await ensureRelationshipReport(supabase, selfId, partnerId);
      relationshipReportId = ensured.relationshipReportId;
    }
    await supabase.from("relationship_reports").update({ relationship_kind: kind }).eq("id", relationshipReportId);

    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("guest_relationship_orders")
      .update({
        self_report_id: selfId,
        partner_report_id: partnerId,
        relationship_report_id: relationshipReportId,
        kind,
        family_options:
          kind === "family"
            ? { parent_type: body.familyParentType === "father" ? "father" : "mother", child_is_viewer: body.familyChildIsViewer === true }
            : null,
        partner_consent: { third_party_info: true, at: now, locale: rowLocale, version: PARTNER_CONSENT_VERSION },
        updated_at: now,
      })
      .eq("order_id", orderId)
      .is("generated_at", null);
    if (upErr) throw upErr;
    return { ok: true };
  } catch (e) {
    logServerError("guestRelationship", e, "input_save_failed");
    for (const id of created) {
      await supabase.from("reports").delete().eq("id", id).eq("report_type", "guest_purchase");
    }
    return { ok: false, code: "error" };
  }
}

/**
 * The guest "who is generating" for the shared relationship premium handler:
 * the viewer must be THIS order's own "me" row in THIS order's relationship,
 * and the order's single use is reserved / used / released in SQL.
 */
export function guestPremiumRequester(orderId: string, g: { self_report_id: string; relationship_report_id: string }): PremiumRequester {
  const owner = guestOrderOwnerKey(orderId);
  let reserveResult: string | null = null;
  return {
    ownerKey: owner,
    rateLimitKey: owner,
    assertViewer: async (supabase, viewerReportId, a, b, locale) => {
      const { data: rr } = await supabase
        .from("relationship_reports")
        .select("id")
        .eq("id", g.relationship_report_id)
        .eq("report_id_a", a)
        .eq("report_id_b", b)
        .maybeSingle();
      if (viewerReportId !== g.self_report_id || (a !== viewerReportId && b !== viewerReportId) || !rr) {
        return NextResponse.json({ error: getMessages(locale).errors.forbidden }, { status: 403 });
      }
      return null;
    },
    loadClerkUser: async () => null,
    reserve: async (supabase, p) => {
      if (p.relationshipReportId !== g.relationship_report_id) return { ok: false };
      const { data, error } = await supabase.rpc("reserve_guest_relationship_use", {
        p_order_id: orderId,
        p_request_id: p.generationRequestId,
      });
      if (error) {
        logServerError("guestRelationship", error, "reserve_failed");
        return { ok: false };
      }
      reserveResult = rpcText(data);
      return { ok: reserveResult === "reserved" };
    },
    consume: async (supabase, requestId) => {
      const { error } = await supabase.rpc("complete_guest_relationship_use", { p_order_id: orderId, p_request_id: requestId });
      if (error) logServerError("guestRelationship", error, "complete_failed");
    },
    release: async (supabase, requestId) => {
      await supabase.rpc("release_guest_relationship_use", { p_order_id: orderId, p_request_id: requestId });
    },
  };
}

/** Builds the handler request ONLY from the stored order (never from the client body). */
export async function buildGuestPremiumRequest(
  supabase: SupabaseClient,
  orderId: string,
): Promise<{ ok: true; body: Record<string, unknown>; requester: PremiumRequester; locale: Locale } | { ok: false; code: "no_input" | "not_eligible" }> {
  const g = await readGuestRow(supabase, orderId);
  const kind = parseKind(g?.kind);
  if (!g || !g.self_report_id || !g.relationship_report_id || !kind || !g.partner_consent) return { ok: false, code: "no_input" };
  const locale: Locale = g.locale === "en-US" ? "en-US" : "ko-KR";
  const body: Record<string, unknown> = {
    relationship_report_id: g.relationship_report_id,
    viewer_report_id: g.self_report_id,
    relationship_kind: kind,
    locale,
  };
  if (kind === "family") {
    body.parent_type = g.family_options?.parent_type === "father" ? "father" : "mother";
    body.child_is_viewer = g.family_options?.child_is_viewer === true;
  }
  return {
    ok: true,
    body,
    locale,
    requester: guestPremiumRequester(orderId, { self_report_id: g.self_report_id, relationship_report_id: g.relationship_report_id }),
  };
}

/** Saves a used guest Relationship order into the signed-in account (verified matching email only). */
export async function saveGuestRelationshipToAccount(
  supabase: SupabaseClient,
  params: { orderId: string; clerkUserId: string; verifiedEmails: string[] },
): Promise<{ result: string; reportId: string | null; relationshipReportId: string | null }> {
  const emails = [...new Set(params.verifiedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const { data, error } = await supabase.rpc("save_guest_relationship_to_account", {
    p_order_id: params.orderId,
    p_clerk_user_id: params.clerkUserId,
    p_verified_emails: emails,
  });
  if (error) {
    logServerError("guestRelationship", error, "save_to_account_failed");
    return { result: "error", reportId: null, relationshipReportId: null };
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | { result?: string; report_id?: string | null; relationship_report_id?: string | null }
    | undefined;
  return { result: row?.result ?? "error", reportId: row?.report_id ?? null, relationshipReportId: row?.relationship_report_id ?? null };
}

